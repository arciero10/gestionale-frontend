import { Injectable, Injector, inject, signal } from '@angular/core';
import { CurrentUserService } from './current-user.service';
import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { Capacitor, CapacitorHttp, registerPlugin } from '@capacitor/core';
import { getApiConfiguration } from './api-config';
import { authPlatform, MSAL_CLIENT_ID, MSAL_EXTERNAL_TENANT_NAME, MSAL_AUTHORITY, MOBILE_REAUTHENTICATION_DAYS } from './entra-settings';
import { EntraNativeSession, NativeAuthBridge, NativeOutcome, NativeStart, NativeSubmission } from './entra-native-core';
import { loadNativeAuthRedirect, NativeAuthConfigError } from './native-auth-config';
import { MobileAuthError, MobileAuthSession } from './mobile-auth-core';
import { parseInvitationDeepLink } from './invitation-link';
import { nativeAuthDiagnostic } from './native-auth-diagnostics';

export const MOBILE_AUTH_MESSAGES = {
  cancelled: 'Accesso annullato. Puoi riprovare.',
  callback: 'Il collegamento di accesso non e valido. Avvia un nuovo accesso.',
  token: 'Non e stato possibile completare l\'accesso. Riprova.',
  network: 'Connessione non disponibile. Controlla la rete e riprova.',
  expired: 'Sessione scaduta. Accedi nuovamente.',
  configuration: 'Accesso mobile non ancora configurato per questa app.'
};

@Injectable({ providedIn: 'root' })
export class MobileAuthService {
  private readonly injector = inject(Injector);
  private logoutPromise: Promise<void> | null = null;
  readonly native = authPlatform(Capacitor.getPlatform()) === 'native';
  readonly signedIn = signal(false);
  readonly error = signal<string | null>(null);
  readonly diagnostic = signal<ReturnType<typeof nativeAuthDiagnostic>>(null);
  readonly nativeOutcome = signal<NativeOutcome>({ step: 'login' });
  readonly requestedFlow = signal<'signin' | 'signup' | null>(null);
  readonly accessing = signal(false);
  readonly lockGeneration = signal(0);
  private accessAttempt: Promise<boolean> | null = null;
  private readonly sdk = registerPlugin<NativeAuthBridge>('EntraNativeAuth');
  private readonly sdkSession = new EntraNativeSession(this.sdk);
  private sdkInitialization: Promise<void> | null = null;
  private nativeLifecycle: Promise<unknown> | null = null;
  private browserMode = false;
  private tokenPromise: Promise<string> | null = null;
  private session: MobileAuthSession | null = null;
  private initialization: Promise<void> | null = null;
  private loginPromise: Promise<void> | null = null;
  private sequence = 0;
  get sessionKey(): string { return `native:${this.sequence}`; }

  initialize(): Promise<void> {
    if (!this.native) return Promise.resolve();
    return this.sdkInitialization ??= (async () => {
      await this.sdk.configure({ clientId: MSAL_CLIENT_ID, tenantSubdomain: MSAL_EXTERNAL_TENANT_NAME,
        authority: MSAL_AUTHORITY, scopes: [getApiConfiguration().apiScope], reauthenticationDays: MOBILE_REAUTHENTICATION_DAYS });
      await (this.nativeLifecycle ??= App.addListener('appStateChange', ({ isActive }) => {
        if (!isActive && !this.browserMode && !this.accessing() &&
            (this.signedIn() || (!this.requestedFlow() && ['unlock', 'login'].includes(this.nativeOutcome().step)))) {
          const wasSignedIn = this.signedIn();
          this.signedIn.set(false);
          this.sequence++;
          this.requestedFlow.set(null);
          this.error.set(null); this.diagnostic.set(null);
          this.lockGeneration.update(value => value + 1);
          if (wasSignedIn) void this.sdkSession.lock().catch(() => {
            this.error.set('Sessione bloccata. Riprova lo sblocco.');
          }).finally(() => this.nativeOutcome.set(this.sdkSession.outcome));
        }
      }).catch(error => { this.nativeLifecycle = null; throw error; }));
      this.applyOutcome(await this.sdkSession.restore());
    })().catch(error => { this.sdkInitialization = null; throw error; });
  }

  private applyOutcome(outcome: NativeOutcome): void {
    console.info('[AUTH native] account obtained', outcome.step === 'authenticated');
    this.nativeOutcome.set(outcome);
    this.signedIn.set(outcome.step === 'authenticated');
    if (outcome.step === 'authenticated') this.sequence++;
  }

