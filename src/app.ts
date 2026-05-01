import { Component, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { AuthenticationResult } from '@azure/msal-browser';
import { MsalService } from '@azure/msal-angular';
import { AuthService } from './app/auth/auth.service';
import { MSAL_AUTHORITY } from './app.config';
import { hasSelectedCommunity } from './app/features/gestionaleCN/data/community-selection.storage';
import { filter, firstValueFrom } from 'rxjs';

const DASHBOARD_URL = '/gestionale-cn/dashboard';
const ONBOARDING_URL = '/gestionale-cn/onboarding-comunita';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink],
  template: `
    @if (showLoading()) {
      <main class="login-page">
        <section class="login-shell">
          <div class="login-card">
            <div class="login-card-head">
              <h2>Accesso in corso...</h2>
              <p>Sto controllando il tuo account Microsoft. Attendi un istante.</p>
            </div>
          </div>
        </section>
      </main>
    }

    @if (!showLoading() && showLogin()) {
      <main class="login-page">
        <section class="login-shell">
          <div class="login-copy">
            <h1 class="brand-neocat">Gestionale per le comunità<br />del cammino neocatecumenale</h1>
          </div>

          <div class="login-card">
            <div class="login-card-head">
              <h2>Entra nel gestionale</h2>
              <p>Usa la tua email. L’accesso e la registrazione sono gestiti tramite Microsoft Entra External ID.</p>
            </div>

            <section class="auth-choice">
              <div>
                <span>Nuovo utente?</span>
                <p>Premi Registrati. Nella schermata Microsoft inserisci la tua email anche se non hai ancora un account: riceverai un codice temporaneo per creare il tuo accesso.</p>
              </div>
              <button type="button" class="login-button primary" (click)="register()">Registrati</button>
            </section>

            <section class="auth-choice">
              <div>
                <span>Hai già un account?</span>
                <p>Premi Accedi e inserisci la tua email nella schermata Microsoft per ricevere il codice di accesso.</p>
              </div>
              <button type="button" class="login-button secondary" (click)="login()">Accedi</button>
            </section>

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
        position: relative;
        z-index: 2;
        width: 100%;
        max-width: 760px;
        display: grid;
        gap: 1.85rem;
        justify-items: center;
        margin: 0 auto;
        pointer-events: auto;
      }

      .login-copy {
        color: white;
        max-width: 720px;
        text-shadow: 0 2px 16px rgba(0, 0, 0, .24);
        text-align: center;
      }

      .login-copy h1 {
        font-size: clamp(30px, 4.8vw, 50px);
        line-height: 1.1;
        margin: 0;
        font-weight: 800;
      }

      .login-card {
        position: relative;
        z-index: 3;
        width: 430px;
        max-width: 100%;
        background: rgba(255, 255, 255, .1);
        backdrop-filter: blur(4px);
        -webkit-backdrop-filter: blur(4px);
        border-radius: 24px;
        padding: 28px;
        box-shadow: 0 18px 42px rgba(0, 0, 0, .16);
        border: 1px solid rgba(255, 255, 255, .42);
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        pointer-events: auto;
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
        width: 240px;
        max-width: 100%;
        min-height: 48px;
        padding: 15px 18px;
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
          gap: 1.5rem;
        }

        .login-copy h1 {
          font-size: clamp(27px, 8.5vw, 40px);
        }

        .login-card {
          width: 320px;
          max-width: 100%;
          padding: 24px;
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
      this.msalReady.set(true);
      this.handleMicrosoftRedirect();
    } catch (error) {
      console.error('[MSAL] init error', error);
      this.authenticated.set(false);
      this.msalReady.set(false);
    }
  }

  private handleMicrosoftRedirect(): void {
    this.msalService.handleRedirectObservable().subscribe({
      next: (result: AuthenticationResult | null) => {
        if (result?.account) {
          this.msalService.instance.setActiveAccount(result.account);

          if (result.idToken && this.isValidToken(result.idToken)) {
            localStorage.setItem('id_token', result.idToken);
          this.authService.refreshState();
          }

          this.authenticated.set(true);
          this.router.navigateByUrl(hasSelectedCommunity() ? DASHBOARD_URL : ONBOARDING_URL, { replaceUrl: true });
          return;
        }

        const accounts = this.msalService.instance.getAllAccounts();

        if (!this.msalService.instance.getActiveAccount() && accounts.length > 0) {
          this.msalService.instance.setActiveAccount(accounts[0]);
        }

        const activeAccount = this.msalService.instance.getActiveAccount();

        if (activeAccount) {
          this.authenticated.set(true);
          this.navigatePostLogin();
        } else {
          this.clearAuthState();
          this.authenticated.set(false);
        }
      },
      error: (error) => {
        console.error('[MSAL] redirect observable error', error);
        this.clearAuthState();
        this.authenticated.set(false);
      }
    });
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
    return path === '/demo' || path.startsWith('/demo/') || path === '/faq' || path === '/privacy' || path === '/completa-profilo' || path.startsWith('/completa-anagrafica/');
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

    if (this.currentPath() === '/') {
      return true;
    }

    return !this.authenticated() && !this.isPublicRoute() && !this.isInternalRoute();
  }

  login(): void {
    this.startMicrosoftAuth('login');
  }

  register(): void {
    this.startMicrosoftAuth('register');
  }

  private startMicrosoftAuth(intent: 'login' | 'register'): void {
    console.log(`[LOGIN] click ${intent === 'register' ? 'Registrati' : 'Accedi'}`);
    console.log('[LOGIN] redirectUri', window.location.origin);
    console.log('[LOGIN] authority', MSAL_AUTHORITY);

    this.clearAuthState();
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

  private navigatePostLogin(): void {
    this.router.navigateByUrl(hasSelectedCommunity() ? DASHBOARD_URL : ONBOARDING_URL, { replaceUrl: true });
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
