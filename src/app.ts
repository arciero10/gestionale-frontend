import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: `
    @if (!isLoggedIn()) {
      <main
        style="
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 32px;
          background:
            linear-gradient(135deg, rgba(15,23,42,.88), rgba(30,64,175,.72)),
            radial-gradient(circle at top left, rgba(250,204,21,.28), transparent 35%),
            linear-gradient(120deg, #0f172a, #1e3a8a);
          font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        "
      >
        <section
          style="
            width: 100%;
            max-width: 1120px;
            display: grid;
            grid-template-columns: 1.1fr .9fr;
            gap: 32px;
            align-items: center;
          "
        >
          <div style="color: white;">
            <div
              style="
                display: inline-flex;
                align-items: center;
                gap: 10px;
                padding: 8px 14px;
                border-radius: 999px;
                background: rgba(255,255,255,.12);
                border: 1px solid rgba(255,255,255,.22);
                margin-bottom: 22px;
                backdrop-filter: blur(10px);
              "
            >
              <span style="width: 9px; height: 9px; border-radius: 50%; background: #22c55e; display: inline-block;"></span>
              <span style="font-size: 14px;">Accesso sicuro tramite Microsoft Entra</span>
            </div>

            <h1
              style="
                font-size: clamp(42px, 6vw, 72px);
                line-height: .95;
                margin: 0 0 22px;
                letter-spacing: -0.05em;
                font-weight: 800;
              "
            >
              Eventi di<br />Comunità
            </h1>

            <p
              style="
                max-width: 620px;
                font-size: 19px;
                line-height: 1.6;
                color: rgba(255,255,255,.82);
                margin: 0;
              "
            >
              Gestisci iscrizioni, accoglienza, responsabili, strutture e attività
              in un unico spazio digitale semplice e sicuro.
            </p>
          </div>

          <div
            style="
              background: rgba(255,255,255,.94);
              border-radius: 28px;
              padding: 34px;
              box-shadow: 0 30px 80px rgba(0,0,0,.35);
              border: 1px solid rgba(255,255,255,.6);
            "
          >
            <div style="margin-bottom: 28px;">
              <div
                style="
                  width: 56px;
                  height: 56px;
                  border-radius: 18px;
                  background: linear-gradient(135deg, #2563eb, #7c3aed);
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  color: white;
                  font-weight: 800;
                  font-size: 22px;
                  margin-bottom: 18px;
                "
              >
                EC
              </div>

              <h2 style="margin: 0 0 8px; font-size: 28px; color: #0f172a;">
                Accedi al gestionale
              </h2>

              <p style="margin: 0; color: #64748b; line-height: 1.5;">
                Entra con la tua email. Riceverai un codice temporaneo per confermare l’accesso.
              </p>
            </div>

            <button
              type="button"
              (click)="login()"
              style="
                width: 100%;
                padding: 15px 18px;
                background: linear-gradient(135deg, #2563eb, #1d4ed8);
                color: white;
                border: none;
                border-radius: 14px;
                font-size: 16px;
                font-weight: 700;
                cursor: pointer;
                box-shadow: 0 12px 24px rgba(37,99,235,.28);
              "
            >
              Accedi con email
            </button>

            <div
              style="
                margin-top: 22px;
                padding: 14px;
                border-radius: 14px;
                background: #f8fafc;
                color: #64748b;
                font-size: 13px;
                line-height: 1.5;
              "
            >
              Accesso protetto con Microsoft Entra External ID. Nessuna password da ricordare.
            </div>
          </div>
        </section>
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
        <strong>Eventi di Comunità</strong>

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
  `
})
export class App {
  protected readonly title = signal('Gestionale Cammino Neocatecumenale');

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

      console.log('[TOKEN]', idToken);
      console.log('[PAYLOAD]', this.decodeToken(idToken));

      window.history.replaceState({}, document.title, window.location.pathname);

      console.log('[LOGIN] token salvato');
    }
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('id_token');
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
    window.location.href =
      'https://eventidicomunita.ciamlogin.com/eventidicomunita.onmicrosoft.com/oauth2/v2.0/authorize?p=signup-signin&client_id=21ee1eae-67e3-4c7c-86ab-db78994d8666&redirect_uri=http://localhost:4200&response_type=id_token&scope=openid%20profile%20email&nonce=defaultNonce';
  }

  logout(): void {
    localStorage.removeItem('id_token');
    sessionStorage.clear();

    window.location.href =
      'https://eventidicomunita.ciamlogin.com/eventidicomunita.onmicrosoft.com/oauth2/v2.0/logout?p=signup-signin&post_logout_redirect_uri=http%3A%2F%2Flocalhost%3A4200';
  }
}