  async startNative(options: NativeStart): Promise<void> {
    await this.initialize();
    const flow = this.requestedFlow();
    this.clearApplicationSession(true);
    this.requestedFlow.set(flow ?? 'signin');
    this.browserMode = false;
    this.error.set(null);
    this.applyOutcome(await this.sdkSession.start(options));
  }
  async submitNative(options: NativeSubmission): Promise<void> {
    const startedAt = performance.now();
    const outcome = await this.sdkSession.submit(options);
    if (options.code) console.info('[AUTH native] OTP completed', ['authenticated', 'password', 'attributes', 'complete', 'unlock'].includes(outcome.step));
    this.applyOutcome(outcome);
    console.info('[AUTH timing] native challenge completed', { elapsedMs: Math.round(performance.now()-startedAt), authenticated: outcome.step === 'authenticated' });
  }
  async resendNative(): Promise<void> { this.applyOutcome(await this.sdkSession.resend()); }
  async unlockNative(): Promise<void> {
    const outcome = await this.sdkSession.unlock();
    this.applyOutcome(outcome);
  }
  accessFromWelcome(): Promise<boolean> {
    return this.accessAttempt ??= this.performWelcomeAccess().finally(() => { this.accessAttempt = null; });
  }
  private async performWelcomeAccess(): Promise<boolean> {
    this.accessing.set(true); this.error.set(null); this.diagnostic.set(null);
    let restored = false;
    try {
      await this.initialize();
      restored = true;
      if (this.sdkSession.signedIn) {
        if (this.signedIn()) return true;
        await this.sdkSession.cancel();
        this.applyOutcome(this.sdkSession.outcome);
      }
      if (this.sdkSession.outcome.step === 'unlock') {
        await this.unlockNative();
        if (this.signedIn()) return true;
      }
      this.requestLogin();
      return false;
    } catch (error) {
      const code = (error as { code?: string })?.code;
      if (['AUTH_LOCAL_UNAVAILABLE', 'UNLOCK_UNAVAILABLE', 'UNLOCK_REQUIRED', 'AUTH_CACHE_ACCOUNT_MISSING', 'AUTH_TOKEN_INTERACTION_REQUIRED', 'AUTH_TOKEN_EXPIRED', 'SESSION_EXPIRED'].includes(code ?? '')) {
        try { await this.sdkSession.cancel(); }
        catch { this.error.set('Operazione interrotta. Riprova. Codice assistenza: NATIVE-unlock-CANCEL_FAILED'); return false; }
        this.applyOutcome(this.sdkSession.outcome);
        this.requestLogin();
      } else {
        const diagnostic = nativeAuthDiagnostic(error) ?? nativeAuthDiagnostic({
          code: restored ? code === 'CANCELLED' ? 'AUTH_LOCAL_CANCELLED' : 'AUTH_UNLOCK_FAILED' : 'AUTH_CONFIGURATION',
          data: { platform: Capacitor.getPlatform(), phase: restored ? 'unlock' : 'configuration' }
        });
        this.diagnostic.set(diagnostic);
        this.error.set(diagnostic?.message ?? (code === 'CANCELLED' ? 'Sblocco annullato. Puoi riprovare.' : 'Sblocco non completato. Riprova.'));
      }
      return false;
    } finally { this.accessing.set(false); }
  }
  async cancelNative(): Promise<void> {
    this.requestedFlow.set(null);
    await this.sdkSession.cancel();
    this.applyOutcome(this.sdkSession.outcome);
  }
  requestLogin(flow: 'signin' | 'signup' = 'signin'): void { this.requestedFlow.set(flow); }

  private initializeBrowser(): Promise<void> {
    if (!this.native) return Promise.resolve();
    return this.initialization ??= this.setup().catch(error => {
      this.initialization = null;
      if (error instanceof NativeAuthConfigError) {
        console.warn('[AUTH native] configuration unavailable:', error.reason);
        throw new MobileAuthError('configuration');
      }
      console.warn('[AUTH native] initialization failed: native-plugin');
      throw new MobileAuthError('token');
    });
  }

