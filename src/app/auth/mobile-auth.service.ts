import { Injectable, signal } from '@angular/core';
import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { Capacitor, CapacitorHttp, registerPlugin } from '@capacitor/core';
import { getApiConfiguration } from './api-config';
import { authPlatform, MSAL_CLIENT_ID, MSAL_EXTERNAL_TENANT_NAME, MSAL_AUTHORITY } from './entra-settings';
import { EntraNativeSession, NativeAuthBridge, NativeOutcome, NativeStart, NativeSubmission } from './entra-native-core';
import { loadNativeAuthRedirect, NativeAuthConfigError } from './native-auth-config';
import { MobileAuthError, MobileAuthSession } from './mobile-auth-core';

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
  readonly native = authPlatform(Capacitor.getPlatform()) === 'native';
  readonly signedIn = signal(false);
  readonly error = signal<string | null>(null);
  readonly nativeOutcome = signal<NativeOutcome>({ step: 'login' });
  readonly requestedFlow = signal<'signin' | 'signup' | null>(null);
  private readonly sdk = registerPlugin<NativeAuthBridge>('EntraNativeAuth');
  private readonly sdkSession = new EntraNativeSession(this.sdk);
  private sdkInitialization: Promise<void> | null = null;
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
        authority: MSAL_AUTHORITY, scopes: [getApiConfiguration().apiScope] });
      await App.addListener('appStateChange', ({ isActive }) => {
        if (!isActive && !this.browserMode && this.signedIn()) {
          this.signedIn.set(false);
          void this.sdkSession.lock().finally(() => this.nativeOutcome.set(this.sdkSession.outcome));
        }
      });
      this.applyOutcome(await this.sdkSession.restore());
    })().catch(() => { this.sdkInitialization = null; throw new Error('Accesso nativo non disponibile. Riprova.'); });
  }

  private applyOutcome(outcome: NativeOutcome): void {
    this.nativeOutcome.set(outcome);
    this.signedIn.set(outcome.step === 'authenticated');
    if (outcome.step === 'authenticated') this.sequence++;
  }

  async startNative(options: NativeStart): Promise<void> {
    await this.initialize();
    this.browserMode = false;
    this.error.set(null);
    this.applyOutcome(await this.sdkSession.start(options));
  }
  async submitNative(options: NativeSubmission): Promise<void> { this.applyOutcome(await this.sdkSession.submit(options)); }
  async resendNative(): Promise<void> { this.applyOutcome(await this.sdkSession.resend()); }
  async unlockNative(): Promise<void> { this.applyOutcome(await this.sdkSession.unlock()); }
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
    await App.addListener('appUrlOpen', ({ url }) => { void this.session?.callback(url); });
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
    if (!this.browserMode) return this.tokenPromise ??= this.sdkSession.accessToken().finally(() => { this.tokenPromise = null; });
    if (!this.session) return Promise.reject(new MobileAuthError('expired'));
    return this.session.accessToken().catch(() => { this.error.set(MOBILE_AUTH_MESSAGES['expired']); throw new MobileAuthError('expired'); });
  }

  logout(): void {
    this.session?.logout();
    this.browserMode = false;
    this.signedIn.set(false);
    this.error.set(null);
    this.requestedFlow.set(null);
    this.nativeOutcome.set({ step: 'login' });
    void this.sdkSession.logout().catch(() => this.error.set('Disconnessione non completata. Riprova prima di chiudere l\'app.'));
  }
}
