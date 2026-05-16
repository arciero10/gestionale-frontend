import { Component, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { AuthenticationResult } from '@azure/msal-browser';
import { MsalService } from '@azure/msal-angular';
import { AuthService } from './app/auth/auth.service';
import { MSAL_AUTHORITY } from './app.config';
import { hasSelectedCommunity } from './app/features/gestionaleCN/data/community-selection.storage';
import { catchError, filter, firstValueFrom, of, timeout } from 'rxjs';

const DASHBOARD_URL = '/gestionale-cn/dashboard';
const ONBOARDING_URL = '/gestionale-cn/onboarding-comunita';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink],
  template: `
    @if (showLoading()) {
      <main class="auth-loading-page">
        <section class="auth-loading-card">
          <h2>Accesso in corso...</h2>
          <p>Stiamo verificando il tuo accesso. Attendi un istante.</p>
        </section>
      </main>
    }

    @if (!showLoading() && showAuthError()) {
      <main class="auth-loading-page">
        <section class="auth-loading-card error">
          <h2>Accesso non completato</h2>
          <p>{{ authErrorMessage() }}</p>
          <button type="button" class="auth-retry-button" (click)="retryLogin()">Riprova accesso</button>
        </section>
      </main>
    }

    @if (!showLoading() && showLogin()) {
      <main class="login-page">
        <section class="login-shell">
          <div class="login-copy">
            <h1 class="brand-neocat">Gestionale per le comunità<br />del Cammino Neocatecumenale</h1>
          </div>

          <div class="login-card">
            <p class="login-choice-title">Accedi o registrati</p>
            <button type="button" class="login-button primary" (click)="login()">Accedi</button>
            <button type="button" class="login-button secondary" (click)="register()">Registrati</button>
            <a routerLink="/demo" class="demo-link">Guarda la demo</a>
            <a routerLink="/faq" class="demo-link secondary-link">FAQ</a>
          </div>
        </section>

        <footer class="app-footer login-footer">
          <span>© All rights reserved. Progettato da PANTELEIA - Associazione Promozione Sociale. CF: 96647400587</span>
          <span>Iscrizione RUNTS: Rep. n. 165890 – Det. n. G03684 del 19/03/2026</span>
        </footer>
      </main>
    }

    @if (!showLoading() && !showLogin()) {
      <router-outlet></router-outlet>
    }
  `,
  styles: [
    `
      .auth-loading-page {
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: 24px;
        background: #f8fafc;
        font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      }

      .auth-loading-card {
        width: min(420px, 100%);
        border-radius: 20px;
        border: 1px solid #e5e7eb;
        background: #ffffff;
        padding: 28px;
        text-align: center;
        box-shadow: 0 18px 42px rgba(15, 23, 42, .12);
      }

      .auth-loading-card h2 {
        margin: 0;
        color: #0f2440;
        font-size: 24px;
      }

      .auth-loading-card p {
        margin: .75rem 0 0;
        color: #64748b;
        line-height: 1.45;
      }

      .auth-loading-card.error {
        border-color: #fecaca;
      }

      .auth-retry-button {
        min-height: 42px;
        margin-top: 1rem;
        padding: .7rem 1rem;
        border: 0;
        border-radius: 12px;
        background: #15365c;
        color: #fff;
        font-weight: 800;
        cursor: pointer;
      }

      .login-page {
        position: relative;
        isolation: isolate;
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        justify-content: center;
        padding: 12vh 24px 32px;
        overflow: hidden;
        background-image: url('/assets/images/login-bg.jpg');
        background-size: cover;
        background-position: 50% 42%;
        background-repeat: no-repeat;
        font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      }

      .login-page::before {
        content: '';
        position: absolute;
        inset: 0;
        z-index: 0;
        pointer-events: none;
        background: linear-gradient(180deg, rgba(5, 15, 31, .42), rgba(15, 23, 42, .22) 44%, rgba(15, 23, 42, .14));
      }

      .login-shell {
        min-height: calc(100vh - 120px);
        align-content: center;
        justify-content: center;
        position: relative;
        z-index: 2;
        width: 100%;
        max-width: 760px;
        display: grid;
        gap: 1rem;
        justify-items: center;
        margin: 0 auto;
        pointer-events: auto;
      }

      .login-copy {
        position: absolute;
        top: -2.4rem;
        left: 50%;
        transform: translateX(-50%);
        width: min(92vw, 860px);
        max-width: 860px;
        color: white;
        text-shadow: 0 2px 16px rgba(0, 0, 0, .35);
        text-align: center;
        z-index: 5;
        pointer-events: none;
      }

      .login-copy h1 {
        font-size: clamp(34px, 4.4vw, 58px);
        line-height: 1.08;
        margin: 0;
        font-weight: 800;
      }

      .login-card {
        position: relative;
        z-index: 3;
        width: 300px;
        max-width: 100%;
        background: rgba(255, 255, 255, .1);
        backdrop-filter: blur(4px);
        -webkit-backdrop-filter: blur(4px);
        border-radius: 24px;
        padding: 20px;
        box-shadow: 0 18px 42px rgba(0, 0, 0, .16);
        border: 1px solid rgba(255, 255, 255, .42);
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        pointer-events: auto;
        gap: 1.25rem;
      }

      .login-choice-title {
        margin: 0 0 .25rem;
        color: #fff;
        font-weight: 900;
        font-size: 1rem;
        text-shadow: 0 1px 10px rgba(0, 0, 0, .28);
      }

      .login-button + .login-button {
        margin-top: .35rem;
      }

      .login-card-head {
        margin-bottom: 16px;
      }

      .login-card h2 {
        margin: 0;
        font-size: 24px;
        color: #ffffff;
        text-shadow: 0 1px 12px rgba(0, 0, 0, .28);
      }

      .login-card-head p,
      .auth-choice p {
        margin: .55rem 0 0;
        color: rgba(255, 255, 255, .86);
        line-height: 1.45;
        font-size: .92rem;
        text-shadow: 0 1px 10px rgba(0, 0, 0, .24);
      }

      .auth-choice {
        width: 100%;
        display: grid;
        gap: .8rem;
        padding: 1rem 0;
        border-top: 1px solid rgba(255, 255, 255, .2);
      }

      .auth-choice span {
        display: block;
        color: #fff;
        font-weight: 850;
        font-size: .98rem;
        text-shadow: 0 1px 10px rgba(0, 0, 0, .24);
      }

      .login-button {
        position: relative;
        z-index: 4;
        appearance: none;
        -webkit-appearance: none;
        width: 200px;
        max-width: 100%;
        min-height: 40px;
        padding: 12px 16px;
        background: #15365c;
        color: white;
        border: none;
        border-radius: 14px;
        font-size: 16px;
        font-weight: 700;
        cursor: pointer;
        pointer-events: auto;
        touch-action: manipulation;
        box-shadow: 0 10px 20px rgba(23, 55, 94, .18);
        transition: background .18s ease, transform .18s ease, box-shadow .18s ease;
      }

      .login-button:hover {
        background: #1e4a79;
        transform: translateY(-1px);
        box-shadow: 0 14px 24px rgba(23, 55, 94, .24);
      }

      .login-button.secondary {
        background: rgba(255, 255, 255, .88);
        color: #15365c;
      }

      .login-button.secondary:hover {
        background: #fff;
      }

      .demo-link {
        position: relative;
        z-index: 4;
        margin-top: 1rem;
        color: rgba(255, 255, 255, .88);
        font-size: .92rem;
        text-decoration: none;
        border-bottom: 1px solid rgba(255, 255, 255, .42);
        pointer-events: auto;
      }

      .demo-link:hover {
        color: #fff;
        border-bottom-color: #fff;
      }

      .secondary-link {
        margin-top: .55rem;
        font-size: .85rem;
      }

      .app-footer {
        position: relative;
        z-index: 2;
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: .35rem 1rem;
        width: 100%;
        text-align: center;
        font-size: .75rem;
        line-height: 1.45;
      }

      .login-footer {
        width: fit-content;
        max-width: calc(100% - 2rem);
        margin-left: auto;
        margin-right: auto;
        padding: .55rem 1rem;
        border-radius: 999px;
        background: rgba(0, 0, 0, .45);
        margin-top: auto;
        color: #fff;
        text-shadow: 0 1px 8px rgba(0, 0, 0, .24);
        backdrop-filter: blur(4px);
        -webkit-backdrop-filter: blur(4px);
      }

      @media (max-width: 900px) {
        .login-page {
          padding: 9vh 18px 24px;
          background-position: 50% 18%;
        }

        .login-page::before {
          background: linear-gradient(180deg, rgba(5, 15, 31, .48), rgba(15, 23, 42, .24));
        }

        .login-shell {
          gap: 1rem;
        }

        .login-copy {
          top: -1.4rem;
          width: min(94vw, 640px);
          transform: translateX(-50%);
          margin-bottom: 0;
        }

        .login-copy h1 {
          font-size: clamp(28px, 8.5vw, 42px);
          line-height: 1.08;
        }

        .login-card {
          width: 320px;
          max-width: 100%;
          padding: 16px;
          border-radius: 20px;
        }

        .login-card h2 {
          font-size: 22px;
        }
      }
    `
  ]
})
export class App {
  protected readonly title = signal('Gestionale Comunità');
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly msalService = inject(MsalService);
  private readonly currentPath = signal(window.location.pathname);
  private readonly authenticated = signal(false);
  private readonly msalReady = signal(false);
  protected readonly authErrorMessage = signal<string | null>(null);
  private msalInitPromise: Promise<void> | null = null;

