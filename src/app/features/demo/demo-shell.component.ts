import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DEMO_COMUNITA, DEMO_CONVIVENZE, DEMO_MEMBRI, DEMO_POSTI } from './demo.mock';

type DemoSection = 'dashboard' | 'comunita' | 'convivenze' | 'posti-convivenza' | 'viaggi';

@Component({
    selector: 'app-demo-shell',
    standalone: true,
    imports: [CommonModule, RouterLink],
    template: `
        <main class="demo-app">
            <aside class="demo-sidebar" aria-label="Navigazione demo">
                <a routerLink="/demo/dashboard" class="demo-brand">
                    <span>CN</span>
                    <strong>Gestionale CN</strong>
                </a>

                <div class="demo-community">
                    <span class="demo-pill">Modalità demo</span>
                    <strong>{{ comunita.nome }}</strong>
                    <small>{{ comunita.parrocchia }}</small>
                </div>

                <nav class="demo-nav">
                    <a routerLink="/demo/dashboard" [class.active]="section === 'dashboard'"><i class="pi pi-home"></i>Dashboard</a>
                    <a routerLink="/demo/comunita" [class.active]="section === 'comunita'"><i class="pi pi-users"></i>La tua Comunità</a>
                    <a routerLink="/demo/convivenze" [class.active]="section === 'convivenze'"><i class="pi pi-calendar"></i>Convivenze</a>
                    <a routerLink="/demo/posti-convivenza" [class.active]="section === 'posti-convivenza'"><i class="pi pi-building"></i>Posti di Convivenza</a>
                    <a routerLink="/demo/viaggi" [class.active]="section === 'viaggi'"><i class="pi pi-send"></i>Viaggi / Pellegrinaggi</a>
                </nav>

                <div class="demo-sidebar-bottom">
                    <a routerLink="/faq">FAQ</a>
                    <a routerLink="/" class="login-link">Accedi all'app</a>
                </div>
            </aside>

            <section class="demo-main">
                <header class="demo-topbar">
                    <div>
                        <span class="demo-pill">Modalità demo</span>
                        <small>I dati mostrati sono dimostrativi.</small>
                    </div>
                    <a routerLink="/" class="topbar-login">Accedi all'app</a>
                </header>

                <div class="demo-content">
                    @if (section === 'dashboard') {
                        <section class="dashboard-stage">
                            <aside class="community-summary">
                                <span>Comunità demo</span>
                                <h1>{{ comunita.nome }}</h1>
                                <dl>
                                    <div><dt>Parrocchia</dt><dd>{{ comunita.parrocchia }}</dd></div>
                                    <div><dt>Settore</dt><dd>{{ comunita.settore }}</dd></div>
                                    <div><dt>Diocesi</dt><dd>{{ comunita.diocesi }}</dd></div>
                                    <div><dt>Membri</dt><dd>{{ membri.length }}</dd></div>
                                    <div><dt>Convivenze</dt><dd>{{ convivenze.length }}</dd></div>
                                    <div><dt>Posti censiti</dt><dd>{{ posti.length }}</dd></div>
                                </dl>
                            </aside>

                            <div class="module-grid">
                                @for (module of modules; track module.title) {
                                    <a [routerLink]="module.route" class="module-card" [ngClass]="module.tone">
                                        <i class="pi" [ngClass]="module.icon"></i>
                                        <h2>{{ module.title }}</h2>
                                        <span class="status">{{ module.status }}</span>
                                        <strong>Apri</strong>
                                    </a>
                                }
                            </div>
                        </section>
                    }

                    @if (section === 'comunita') {
                        <section class="page-grid">
                            <article class="panel identity-panel">
                                <span class="eyebrow">Comunità associata</span>
                                <h1>{{ comunita.nome }}</h1>
                                <div class="info-grid">
                                    <div><span>Parrocchia</span><strong>{{ comunita.parrocchia }}</strong></div>
                                    <div><span>Settore</span><strong>{{ comunita.settore }}</strong></div>
                                    <div><span>Diocesi</span><strong>{{ comunita.diocesi }}</strong></div>
                                    <div><span>Responsabile</span><strong>{{ comunita.responsabile }}</strong></div>
                                </div>
                            </article>

                            <article class="panel">
                                <div class="panel-head">
                                    <div>
                                        <span class="eyebrow">Anagrafica demo</span>
                                        <h2>Membri comunità</h2>
                                    </div>
                                    <button type="button">Aggiungi membro</button>
                                </div>
                                <div class="member-list">
                                    @for (membro of membri; track membro.nome) {
                                        <article class="member-card">
                                            <div>
                                                <strong>{{ membro.nome }} {{ membro.cognome }}</strong>
                                                <span>{{ membro.ruolo }}</span>
                                            </div>
                                            <dl>
                                                <div><dt>Accesso app</dt><dd>{{ membro.accessoApp }}</dd></div>
                                                <div><dt>Stato</dt><dd>{{ membro.stato }}</dd></div>
                                                <div><dt>Privacy</dt><dd><span class="badge" [ngClass]="privacyClass(membro.privacy)">{{ membro.privacy }}</span></dd></div>
                                            </dl>
                                        </article>
                                    }
                                </div>
                            </article>
                        </section>
                    }

                    @if (section === 'convivenze') {
                        <section class="split-page">
                            <aside class="panel list-panel">
                                <div class="panel-head">
                                    <h1>Convivenze</h1>
                                    <button type="button">Nuova convivenza</button>
                                </div>
                                @for (convivenza of convivenze; track convivenza.titolo) {
                                    <button type="button" class="list-item" [class.active]="convivenza.titolo === selectedConvivenza.titolo" (click)="selectedConvivenza = convivenza">
                                        <strong>{{ convivenza.titolo }}</strong>
                                        <span>{{ convivenza.dataInizio }} - {{ convivenza.dataFine }}</span>
                                        <small>{{ convivenza.luogo }}</small>
                                    </button>
                                }
                            </aside>

                            <article class="panel detail-panel">
                                <span class="eyebrow">{{ comunita.nome }}</span>
                                <h1>{{ selectedConvivenza.titolo }}</h1>
                                <div class="info-grid">
                                    <div><span>Stato</span><strong>{{ selectedConvivenza.stato }}</strong></div>
                                    <div><span>Richiesta struttura</span><strong>{{ selectedConvivenza.richiesta }}</strong></div>
                                    <div><span>Partecipanti</span><strong>{{ selectedConvivenza.partecipanti }}</strong></div>
                                    <div><span>Luogo</span><strong>{{ selectedConvivenza.luogo }}</strong></div>
                                </div>
                                <section class="aggregate-grid">
                                    <div><span>Adulti</span><strong>24</strong></div>
                                    <div><span>Bambini</span><strong>6</strong></div>
                                    <div><span>Pasti speciali</span><strong>3</strong></div>
                                    <div><span>Consensi da verificare</span><strong>2</strong></div>
                                </section>
                                <div class="map-placeholder">
                                    <i class="pi pi-map-marker"></i>
                                    <strong>Mappa luogo convivenza</strong>
                                    <span>Google Maps sarà integrato in una fase successiva.</span>
                                </div>
                            </article>
                        </section>
                    }

                    @if (section === 'posti-convivenza') {
                        <section class="split-page">
                            <aside class="panel list-panel">
                                <div class="panel-head">
                                    <h1>Posti</h1>
                                    <button type="button">Nuovo posto</button>
                                </div>
                                @for (posto of posti; track posto.nome) {
                                    <button type="button" class="list-item" [class.active]="posto.nome === selectedPosto.nome" (click)="selectedPosto = posto">
                                        <strong>{{ posto.nome }}</strong>
                                        <span>{{ posto.citta }}, {{ posto.regione }}</span>
                                        <small>{{ posto.stato }}</small>
                                    </button>
                                }
                            </aside>

                            <article class="panel detail-panel">
                                <span class="eyebrow">{{ selectedPosto.tipologia }}</span>
                                <h1>{{ selectedPosto.nome }}</h1>
                                <div class="info-grid">
                                    <div><span>Indirizzo</span><strong>{{ selectedPosto.indirizzo }}</strong></div>
                                    <div><span>Città / Regione</span><strong>{{ selectedPosto.citta }}, {{ selectedPosto.regione }}</strong></div>
                                    <div><span>Capienza</span><strong>{{ selectedPosto.capienza }}</strong></div>
                                    <div><span>Stato relazione</span><strong>{{ selectedPosto.stato }}</strong></div>
                                </div>
                                <div class="map-placeholder">
                                    <i class="pi pi-map"></i>
                                    <strong>{{ selectedPosto.nome }}</strong>
                                    <span>Google Maps integrato in fase successiva.</span>
                                </div>
                                <section class="experience-box">
                                    <div>
                                        <h2>Esperienze delle comunità</h2>
                                        <p>Storico dimostrativo delle convivenze svolte presso questa struttura.</p>
                                    </div>
                                    <button type="button">Condividi esperienza</button>
                                </section>
                            </article>
                        </section>
                    }

                    @if (section === 'viaggi') {
                        <section class="panel travel-page">
                            <span class="eyebrow">Viaggi / Pellegrinaggi</span>
                            <h1>Modulo in preparazione</h1>
                            <div class="travel-grid">
                                @for (card of travelCards; track card.title) {
                                    <article>
                                        <i class="pi" [ngClass]="card.icon"></i>
                                        <h2>{{ card.title }}</h2>
                                        <p>{{ card.text }}</p>
                                    </article>
                                }
                            </div>
                        </section>
                    }
                </div>

                <footer class="demo-footer">
                    <span>All rights reserved. Progettato da PANTELEIA - Associazione Promozione Sociale. CF: 96647400587</span>
                    <span>Iscrizione RUNTS: Rep. n. 165890 – Det. n. G03684 del 19/03/2026</span>
                </footer>
            </section>
        </main>
    `,
    styles: [
        `
            :host {
                display: block;
                min-height: 100vh;
                color: #0f2440;
                font-family:
                    Inter,
                    system-ui,
                    -apple-system,
                    BlinkMacSystemFont,
                    'Segoe UI',
                    sans-serif;
            }

            .demo-app {
                min-height: 100vh;
                display: grid;
                grid-template-columns: 280px minmax(0, 1fr);
                background: #eef2f6;
            }

            .demo-sidebar {
                position: sticky;
                top: 0;
                height: 100vh;
                display: flex;
                flex-direction: column;
                gap: 1.2rem;
                padding: 1.2rem;
                background: #0f2d52;
                color: #ffffff;
            }

            .demo-brand {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                color: #ffffff;
                text-decoration: none;
            }

            .demo-brand span {
                width: 42px;
                height: 42px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                border-radius: 10px;
                background: rgba(255, 255, 255, 0.12);
                border: 1px solid rgba(255, 255, 255, 0.22);
                font-weight: 900;
            }

            .demo-community {
                display: grid;
                gap: 0.25rem;
                color: rgba(255, 255, 255, 0.78);
            }

            .demo-community strong {
                color: #ffffff;
            }

            .demo-pill {
                width: fit-content;
                display: inline-flex;
                align-items: center;
                border-radius: 999px;
                padding: 0.26rem 0.65rem;
                background: #fff7ed;
                color: #7c2d12;
                font-size: 0.72rem;
                font-weight: 900;
                text-transform: uppercase;
                letter-spacing: 0.04em;
            }

            .demo-nav {
                display: grid;
                gap: 0.35rem;
            }

            .demo-nav a,
            .demo-sidebar-bottom a {
                min-height: 44px;
                display: flex;
                align-items: center;
                gap: 0.7rem;
                border-radius: 12px;
                padding: 0.7rem 0.85rem;
                color: rgba(255, 255, 255, 0.8);
                text-decoration: none;
                font-weight: 700;
            }

            .demo-nav a.active,
            .demo-nav a:hover,
            .demo-sidebar-bottom a:hover {
                background: rgba(255, 255, 255, 0.12);
                color: #ffffff;
            }

            .demo-sidebar-bottom {
                margin-top: auto;
                display: grid;
                gap: 0.35rem;
            }

            .demo-sidebar-bottom .login-link {
                background: rgba(255, 255, 255, 0.16);
                color: #ffffff;
            }

            .demo-main {
                min-width: 0;
                display: flex;
                flex-direction: column;
                min-height: 100vh;
            }

            .demo-topbar {
                min-height: 64px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 1rem;
                padding: 0.75rem 1.4rem;
                background: #ffffff;
                border-bottom: 1px solid #dde5ef;
            }

            .demo-topbar div {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                color: #64748b;
            }

            .topbar-login {
                min-height: 40px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                border-radius: 999px;
                padding: 0.5rem 0.9rem;
                background: #15365c;
                color: #ffffff;
                text-decoration: none;
                font-weight: 800;
            }

            .demo-content {
                flex: 1;
                padding: clamp(1rem, 2.2vw, 1.6rem);
            }

            .dashboard-stage {
                min-height: calc(100vh - 9rem);
                display: grid;
                grid-template-columns: 280px minmax(0, 1fr);
                gap: 1.2rem;
                align-items: stretch;
                padding: 1.1rem;
                border-radius: 18px;
                background:
                    linear-gradient(90deg, rgba(255, 255, 255, 0.34), rgba(15, 45, 82, 0.14)),
                    url('/assets/images/dashboard-bg.jpg') center / cover no-repeat;
                overflow: hidden;
            }

            .community-summary,
            .module-card,
            .panel {
                background: rgba(255, 252, 245, 0.94);
                border: 1px solid rgba(255, 255, 255, 0.72);
                box-shadow: 0 16px 34px rgba(31, 41, 55, 0.12);
                border-radius: 16px;
            }

            .community-summary {
                padding: 1.2rem;
            }

            .community-summary > span,
            .eyebrow {
                color: #476078;
                font-weight: 900;
                font-size: 0.78rem;
                text-transform: uppercase;
                letter-spacing: 0.04em;
            }

            h1,
            h2 {
                color: #111827;
            }

            .community-summary h1,
            .panel h1 {
                margin: 0.45rem 0 1rem;
                font-size: clamp(1.65rem, 3vw, 2.2rem);
            }

            dl {
                margin: 0;
            }

            .community-summary dl,
            .info-grid,
            .aggregate-grid {
                display: grid;
                gap: 0.8rem;
            }

            dt,
            .info-grid span,
            .aggregate-grid span {
                color: #64748b;
                font-size: 0.82rem;
            }

            dd {
                margin: 0.15rem 0 0;
                color: #111827;
                font-weight: 800;
            }

            .module-grid {
                display: grid;
                grid-template-columns: repeat(4, minmax(0, 1fr));
                gap: 1rem;
            }

            .module-card {
                --accent: #547fa3;
                min-height: 15rem;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 0.85rem;
                padding: 1.25rem;
                text-align: center;
                text-decoration: none;
                border-top: 4px solid var(--accent);
            }

            .module-card.convivenze {
                --accent: #2f867c;
            }

            .module-card.posti {
                --accent: #b86f35;
            }

            .module-card.viaggi {
                --accent: #8a3f4c;
            }

            .module-card .pi {
                width: 52px;
                height: 52px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                border-radius: 14px;
                background: color-mix(in srgb, var(--accent), transparent 88%);
                color: var(--accent);
                font-size: 1.4rem;
            }

            .module-card h2 {
                margin: 0;
                font-size: 1.2rem;
            }

            .module-card .status {
                border: 1px solid #dde5ef;
                border-radius: 999px;
                padding: 0.22rem 0.6rem;
                background: rgba(255, 255, 255, 0.8);
                color: #475569;
                font-size: 0.78rem;
                font-weight: 800;
            }

            .module-card strong {
                width: 100%;
                min-height: 44px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                border-radius: 10px;
                background: var(--accent);
                color: #ffffff;
            }

            .page-grid,
            .split-page {
                display: grid;
                gap: 1.2rem;
            }

            .split-page {
                grid-template-columns: 330px minmax(0, 1fr);
            }

            .panel {
                padding: 1.2rem;
            }

            .panel-head {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 1rem;
                margin-bottom: 1rem;
            }

            .panel-head h1,
            .panel-head h2 {
                margin: 0.2rem 0 0;
            }

            button {
                min-height: 44px;
                border: 0;
                border-radius: 10px;
                padding: 0.65rem 0.9rem;
                background: #15365c;
                color: #ffffff;
                cursor: pointer;
                font-weight: 800;
            }

            .info-grid {
                grid-template-columns: repeat(4, minmax(0, 1fr));
            }

            .info-grid > div,
            .aggregate-grid > div {
                border: 1px solid #e5e7eb;
                border-radius: 12px;
                padding: 0.8rem;
                background: #fbfbf8;
            }

            .info-grid strong,
            .aggregate-grid strong {
                display: block;
                margin-top: 0.25rem;
                color: #111827;
            }

            .member-list {
                display: grid;
                grid-template-columns: repeat(2, minmax(0, 1fr));
                gap: 0.85rem;
            }

            .member-card,
            .list-item {
                border: 1px solid #e5e7eb;
                border-radius: 14px;
                background: #ffffff;
            }

            .member-card {
                padding: 1rem;
                display: grid;
                gap: 0.9rem;
            }

            .member-card > div {
                display: grid;
                gap: 0.2rem;
            }

            .member-card span,
            .member-card dt {
                color: #64748b;
            }

            .member-card dl {
                display: grid;
                grid-template-columns: repeat(3, minmax(0, 1fr));
                gap: 0.7rem;
            }

            .badge {
                display: inline-flex;
                border-radius: 999px;
                padding: 0.2rem 0.55rem;
                font-weight: 800;
                font-size: 0.78rem;
            }

            .badge.ok {
                background: #dcfce7;
                color: #166534;
            }

            .badge.warn {
                background: #fef3c7;
                color: #92400e;
            }

            .badge.danger {
                background: #fee2e2;
                color: #991b1b;
            }

            .list-panel {
                align-self: start;
                display: grid;
                gap: 0.75rem;
            }

            .list-item {
                width: 100%;
                padding: 0.9rem;
                display: grid;
                gap: 0.35rem;
                text-align: left;
                background: #fafafa;
                color: #0f2440;
            }

            .list-item.active {
                border-color: #2f867c;
                background: #eefaf7;
            }

            .list-item span,
            .list-item small {
                color: #64748b;
            }

            .detail-panel {
                display: grid;
                gap: 1rem;
                align-content: start;
            }

            .aggregate-grid {
                grid-template-columns: repeat(4, minmax(0, 1fr));
            }

            .map-placeholder {
                min-height: 220px;
                border: 1px dashed #9ca3af;
                border-radius: 14px;
                background: #f8fafc;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 0.5rem;
                text-align: center;
                color: #334155;
            }

            .map-placeholder .pi {
                color: #2f867c;
                font-size: 2rem;
            }

            .experience-box {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 1rem;
                border: 1px solid #e5e7eb;
                border-radius: 14px;
                padding: 1rem;
                background: #fbfbf8;
            }

            .experience-box h2,
            .experience-box p {
                margin: 0;
            }

            .experience-box p,
            .travel-grid p {
                color: #64748b;
            }

            .travel-page {
                min-height: calc(100vh - 10rem);
                display: grid;
                align-content: start;
                gap: 1.2rem;
            }

            .travel-grid {
                display: grid;
                grid-template-columns: repeat(4, minmax(0, 1fr));
                gap: 1rem;
            }

            .travel-grid article {
                border: 1px solid #e5e7eb;
                border-radius: 14px;
                padding: 1rem;
                background: #ffffff;
            }

            .travel-grid .pi {
                color: #8a3f4c;
                font-size: 1.5rem;
            }

            .demo-footer {
                display: flex;
                flex-wrap: wrap;
                justify-content: center;
                gap: 0.35rem 1rem;
                padding: 0.85rem 1rem 1.1rem;
                color: #6b7280;
                font-size: 0.75rem;
                text-align: center;
            }

            @media (max-width: 1180px) {
                .demo-app,
                .dashboard-stage,
                .split-page {
                    grid-template-columns: 1fr;
                }

                .demo-sidebar {
                    position: static;
                    height: auto;
                }

                .demo-nav {
                    grid-template-columns: repeat(3, minmax(0, 1fr));
                }

                .module-grid,
                .travel-grid {
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                }
            }

            @media (max-width: 767px) {
                .demo-sidebar {
                    padding: 1rem;
                }

                .demo-nav,
                .module-grid,
                .member-list,
                .info-grid,
                .aggregate-grid,
                .travel-grid {
                    grid-template-columns: 1fr;
                }

                .demo-topbar,
                .demo-topbar div,
                .panel-head,
                .experience-box {
                    flex-direction: column;
                    align-items: stretch;
                }

                .topbar-login,
                .panel-head button,
                .experience-box button {
                    width: 100%;
                }

                .dashboard-stage {
                    min-height: auto;
                    padding: 0.85rem;
                }

                .module-card {
                    min-height: 11rem;
                }

                .member-card dl {
                    grid-template-columns: 1fr;
                }
            }
        `
    ]
})
export class DemoShellComponent {
    private readonly router = inject(Router);

