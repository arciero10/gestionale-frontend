import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from './app/auth/auth.service';

const DASHBOARD_URL = '/gestionale-cn/dashboard';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink],
  template: `
    @if (!isLoggedIn() && !isPublicRoute()) {
      <main class="login-page">
        <section class="login-shell">
          <div class="login-card">
            <div class="login-card-head">
              <h2>Accedi al gestionale</h2>
            </div>

            <button type="button" (click)="login()" class="login-button">
              Accedi con email
            </button>

            <a routerLink="/demo" class="demo-link">Guarda la demo</a>
            <a routerLink="/faq" class="demo-link secondary-link">FAQ</a>
          </div>

          <div class="login-copy">
            <h1 class="brand-neocat">Gestionale per le comunità<br />del cammino neocatecumenale</h1>
          </div>
        </section>

        <footer class="app-footer login-footer">
          <span>All rights reserved. Progettato da PANTELEIA - Associazione Promozione Sociale. CF: 96647400587</span>
          <span>Iscrizione RUNTS: Rep. n. 165890 – Det. n. G03684 del 19/03/2026</span>
        </footer>
      </main>
    }

    @if (isLoggedIn()) {
      <div
        style="
          padding: 12px 18px;
          display: flex;
          gap: 14px;
          align-items: center;
          border-bottom: 1px solid #e5e7eb;
          background: white;
          font-family: Inter, system-ui, sans-serif;
        "
      >
        <strong>Gestionale Comunità</strong>

        <span style="color: #475569;">
          Utente: {{ userName() }}
        </span>

        <button
          type="button"
          (click)="logout()"
          style="
            margin-left: auto;
            padding: 8px 14px;
            background: #dc2626;
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
          "
        >
          Logout
        </button>
      </div>

      <router-outlet></router-outlet>
    }

    @if (!isLoggedIn() && isPublicRoute()) {
      <router-outlet></router-outlet>
    }
  `,
  styles: [
    `
      .login-page {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        justify-content: center;
        padding: 14vh 24px 32px;
        background-image:
          linear-gradient(180deg, rgba(5, 15, 31, .42), rgba(15, 23, 42, .22) 44%, rgba(15, 23, 42, .14)),
          url('/assets/images/login-bg.jpg');
        background-size: cover;
        background-position: 50% 42%;
        background-repeat: no-repeat;
        font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      }

      .login-shell {
        width: 100%;
        max-width: 760px;
        display: grid;
        gap: 3.5rem;
        justify-items: center;
        margin: 0 auto;
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
        box-shadow: 0 10px 20px rgba(23, 55, 94, .18);
        transition: background .18s ease, transform .18s ease, box-shadow .18s ease;
      }

      .login-button:hover {
        background: #1e4a79;
        transform: translateY(-1px);
        box-shadow: 0 14px 24px rgba(23, 55, 94, .24);
      }

      .demo-link {
        margin-top: 1rem;
        color: rgba(255, 255, 255, .88);
        font-size: .92rem;
        text-decoration: none;
        border-bottom: 1px solid rgba(255, 255, 255, .42);
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
          padding: 10vh 18px 24px;
          background-image:
            linear-gradient(180deg, rgba(5, 15, 31, .48), rgba(15, 23, 42, .24)),
            url('/assets/images/login-bg.jpg');
          background-position: 50% 18%;
        }

        .login-shell {
          gap: 2.5rem;
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

  constructor() {
    this.captureTokenFromUrl();
  }

  private captureTokenFromUrl(): void {
    const hash = window.location.hash;

    if (!hash) {
      return;
    }

    const params = new URLSearchParams(hash.replace('#', ''));

    const idToken = params.get('id_token');
    const error = params.get('error');
    const errorDescription = params.get('error_description');

    if (error) {
      console.error('[LOGIN ERROR]', error, errorDescription);
      alert('Errore login: ' + (errorDescription ?? error));

      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    if (idToken) {
      localStorage.setItem('id_token', idToken);
      this.authService.refreshState();

      console.log('[TOKEN]', idToken);
      console.log('[PAYLOAD]', this.decodeToken(idToken));

      window.history.replaceState({}, document.title, window.location.pathname);

      console.log('[LOGIN] token salvato');
      this.router.navigateByUrl(DASHBOARD_URL, { replaceUrl: true });
    }
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('id_token');
  }

  isPublicRoute(): boolean {
    const path = window.location.pathname;
    return path === '/demo' || path.startsWith('/demo/') || path === '/faq' || path === '/completa-profilo';
  }

  userName(): string {
    const token = localStorage.getItem('id_token');

    if (!token) {
      return 'utente';
    }

    const payload = this.decodeToken(token);

    return (
      payload.name ||
      payload.given_name ||
      payload.family_name ||
      payload.email ||
      payload.emails?.[0] ||
      payload.preferred_username ||
      'utente'
    );
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

  login(): void {
    const redirectUri = encodeURIComponent(window.location.origin);

    window.location.href =
      `https://eventidicomunita.ciamlogin.com/eventidicomunita.onmicrosoft.com/oauth2/v2.0/authorize?p=signup-signin&client_id=21ee1eae-67e3-4c7c-86ab-db78994d8666&redirect_uri=${redirectUri}&response_type=id_token&scope=openid%20profile%20email&nonce=defaultNonce`;
  }

  logout(): void {
    localStorage.removeItem('id_token');
    sessionStorage.clear();

    const postLogoutRedirectUri = encodeURIComponent(window.location.origin);

    window.location.href =
      `https://eventidicomunita.ciamlogin.com/eventidicomunita.onmicrosoft.com/oauth2/v2.0/logout?p=signup-signin&post_logout_redirect_uri=${postLogoutRedirectUri}`;
  }
}
