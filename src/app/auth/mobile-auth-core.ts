import { AuthorizationRequest } from '@openid/appauth/built/src/authorization_request';
import { AuthorizationServiceConfiguration } from '@openid/appauth/built/src/authorization_service_configuration';
import { BaseTokenRequestHandler } from '@openid/appauth/built/src/token_request_handler';
import { TokenRequest } from '@openid/appauth/built/src/token_request';
import { Requestor } from '@openid/appauth/built/src/xhr';
import { Flags } from '@openid/appauth/built/src/flags';
import { DefaultCrypto, urlSafe } from '@openid/appauth/built/src/crypto_utils';
import { sha256 } from '@noble/hashes/sha2.js';
import { MSAL_AUTHORITY, MSAL_CLIENT_ID } from './entra-settings';

Flags.IS_LOG = false;
Flags.IS_PROFILE = false;

export type MobileErrorCode = 'cancelled' | 'callback' | 'token' | 'network' | 'expired' | 'configuration';
export class MobileAuthError extends Error {
  constructor(readonly code: MobileErrorCode) { super(code); }
}

export interface NativeAuthTransport {
  open(url: string): Promise<void>;
  close(): Promise<void>;
  request(url: string, method: string, data?: string): Promise<unknown>;
  changed(): void;
}

export function parseMobileCallback(raw: string, redirect: string, state: string): string {
  const url = new URL(raw), expected = new URL(redirect);
  if (url.protocol !== expected.protocol || url.host !== expected.host || url.pathname !== expected.pathname ||
      url.username || url.password || url.hash || !state ||
      url.searchParams.getAll('state').length !== 1 || url.searchParams.get('state') !== state ||
      url.searchParams.getAll('code').length > 1 || url.searchParams.getAll('error').length > 1)
    throw new MobileAuthError('callback');
  if (url.searchParams.has('error')) throw new MobileAuthError(url.searchParams.get('error') === 'access_denied' ? 'cancelled' : 'token');
  const code = url.searchParams.get('code');
  if (!code) throw new MobileAuthError('callback');
  return code;
}

class NativeRequestor extends Requestor {
  constructor(private readonly transport: NativeAuthTransport) { super(); }
  override async xhr<T>(settings: { url?: string; method?: string; data?: string }): Promise<T> {
    return await this.transport.request(settings.url!, settings.method ?? 'GET', settings.data) as T;
  }
}

// WKWebView custom origins may lack SubtleCrypto. AppAuth still owns PKCE;
// its crypto adapter delegates SHA-256 to Noble, never to a weak fallback.
class WebViewCrypto extends DefaultCrypto {
  override deriveChallenge(code: string): Promise<string> {
    return Promise.resolve(urlSafe(sha256(new TextEncoder().encode(code))));
  }
}

// Intentionally memory-only: process death discards credentials and PKCE together.
export class MobileAuthSession {
  private pending: { request: AuthorizationRequest; resolve: () => void; reject: (error: Error) => void; timer: ReturnType<typeof setTimeout> } | null = null;
  private tokens: { access: string; refresh?: string; expires: number } | null = null;
  private config: AuthorizationServiceConfiguration | null = null;
  private generation = 0;
  private refreshing: Promise<string> | null = null;
  private exchanging = false;
  private readonly handler: BaseTokenRequestHandler;

  constructor(private readonly transport: NativeAuthTransport, readonly redirect: string, readonly scope: string) {
    this.handler = new BaseTokenRequestHandler(new NativeRequestor(transport));
  }

  get signedIn(): boolean { return Boolean(this.tokens); }

  private async configuration(): Promise<AuthorizationServiceConfiguration> {
    if (this.config) return this.config;
    const data = await this.transport.request(`${MSAL_AUTHORITY}/v2.0/.well-known/openid-configuration`, 'GET') as Record<string, unknown>;
    for (const key of ['authorization_endpoint', 'token_endpoint']) {
      const endpoint = new URL(String(data[key]));
      if (endpoint.protocol !== 'https:' || endpoint.origin !== new URL(MSAL_AUTHORITY).origin ||
          !endpoint.pathname.startsWith(new URL(MSAL_AUTHORITY).pathname + '/')) throw new MobileAuthError('configuration');
    }
    this.config = new AuthorizationServiceConfiguration({
      authorization_endpoint: String(data['authorization_endpoint']),
      token_endpoint: String(data['token_endpoint']), revocation_endpoint: ''
    });
    return this.config;
  }

