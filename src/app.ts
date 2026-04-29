import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { AuthenticationResult } from '@azure/msal-browser';
import { MsalService } from '@azure/msal-angular';
import { AuthService } from './app/auth/auth.service';
import { MSAL_AUTHORITY } from './app.config';

const DASHBOARD_URL = '/gestionale-cn/dashboard';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink],
  template: `
    @if (!isLoggedIn() && !isPublicRoute()) {
      <main class="login-page">
        <section class="login-shell">
          <div class="login-copy">
            <h1 class="brand-neocat">Gestionale per le comunità<br />del cammino neocatecumenale</h1>
          </div>

          <div class="login-card">
            <div class="login-card-head">
              <h2>Accedi al gestionale</h2>
            </div>

            <button type="button" class="login-button" (click)="login()">
              Accedi con email
            </button>

            <a routerLink="/demo" class="demo-link">Guarda la demo</a>
            <a routerLink="/faq" class="demo-link secondary-link">FAQ</a>
          </div>
        </section>

        <footer class="app-footer login-footer">
          <span>All rights reserved. Progettato da PANTELEIA - Associazione Promozione Sociale. CF: 96647400587</span>
          <span>Iscrizione RUNTS: Rep. n. 165890 – Det. n. G03684 del 19/03/2026</span>
        </footer>
      </main>
    }

    @if (isLoggedIn() && !isPublicRoute()) {
      <router-outlet></router-outlet>
    }

    @if (isPublicRoute()) {
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
        width: 330px;
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
        margin-bottom: 22px;
      }

      .login-card h2 {
        margin: 0;
        font-size: 24px;
        color: #ffffff;
        text-shadow: 0 1px 12px rgba(0, 0, 0, .28);
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
        margin-top: auto;
        color: rgba(255, 255, 255, .72);
        text-shadow: 0 1px 8px rgba(0, 0, 0, .24);
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

  constructor() {
    this.clearInvalidLegacyToken();
    this.handleMicrosoftRedirect();
  }

  private handleMicrosoftRedirect(): void {
    this.msalService.handleRedirectObservable().subscribe({
      next: (result: AuthenticationResult | null) => {
        if (!result?.account) {
          const activeAccount = this.msalService.instance.getActiveAccount() ?? this.msalService.instance.getAllAccounts()[0];
          if (activeAccount) {
            this.msalService.instance.setActiveAccount(activeAccount);
          }
          return;
        }

        this.msalService.instance.setActiveAccount(result.account);

        if (result.idToken && this.isValidToken(result.idToken)) {
          localStorage.setItem('id_token', result.idToken);
          this.authService.refreshState();
        }

        this.router.navigateByUrl(DASHBOARD_URL, { replaceUrl: true });
      },
      error: (error) => {
        console.error('[LOGIN ERROR]', error);
        this.clearAuthState();
      }
    });
  }

  isLoggedIn(): boolean {
    const account = this.msalService.instance.getActiveAccount() ?? this.msalService.instance.getAllAccounts()[0];
    if (account) {
      this.msalService.instance.setActiveAccount(account);
      return true;
    }

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
    const path = window.location.pathname;
    return path === '/demo' || path.startsWith('/demo/') || path === '/faq' || path === '/completa-profilo';
  }

  login(): void {
    console.log('[LOGIN] click Accedi con email');
    console.log('[LOGIN] redirectUri', window.location.origin);
    console.log('[LOGIN] authority', MSAL_AUTHORITY);

    this.clearAuthState();
    this.msalService.initialize().subscribe({
      next: () => {
        console.log('[LOGIN] avvio loginRedirect MSAL');

        this.msalService.loginRedirect({
          scopes: ['openid', 'profile', 'email']
        }).subscribe({
          error: (error) => {
            console.error('[LOGIN] errore loginRedirect', error);
          }
        });
      },
      error: (error) => {
        console.error('[LOGIN INIT ERROR]', error);
      }
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
