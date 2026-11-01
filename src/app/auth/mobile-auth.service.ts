import { Injectable, signal } from '@angular/core';
import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { Capacitor, CapacitorHttp } from '@capacitor/core';
import { getApiConfiguration } from './api-config';
import { authPlatform } from './entra-settings';
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
  private session: MobileAuthSession | null = null;
  private initialization: Promise<void> | null = null;
  private loginPromise: Promise<void> | null = null;
  private sequence = 0;
  get sessionKey(): string { return `native:${this.sequence}`; }

  initialize(): Promise<void> {
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

  async login(): Promise<void> {
    if (this.loginPromise) return this.loginPromise;
    this.error.set(null);
    this.loginPromise = (async () => {
      try { await this.initialize(); await this.session!.login(); this.sequence++; this.error.set(null); }
      catch (error) {
        this.error.set(MOBILE_AUTH_MESSAGES[error instanceof MobileAuthError ? error.code : 'network']);
        throw new Error(this.error()!);
      } finally { this.loginPromise = null; }
    })();
    return this.loginPromise;
  }

  accessToken(): Promise<string> {
    if (!this.session) return Promise.reject(new MobileAuthError('expired'));
    return this.session.accessToken().catch(() => { this.error.set(MOBILE_AUTH_MESSAGES['expired']); throw new MobileAuthError('expired'); });
  }

  logout(): void { this.session?.logout(); this.signedIn.set(false); this.error.set(null); }
}