  constructor() {
    this.clearInvalidLegacyToken();
    void this.initMsalSafe();

    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe((event) => {
      this.currentPath.set(event.urlAfterRedirects.split('?')[0].split('#')[0]);
    });
  }

  private async initMsalSafe(): Promise<void> {
    try {
      await this.ensureMsalInitialized();
      await this.handleMicrosoftRedirect();
    } catch (error) {
      console.error('[MSAL] init error', error);
      this.clearAuthState();
      this.authenticated.set(false);
    } finally {
      this.msalReady.set(true);
    }
  }

  private async handleMicrosoftRedirect(): Promise<void> {
    try {
      const result = await firstValueFrom(
        this.msalService.handleRedirectObservable().pipe(
          timeout({ first: 5000 }),
          catchError((error) => {
            console.warn('[MSAL] redirect callback timeout/error', error);
            return of(null as AuthenticationResult | null);
          })
        )
      );

      if (result?.account) {
        this.msalService.instance.setActiveAccount(result.account);
        console.log('[MSAL] active account set', result.account.username ?? result.account.homeAccountId);

        if (result.idToken && this.isValidToken(result.idToken)) {
          localStorage.setItem('id_token', result.idToken);
          this.authService.refreshState();
        }
      }

      const accounts = this.msalService.instance.getAllAccounts();
      console.log('[MSAL] accounts found', accounts.length);

      if (!this.msalService.instance.getActiveAccount() && accounts.length > 0) {
        this.msalService.instance.setActiveAccount(accounts[0]);
        console.log('[MSAL] active account set', accounts[0].username ?? accounts[0].homeAccountId);
      }

      const activeAccount = this.msalService.instance.getActiveAccount();

      if (activeAccount) {
        this.authErrorMessage.set(null);
        this.authenticated.set(true);
        this.resolvePostLoginRoute();
      } else {
        this.clearAuthState();
        this.authenticated.set(false);
        this.authErrorMessage.set('Non è stato trovato un account Microsoft valido dopo il redirect. Puoi riprovare l’accesso.');
      }
    } catch (error) {
      console.error('[MSAL] redirect observable error', error);
      this.clearAuthState();
      this.authenticated.set(false);
      this.authErrorMessage.set('Il callback di accesso non è stato completato correttamente. Puoi riprovare l’accesso.');
    }
  }