    readonly comunita = DEMO_COMUNITA;
    readonly membri = DEMO_MEMBRI;
    readonly convivenze = DEMO_CONVIVENZE;
    readonly posti = DEMO_POSTI;
    selectedConvivenza: (typeof DEMO_CONVIVENZE)[number] = DEMO_CONVIVENZE[0];
    selectedPosto: (typeof DEMO_POSTI)[number] = DEMO_POSTI[0];

    readonly modules = [
        { title: 'La tua Comunità', route: '/demo/comunita', icon: 'pi-users', tone: 'community', status: 'Attivo' },
        { title: 'Convivenze', route: '/demo/convivenze', icon: 'pi-calendar', tone: 'convivenze', status: 'Demo' },
        { title: 'Posti di Convivenza', route: '/demo/posti-convivenza', icon: 'pi-building', tone: 'posti', status: 'Demo' },
        { title: 'Viaggi / Pellegrinaggi', route: '/demo/viaggi', icon: 'pi-send', tone: 'viaggi', status: 'Prossimamente' }
    ];

    readonly travelCards = [
        { title: 'Pellegrinaggi', icon: 'pi-map', text: 'Programmazione tappe, date e luoghi.' },
        { title: 'Trasporti', icon: 'pi-car', text: 'Organizzazione pullman, auto e transfer.' },
        { title: 'Partecipanti', icon: 'pi-users', text: 'Elenco partecipanti e necessità aggregate.' },
        { title: 'Documenti', icon: 'pi-file', text: 'Stati documentali senza upload sensibili.' }
    ];

    get section(): DemoSection {
        const path = this.router.url.split('?')[0].split('#')[0].replace(/\/$/, '');
        if (path.endsWith('/comunita')) return 'comunita';
        if (path.endsWith('/convivenze')) return 'convivenze';
        if (path.endsWith('/posti-convivenza') || path.endsWith('/posti-convivenza/mappa')) return 'posti-convivenza';
        if (path.endsWith('/viaggi')) return 'viaggi';
        return 'dashboard';
    }

    privacyClass(value: string) {
        if (value === 'Raccolto') return 'ok';
        if (value === 'Da raccogliere') return 'warn';
        return 'danger';
    }
}
