import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-demo-shell',
    standalone: true,
    imports: [RouterLink],
    template: `
        <main class="demo-shell">
            <section class="demo-card" aria-label="Demo pubblica">
                <span class="demo-badge">Modalità demo</span>
                <h1>DEMO CARICATA</h1>
                <p>La rotta demo funziona correttamente.</p>

                <nav class="demo-links" aria-label="Navigazione demo">
                    <a routerLink="/demo/dashboard">Dashboard</a>
                    <a routerLink="/demo/comunita">La tua Comunità</a>
                    <a routerLink="/demo/convivenze">Convivenze</a>
                    <a routerLink="/demo/posti-convivenza">Posti di Convivenza</a>
                    <a routerLink="/demo/viaggi">Viaggi</a>
                    <a routerLink="/" class="login-link">Accedi all'app</a>
                </nav>
            </section>
        </main>
    `,
    styles: [
        `
            :host {
                display: block;
                min-height: 100vh;
            }

            .demo-shell {
                min-height: 100vh;
                padding: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: #f5f7fb;
                color: #0f2440;
                font-family:
                    Inter,
                    system-ui,
                    -apple-system,
                    BlinkMacSystemFont,
                    'Segoe UI',
                    sans-serif;
            }

            .demo-card {
                width: min(760px, 100%);
                padding: 32px;
                border-radius: 18px;
                background: #ffffff;
                border: 1px solid #dbe3ef;
                box-shadow: 0 18px 45px rgba(15, 36, 64, 0.12);
                text-align: center;
            }

            .demo-badge {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                min-height: 32px;
                padding: 0.35rem 0.8rem;
                border-radius: 999px;
                background: #e8f1fb;
                color: #15365c;
                font-weight: 800;
                font-size: 0.82rem;
                text-transform: uppercase;
                letter-spacing: 0.04em;
            }

            h1 {
                margin: 1rem 0 0.4rem;
                color: #0f2440;
                font-size: clamp(2rem, 5vw, 3.25rem);
                line-height: 1.05;
            }

            p {
                margin: 0;
                color: #52677f;
                font-size: 1.05rem;
            }

            .demo-links {
                margin-top: 1.75rem;
                display: flex;
                flex-wrap: wrap;
                justify-content: center;
                gap: 0.75rem;
            }

            .demo-links a {
                min-height: 44px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                padding: 0.7rem 1rem;
                border-radius: 10px;
                background: #ffffff;
                border: 1px solid #c9d5e4;
                color: #15365c;
                text-decoration: none;
                font-weight: 800;
            }

            .demo-links a:hover {
                border-color: #15365c;
                background: #f0f6fc;
            }

            .demo-links .login-link {
                background: #15365c;
                border-color: #15365c;
                color: #ffffff;
            }

            @media (max-width: 640px) {
                .demo-shell {
                    padding: 20px;
                    align-items: flex-start;
                }

                .demo-card {
                    padding: 24px 18px;
                }

                .demo-links {
                    flex-direction: column;
                    align-items: stretch;
                }

                .demo-links a {
                    width: 100%;
                }
            }
        `
    ]
})
export class DemoShellComponent {}