  isLoggedIn(): boolean {
    if (!this.msalReady()) {
      return false;
    }

    const account = this.msalService.instance.getActiveAccount() ?? this.msalService.instance.getAllAccounts()[0];

    if (account) {
      this.msalService.instance.setActiveAccount(account);
      return true;
    }

    return false;
  }

  private hasValidLocalToken(): boolean {
    const token = localStorage.getItem('id_token');

    if (this.isValidToken(token)) {
      return true;
    }

    if (token) {
      this.clearAuthState();
    }

    return false;
  }

  isPublicRoute(): boolean {
    const path = this.currentPath();
    return path === '/demo' || path.startsWith('/demo/') || path === '/faq' || path === '/privacy' || path === '/completa-profilo' || path.startsWith('/completa-anagrafica/') || path.startsWith('/strutture/censimento');
  }

  isInternalRoute(): boolean {
    const path = this.currentPath();
    return path === '/gestionale-cn' || path.startsWith('/gestionale-cn/') || path === '/profile' || path.startsWith('/profile/');
  }

  showLoading(): boolean {
    return !this.msalReady() && (this.currentPath() === '/' || this.isInternalRoute());
  }

  showLogin(): boolean {
    if (!this.msalReady()) {
      return false;
    }

    if (this.authErrorMessage()) {
      return false;
    }

    if (this.currentPath() === '/') {
      return !this.authenticated();
    }

    return !this.authenticated() && !this.isPublicRoute() && !this.isInternalRoute();
  }

