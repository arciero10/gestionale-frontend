import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DEMO_COMUNITA, DEMO_CONVIVENZE, DEMO_MEMBRI, DEMO_POSTI } from './demo.mock';

type DemoSection = 'dashboard' | 'comunita' | 'convivenze' | 'posti-convivenza' | 'viaggi';

@Component({
    selector: 'app-demo',
    standalone: true,
    imports: [CommonModule, RouterLink],
    template: `
        <main class="demo-page">
            <header class="demo-header">
                <div>
                    <span class="demo-badge">Modalità demo</span>
                    <h1>Gestionale Comunità</h1>
                    <p>I dati mostrati sono dimostrativi.</p>
                </div>
                <div class="header-links">
                    <a routerLink="/faq" class="login-link">FAQ</a>
                    <a routerLink="/" class="login-link">Accedi all'app</a>
                </div>
            </header>

            <nav class="demo-nav" aria-label="Navigazione demo">
                <a routerLink="/demo" [class.active]="activeSection === 'dashboard'">Dashboard</a>
                <a routerLink="/demo/comunita" [class.active]="activeSection === 'comunita'">La tua Comunità</a>
                <a routerLink="/demo/convivenze" [class.active]="activeSection === 'convivenze'">Convivenze</a>
                <a routerLink="/demo/posti-convivenza" [class.active]="activeSection === 'posti-convivenza'">Posti</a>
                <a routerLink="/demo/viaggi" [class.active]="activeSection === 'viaggi'">Viaggi</a>
            </nav>

            @if (activeSection === 'dashboard') {
                <section class="demo-grid">
                    <article class="hero-card">
                        <span>Comunità demo</span>
                        <h2>{{ comunita.nome }}</h2>
                        <p>{{ comunita.parrocchia }} · {{ comunita.settore }} · {{ comunita.diocesi }}</p>
                    </article>
                    <article><strong>{{ membri.length }}</strong><span>Membri demo</span></article>
                    <article><strong>{{ convivenze.length }}</strong><span>Convivenze demo</span></article>
                    <article><strong>{{ posti.length }}</strong><span>Posti demo</span></article>
                </section>
            }

            @if (activeSection === 'comunita') {
                <section class="panel">
                    <h2>La tua Comunità demo</h2>
                    <p>{{ comunita.nome }} – {{ comunita.parrocchia }} – {{ comunita.settore }}</p>
                    <div class="cards-list">
                        @for (membro of membri; track membro.nome) {
                            <article>
                                <strong>{{ membro.nome }} {{ membro.cognome }}</strong>
                                <span>{{ membro.ruolo }} · {{ membro.stato }}</span>
                            </article>
                        }
                    </div>
                </section>
            }

            @if (activeSection === 'convivenze') {
                <section class="panel">
                    <h2>Convivenze demo</h2>
                    <div class="cards-list">
                        @for (convivenza of convivenze; track convivenza.titolo) {
                            <article>
                                <strong>{{ convivenza.titolo }}</strong>
                                <span>{{ convivenza.dataInizio }} - {{ convivenza.dataFine }} · {{ convivenza.luogo }} · {{ convivenza.stato }}</span>
                            </article>
                        }
                    </div>
                </section>
            }

            @if (activeSection === 'posti-convivenza') {
                <section class="panel">
                    <h2>Posti di Convivenza demo</h2>
                    <div class="cards-list">
                        @for (posto of posti; track posto.nome) {
                            <article>
                                <strong>{{ posto.nome }}</strong>
                                <span>{{ posto.citta }} · Capienza {{ posto.capienza }} · {{ posto.stato }}</span>
                            </article>
                        }
                    </div>
                </section>
            }

            @if (activeSection === 'viaggi') {
                <section class="panel placeholder">
                    <h2>Viaggi / Pellegrinaggi demo</h2>
                    <p>Modulo dimostrativo in preparazione.</p>
                </section>
            }

            <footer>
                <span>© All rights reserved. Progettato da PANTELEIA - Associazione Promozione Sociale. CF: 96647400587</span>
                <span>Iscrizione RUNTS: Rep. n. 165890 – Det. n. G03684 del 19/03/2026</span>
            </footer>
        </main>
    `,
    styles: [
        `
            .demo-page {
                min-height: 100vh;
                background: #f5f7fb;
                color: #172033;
                padding: clamp(1rem, 3vw, 2rem);
                display: grid;
                gap: 1.25rem;
                align-content: start;
            }
            .demo-header,
            .demo-nav,
            .panel,
            .demo-grid article {
                background: #fff;
                border: 1px solid #e4e8ef;
                border-radius: 16px;
                box-shadow: 0 14px 30px rgba(15, 23, 42, .07);
            }
            .demo-header {
                display: flex;
                justify-content: space-between;
                gap: 1rem;
                align-items: center;
                padding: 1.25rem;
            }
            .demo-header h1 { margin: .45rem 0 .2rem; font-size: clamp(2rem, 5vw, 3.4rem); }
            .demo-header p { margin: 0; color: #64748b; }
            .demo-badge {
                display: inline-flex;
                padding: .3rem .65rem;
                border-radius: 999px;
                background: #e0f2fe;
                color: #075985;
                font-weight: 800;
                font-size: .82rem;
            }
            .header-links { display: flex; flex-wrap: wrap; gap: .75rem; }
            .login-link,
            .demo-nav a {
                color: #17375e;
                font-weight: 800;
                text-decoration: none;
            }
            .demo-nav {
                display: flex;
                flex-wrap: wrap;
                gap: .5rem;
                padding: .65rem;
            }
            .demo-nav a {
                min-height: 40px;
                display: inline-flex;
                align-items: center;
                padding: .45rem .8rem;
                border-radius: 999px;
            }
            .demo-nav a.active {
                background: #17375e;
                color: #fff;
            }
            .demo-grid {
                display: grid;
                grid-template-columns: 1.5fr repeat(3, 1fr);
                gap: 1rem;
            }
            .demo-grid article,
            .panel {
                padding: 1.25rem;
            }
            .demo-grid article strong {
                display: block;
                font-size: 2rem;
                color: #17375e;
            }
            .demo-grid article span,
            .cards-list span {
                color: #64748b;
            }
            .hero-card h2,
            .panel h2 {
                margin: .3rem 0 .5rem;
            }
            .cards-list {
                display: grid;
                gap: .75rem;
                margin-top: 1rem;
            }
            .cards-list article {
                display: flex;
                justify-content: space-between;
                gap: 1rem;
                padding: .9rem;
                border: 1px solid #e4e8ef;
                border-radius: 12px;
                background: #fbfcfe;
            }
            .placeholder {
                text-align: center;
            }
            footer {
                display: flex;
                flex-wrap: wrap;
                justify-content: center;
                gap: .35rem 1rem;
                color: #6b7280;
                font-size: .75rem;
                text-align: center;
            }
            @media (max-width: 900px) {
                .demo-header,
                .cards-list article {
                    flex-direction: column;
                    align-items: flex-start;
                }
                .demo-grid {
                    grid-template-columns: 1fr;
                }
            }
        `
    ]
})
export class Demo {
    private readonly route = inject(ActivatedRoute);
    readonly comunita = DEMO_COMUNITA;
    readonly membri = DEMO_MEMBRI;
    readonly convivenze = DEMO_CONVIVENZE;
    readonly posti = DEMO_POSTI;

    get activeSection(): DemoSection {
        const section = this.route.snapshot.paramMap.get('section') as DemoSection | null;
        return section ?? 'dashboard';
    }
}