  async login(): Promise<void> {
    if (this.pending || this.exchanging) throw new MobileAuthError('callback');
    this.logout();
    const generation = this.generation;
    if (!globalThis.crypto?.getRandomValues) throw new MobileAuthError('configuration');
    const config = await this.configuration();
    const request = new AuthorizationRequest({ client_id: MSAL_CLIENT_ID, redirect_uri: this.redirect,
      response_type: 'code', state: new DefaultCrypto().generateRandom(64),
      scope: `openid profile email offline_access ${this.scope}`, extras: { prompt: 'select_account', response_mode: 'query' } }, new WebViewCrypto());
    await request.setupCodeVerifier();
    if (generation !== this.generation) throw new MobileAuthError('cancelled');
    if (!request.internal?.['code_verifier'] || !request.extras?.['code_challenge'] ||
        request.extras['code_challenge_method'] !== 'S256') throw new MobileAuthError('configuration');
    const url = new URL(config.authorizationEndpoint);
    const values = { client_id: request.clientId, redirect_uri: request.redirectUri, scope: request.scope,
      response_type: request.responseType, state: request.state, ...request.extras };
    for (const [key, value] of Object.entries(values)) url.searchParams.set(key, value);
    return new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => this.cancel('expired'), 5 * 60_000);
      this.pending = { request, resolve, reject, timer };
      void this.transport.open(url.toString()).catch(() => this.cancel('network'));
    });
  }

  async callback(url: string): Promise<void> {
    if (!this.pending || this.exchanging) return;
    const pending = this.pending;
    let code: string;
    try { code = parseMobileCallback(url, this.redirect, pending.request.state); }
    catch (error) { this.cancel(error instanceof MobileAuthError ? error.code : 'callback'); return; }
    this.pending = null;
    clearTimeout(pending.timer);
    this.exchanging = true;
    const generation = this.generation;
    void this.transport.close().catch(() => undefined);
    try {
      const result = await this.handler.performTokenRequest(await this.configuration(), new TokenRequest({
        client_id: MSAL_CLIENT_ID, redirect_uri: this.redirect, grant_type: 'authorization_code', code,
        extras: { code_verifier: pending.request.internal!['code_verifier'] }
      }));
      if (generation !== this.generation) throw new MobileAuthError('cancelled');
      this.accept(result);
      pending.resolve();
    } catch (error) { pending.reject(error instanceof MobileAuthError ? error : new MobileAuthError('token')); }
    finally { pending.request.internal = undefined; this.exchanging = false; }
  }

  async accessToken(): Promise<string> {
    if (!this.tokens) throw new MobileAuthError('expired');
    if (this.tokens.expires > Date.now() + 60_000) return this.tokens.access;
    if (this.refreshing) return this.refreshing;
    const refresh = this.tokens.refresh, generation = this.generation;
    if (!refresh) { this.logout(); throw new MobileAuthError('expired'); }
    this.refreshing = (async () => {
      try {
        const result = await this.handler.performTokenRequest(await this.configuration(), new TokenRequest({
          client_id: MSAL_CLIENT_ID, redirect_uri: this.redirect, grant_type: 'refresh_token', refresh_token: refresh,
          extras: { scope: `openid profile email offline_access ${this.scope}` }
        }));
        if (generation !== this.generation) throw new MobileAuthError('expired');
        this.accept(result, refresh);
        return this.tokens!.access;
      } catch { if (generation === this.generation) this.logout(); throw new MobileAuthError('expired'); }
      finally { this.refreshing = null; }
    })();
    return this.refreshing;
  }

  private accept(result: { accessToken: string; tokenType: string; expiresIn?: number; refreshToken?: string }, refresh?: string): void {
    if (!result.accessToken || result.tokenType.toLowerCase() !== 'bearer' ||
        !Number.isFinite(result.expiresIn) || result.expiresIn! <= 0) throw new MobileAuthError('token');
    // Never fall back to idToken, even when no access_token is returned.
    this.tokens = { access: result.accessToken, refresh: result.refreshToken ?? refresh, expires: Date.now() + result.expiresIn! * 1000 };
    this.transport.changed();
  }

  cancel(code: MobileErrorCode = 'cancelled'): void {
    const pending = this.pending;
    this.pending = null;
    if (pending) { clearTimeout(pending.timer); pending.request.internal = undefined; pending.reject(new MobileAuthError(code)); }
    if (pending) void this.transport.close().catch(() => undefined);
  }

  logout(): void {
    this.generation++;
    this.cancel();
    this.tokens = null;
    this.transport.changed();
  }
}