  showAuthError(): boolean {
    return Boolean(this.authErrorMessage()) && !this.authenticated() && (this.currentPath() === '/' || this.isInternalRoute());
  }

  login(): void {
    this.startMicrosoftAuth('login');
  }

  register(): void {
    this.startMicrosoftAuth('register');
  }

  retryLogin(): void {
    this.authErrorMessage.set(null);
    this.login();
  }

  private startMicrosoftAuth(intent: 'login' | 'register'): void {
    console.log(`[LOGIN] click ${intent === 'register' ? 'Registrati' : 'Accedi'}`);
    console.log('[LOGIN] redirectUri', window.location.origin);
    console.log('[LOGIN] authority', MSAL_AUTHORITY);

    this.clearAuthState();
    this.authErrorMessage.set(null);
    sessionStorage.setItem('eventiComunità.authIntent', intent);

    this.ensureMsalInitialized()
      .then(() => {
        this.msalReady.set(true);
        console.log('[LOGIN] avvio loginRedirect MSAL');

        this.msalService.loginRedirect({
          scopes: ['openid', 'profile', 'email']
        }).subscribe({
          error: (error) => {
            console.error('[LOGIN] errore loginRedirect', error);
          }
        });
      })
      .catch((error) => {
        console.error('[LOGIN INIT ERROR]', error);
      });
  }

  logout(): void {
    this.clearAuthState();

    this.msalService.initialize().subscribe({
      next: () => this.msalService.logoutRedirect(),
      error: (error) => console.error('[LOGOUT INIT ERROR]', error)
    });
  }

  private clearInvalidLegacyToken(): void {
    const token = localStorage.getItem('id_token');

    if (token && !this.isValidToken(token)) {
      this.clearAuthState();
    }
  }

  private clearAuthState(): void {
    localStorage.removeItem('id_token');
    sessionStorage.clear();
    this.authService.refreshState();
    this.authenticated.set(false);
  }

  private resolvePostLoginRoute(): void {
    const selected = hasSelectedCommunity();
    const targetRoute = selected ? DASHBOARD_URL : ONBOARDING_URL;
    console.log('[POST LOGIN] hasSelectedCommunity result', selected);
    console.log('[POST LOGIN] post-login route selected', targetRoute);

    this.router.navigateByUrl(targetRoute, { replaceUrl: true });
  }

  private ensureMsalInitialized(): Promise<void> {
    if (!this.msalInitPromise) {
      this.msalInitPromise = firstValueFrom(this.msalService.initialize()).then(() => undefined);
    }

    return this.msalInitPromise;
  }

  private isValidToken(token: string | null | undefined): token is string {
    if (!token || token.split('.').length < 3) {
      return false;
    }

    const payload = this.decodeToken(token);
    const hasIdentity = Boolean(payload.sub || payload.oid || payload.email || payload.emails?.length || payload.preferred_username || payload.name);
    const isExpired = typeof payload.exp === 'number' && payload.exp * 1000 <= Date.now();

    return hasIdentity && !isExpired;
  }

  private decodeToken(token: string): any {
    try {
      const base64Payload = token
        .split('.')[1]
        .replace(/-/g, '+')
        .replace(/_/g, '/');

      return JSON.parse(atob(base64Payload));
    } catch (error) {
      console.error('[TOKEN] errore decodifica:', error);
      return {};
    }
  }
}