  private async setup(): Promise<void> {
    const platform = Capacitor.getPlatform();
    const redirect = await loadNativeAuthRedirect(platform, document.baseURI);
    this.session = new MobileAuthSession({
      open: url => Browser.open({ url }),
      close: async () => { if (platform === 'ios') await Browser.close(); },
      request: async (url, method, data) => {
        const response = await CapacitorHttp.request({ url, method, data, connectTimeout: 15000, readTimeout: 15000,
          headers: data ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}, responseType: 'json' })
          .catch(() => { throw new MobileAuthError('network'); });
        if (response.status < 200 || response.status >= 300) throw new MobileAuthError('token');
        return response.data;
      },
      changed: () => this.signedIn.set(this.session?.signedIn ?? false)
    }, redirect, getApiConfiguration().apiScope);
    await App.addListener('appUrlOpen', ({ url }) => { if(!parseInvitationDeepLink(url))void this.session?.callback(url); });
    await Browser.addListener('browserFinished', () => this.session?.cancel());
    await App.addListener('appStateChange', ({ isActive }) => {
      if (isActive && platform === 'android') setTimeout(() => this.session?.cancel(), 2000);
    });
    // No persisted transaction: a callback after process death cannot be redeemed.
    const launch = await App.getLaunchUrl();
    if (launch?.url?.startsWith(redirect)) this.error.set(MOBILE_AUTH_MESSAGES['expired']);
  }

  async loginWithBrowserFallback(): Promise<void> {
    if (this.nativeOutcome().step !== 'fallback') throw new Error('Accesso browser non richiesto.');
    if (this.loginPromise) return this.loginPromise;
    this.error.set(null);
    this.loginPromise = (async () => {
      try { this.browserMode = true; await this.initializeBrowser(); await this.session!.login(); this.sequence++; this.error.set(null); }
      catch (error) {
        this.error.set(MOBILE_AUTH_MESSAGES[error instanceof MobileAuthError ? error.code : 'network']);
        throw new Error(this.error()!);
      } finally { this.loginPromise = null; }
    })();
    return this.loginPromise;
  }

  accessToken(): Promise<string> {
    const startedAt = performance.now();
    if (!this.browserMode) return this.tokenPromise ??= this.sdkSession.accessToken().then(token => {
      this.diagnostic.set(null);
      console.info('[AUTH timing] API token ready', { elapsedMs: Math.round(performance.now()-startedAt), obtained: Boolean(token) });
      return token;
    }).catch(async error => {
      console.info('[AUTH native] API access token obtained', false);
      const diagnostic = nativeAuthDiagnostic(error) ?? nativeAuthDiagnostic({ code: 'AUTH_TOKEN_FAILED',
        data: { platform: Capacitor.getPlatform(), phase: 'token' } });
      this.diagnostic.set(diagnostic);
      this.error.set(diagnostic?.message ?? MOBILE_AUTH_MESSAGES.token);
      if (diagnostic) console.info('[AUTH diagnostic]', { code: diagnostic.code, phase: diagnostic.phase, serverCodes: diagnostic.serverCodes });
      if (error?.code === 'SESSION_EXPIRED') {
        this.signedIn.set(false);
        this.diagnostic.set({ code: 'AUTH_TOKEN_EXPIRED', reference: 'NATIVE-token-AUTH_TOKEN_EXPIRED',
          message: MOBILE_AUTH_MESSAGES.expired, phase: 'token', serverCodes: [] });
        this.error.set(MOBILE_AUTH_MESSAGES.expired);
      }
      throw error;
    }).finally(() => { this.tokenPromise = null; });
    if (!this.session) return Promise.reject(new MobileAuthError('expired'));
    return this.session.accessToken().catch(() => { this.error.set(MOBILE_AUTH_MESSAGES['expired']); throw new MobileAuthError('expired'); });
  }

  logout(preserveLoginPanel = false): Promise<void> {
    if (this.logoutPromise) return this.logoutPromise;
    this.clearApplicationSession(preserveLoginPanel);
    this.logoutPromise = this.sdkSession.logout().catch(() => {
      this.error.set('Disconnessione non completata. Riprova prima di accedere con un altro account.');
      throw new Error(this.error()!);
    }).finally(() => { this.logoutPromise = null; });
    return this.logoutPromise;
  }

  private clearApplicationSession(preserveLoginPanel: boolean): void {
    this.session?.logout();
    this.sequence++;
    this.tokenPromise = null;
    this.injector.get(CurrentUserService).reset();
    this.browserMode = false;
    this.signedIn.set(false);
    this.error.set(null);
    this.requestedFlow.set(preserveLoginPanel ? this.requestedFlow() ?? 'signin' : null);
    this.diagnostic.set(null);
    this.nativeOutcome.set({ step: 'login' });
  }
}
