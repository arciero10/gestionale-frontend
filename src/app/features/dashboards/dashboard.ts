import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { DEMO_COMUNITA, DEMO_CONVIVENZE, DEMO_MEMBRI, DEMO_POSTI } from '../demo/demo.mock';
import { COMUNITA_ATTIVA_MOCK } from '../gestionaleCN/data/anagrafica-ecclesiale.mock';
import { getCurrentCommunity, hasSelectedCommunity, updateSelectedCommunityTappa } from '../gestionaleCN/data/community-selection.storage';
import { ensureAccessContext } from '../gestionaleCN/data/access-context.mock';
import { canSeeMenuItem, getUserAccessContext } from '../gestionaleCN/data/access-policy.mock';
import { Carisma, getPermessiByCarismi, normalizeCarismaForPermissions } from '../gestionaleCN/data/permessi-carisma.mock';
import { TAPPE_CAMMINO, TappaCammino, normalizeTappaCammino } from '../gestionaleCN/data/tappe-cammino.mock';

interface DashboardModule {
    title: string;
    icon: string;
    status: 'Attivo' | 'In sviluppo' | 'Prossimamente';
    route: string;
    tone: 'community' | 'convivenze' | 'posti' | 'viaggi';
    cta: 'Apri' | 'Entra' | 'Vai al modulo';
}

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink, ButtonModule, SelectModule, TagModule],
    template: `
        <section class="dashboard-stage">
            <div class="dashboard-overlay"></div>

            <div class="dashboard-content">
                <aside class="community-summary" aria-label="Dati comunità">
                    <span class="summary-eyebrow">{{ isDemo ? 'Comunità demo' : 'Comunità attiva' }}</span>
                    <h1>{{ nomeComunita }}</h1>
                    <p class="summary-parish">{{ parrocchia }}</p>
                    <dl>
                        <div>
                            <dt>Settore:</dt>
                            <dd>{{ settore }}</dd>
                        </div>
                        <div>
                            <dt>Diocesi:</dt>
                            <dd>{{ diocesi }}</dd>
                        </div>
                        <div class="summary-tappa">
                            <dt>Tappa del Cammino</dt>
                            <dd>
                                @if (tappaInModifica && currentUserCanEditCommunity && !isDemo) {
                                    <div class="tappa-edit">
                                        <p-select
                                            inputId="dashboardTappaCammino"
                                            appendTo="body"
                                            panelStyleClass="dashboard-dropdown-panel"
                                            [options]="tappeOptions"
                                            [(ngModel)]="tappaInBozza"
                                            ariaLabel="Tappa del Cammino"
                                        ></p-select>
                                        <button pButton type="button" label="Salva" size="small" (click)="salvaTappa()"></button>
                                        <button pButton type="button" label="Annulla" size="small" severity="secondary" outlined (click)="annullaTappa()"></button>
                                    </div>
                                } @else {
                                    <div class="tappa-readonly" [title]="tappaCammino">
                                        <span>{{ tappaCammino }}</span>
                                        @if (currentUserCanEditCommunity && !isDemo) {
                                            <button pButton type="button" icon="pi pi-pencil" label="Modifica" size="small" text (click)="modificaTappa()"></button>
                                        }
                                    </div>
                                }
                            </dd>
                        </div>
                        <div>
                            <dt>Membri</dt>
                            <dd>{{ membriCount }}</dd>
                        </div>
                        <div>
                            <dt>Convivenze in programma</dt>
                            <dd>{{ convivenzeCount }}</dd>
                        </div>
                    </dl>
                </aside>

                <div class="dashboard-grid">
                    @for (module of modules; track module.title) {
                        <a [routerLink]="module.route" class="module-card" [ngClass]="'module-card-' + module.tone" [attr.aria-label]="module.title">
                            <div class="module-icon">
                                <i class="pi" [ngClass]="module.icon"></i>
                            </div>
                            <h2 class="brand-neocat">{{ module.title }}</h2>
                            <p-tag [value]="module.status" />
                            <span class="module-button">{{ module.cta }}</span>
                        </a>
                    }
                </div>
                @if (messaggio) {
                    <div class="dashboard-message">
                        <i class="pi pi-check-circle"></i>
                        <span>{{ messaggio }}</span>
                    </div>
                }
            </div>
        </section>
    `,
    styles: [
        `
            :host {
                display: block;
                width: 100%;
            }

            .dashboard-stage {
                position: relative;
                width: 100%;
                min-height: 100vh;
                padding: 5rem clamp(1rem, 2.5vw, 2rem) clamp(1rem, 2.5vw, 2rem);
                display: flex;
                align-items: center;
                overflow: hidden;
                isolation: isolate;
                background: transparent;
            }

            .dashboard-overlay {
                position: absolute;
                inset: 0;
                z-index: 0;
                pointer-events: none;
                background: linear-gradient(90deg, rgba(255, 255, 255, 0.24), rgba(10, 25, 45, 0.1));
            }

            .dashboard-content {
                position: relative;
                z-index: 1;
                width: 100%;
                display: grid;
                grid-template-columns: 1fr;
                gap: clamp(1rem, 2vw, 1.5rem);
                align-items: start;
            }

            .community-summary,
            .module-card {
                background: rgba(255, 252, 245, 0.9);
                border: 1px solid rgba(255, 255, 255, 0.7);
                box-shadow: 0 16px 34px rgba(31, 41, 55, 0.16);
                border-radius: 16px;
            }

            .community-summary {
                min-height: 104px;
                padding: 1rem 1.15rem;
                color: #1f2937;
                display: grid;
                grid-template-columns: minmax(12rem, 18rem) minmax(0, 1fr);
                gap: 1rem;
                align-items: center;
            }

            .summary-eyebrow {
                display: block;
                margin-bottom: 0.5rem;
                font-size: 0.8rem;
                font-weight: 700;
                color: #476078;
                text-transform: uppercase;
                grid-column: 1;
                grid-row: 1;
                align-self: end;
            }

            .community-summary h1 {
                margin: 0;
                color: #111827;
                font-size: clamp(1.3rem, 2vw, 1.7rem);
                line-height: 1.1;
                grid-column: 1;
                grid-row: 2;
                align-self: start;
            }

            .summary-parish {
                margin: 0.35rem 0 0;
                color: #334155;
                font-weight: 700;
                line-height: 1.25;
                grid-column: 1;
                grid-row: 3;
            }

            .community-summary dl {
                display: flex;
                flex-wrap: wrap;
                justify-content: flex-end;
                gap: 0.55rem;
                margin: 0;
                grid-column: 2;
                grid-row: 1 / span 3;
            }

            .community-summary dl div {
                flex: 1 1 8.5rem;
                min-height: 3.2rem;
                display: grid;
                align-content: center;
                padding: 0.45rem 0.7rem;
                border-radius: 12px;
                background: rgba(255, 255, 255, 0.66);
                border: 1px solid rgba(31, 41, 55, 0.08);
            }

            .community-summary dl div.summary-tappa {
                flex: 3 1 29rem;
                min-width: min(100%, 29rem);
                min-height: 3.8rem;
                align-content: start;
            }

            .community-summary dt {
                color: #6b7280;
                font-size: 0.75rem;
            }

            .community-summary dd {
                margin: 0.15rem 0 0;
                color: #111827;
                font-weight: 700;
                line-height: 1.15;
            }

            .tappa-readonly,
            .tappa-edit {
                display: flex;
                align-items: center;
                gap: 0.45rem;
                min-width: 0;
            }

            .tappa-edit {
                display: grid;
                grid-template-columns: minmax(22rem, 1fr) auto auto;
                width: 100%;
            }

            .tappa-readonly span {
                flex: 1;
                min-width: 0;
                max-width: 100%;
                padding: 0.6rem 1rem;
                border-radius: 10px;
                color: #334155;
                background: #eef2f7;
                border: 1px solid #dbe3ec;
                white-space: normal;
                word-break: break-word;
                line-height: 1.4;
                font-size: 0.95rem;
                font-weight: 600;
            }

            .tappa-edit p-select {
                min-width: 22rem;
                width: 100%;
            }

            .community-summary p-select {
                display: block;
                min-width: 0;
                width: 100%;
                max-width: 100%;
            }

            :host ::ng-deep .community-summary .p-select {
                width: 100%;
                min-height: 2.5rem;
                border-radius: 10px;
                background: rgba(255, 255, 255, 0.82);
            }

            :host ::ng-deep .community-summary .p-select-label {
                white-space: normal;
                overflow: visible;
                text-overflow: clip;
                font-size: 0.9rem;
                line-height: 1.3;
                padding-top: 0.5rem;
                padding-bottom: 0.5rem;
            }

            :host ::ng-deep .dashboard-dropdown-panel {
                z-index: 12000 !important;
            }

            .dashboard-message {
                justify-self: end;
                display: inline-flex;
                align-items: center;
                gap: 0.45rem;
                padding: 0.5rem 0.75rem;
                border-radius: 999px;
                color: #166534;
                background: rgba(220, 252, 231, 0.94);
                border: 1px solid #bbf7d0;
                font-weight: 800;
                box-shadow: 0 10px 24px rgba(15, 23, 42, 0.12);
            }

            .dashboard-grid {
                display: grid;
                grid-template-columns: repeat(4, minmax(0, 1fr));
                gap: 1rem;
            }

            .module-card {
                --card-accent: #4f7da3;
                min-height: 190px;
                max-height: 230px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 0.85rem;
                padding: 1.15rem;
                color: #1f2937;
                text-align: center;
                text-decoration: none;
                border-top: 4px solid var(--card-accent);
                transition:
                    transform 180ms ease,
                    box-shadow 180ms ease,
                    border-color 180ms ease;
            }

            .module-card:hover {
                transform: translateY(-4px);
                box-shadow: 0 22px 42px rgba(31, 41, 55, 0.22);
                border-color: rgba(255, 255, 255, 0.95);
            }

            .module-icon {
                width: 3rem;
                height: 3rem;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 14px;
                color: var(--card-accent);
                background: color-mix(in srgb, var(--card-accent), transparent 90%);
            }

            .module-icon .pi {
                font-size: 1.45rem;
            }

            .module-card h2 {
                margin: 0;
                color: #111827;
                font-size: 1.15rem;
                font-weight: 400;
                line-height: 1.2;
            }

            .module-button {
                min-height: 44px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 100%;
                border-radius: 10px;
                background: var(--card-accent);
                color: #fff;
                font-weight: 800;
            }

            :host ::ng-deep .module-card .p-tag {
                padding: 0.22rem 0.55rem;
                background: rgba(255, 255, 255, 0.78);
                color: #374151;
                border: 1px solid rgba(31, 41, 55, 0.1);
            }

            .module-card-community {
                --card-accent: #547fa3;
            }

            .module-card-convivenze {
                --card-accent: #2f867c;
            }

            .module-card-posti {
                --card-accent: #b86f35;
            }

            .module-card-viaggi {
                --card-accent: #8a3f4c;
            }

            @media (max-width: 1024px) {
                .dashboard-content {
                    grid-template-columns: 1fr;
                }

                .community-summary {
                    grid-template-columns: 1fr;
                }

                .community-summary dl {
                    justify-content: flex-start;
                    grid-column: 1;
                    grid-row: auto;
                }

                .summary-parish {
                    grid-column: 1;
                    grid-row: auto;
                }

                .dashboard-message {
                    justify-self: start;
                }

                .dashboard-grid {
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                }
            }

            @media (max-width: 767px) {
                .dashboard-stage {
                    min-height: 100vh;
                    padding: 0.85rem;
                    align-items: flex-start;
                    background-position: center top;
                }

                .dashboard-overlay {
                    background: rgba(255, 255, 255, 0.38);
                }

                .dashboard-grid {
                    grid-template-columns: 1fr;
                }

                .module-card {
                    min-height: 10.5rem;
                    gap: 0.75rem;
                }

                .community-summary {
                    min-height: auto;
                    padding: 1rem;
                }

                .community-summary dl {
                    display: grid;
                    grid-template-columns: 1fr;
                }

                .tappa-readonly,
                .tappa-edit {
                    flex-wrap: wrap;
                    grid-template-columns: 1fr;
                }

                .tappa-readonly span {
                    max-width: 100%;
                }
            }
        `
    ]
})
export class Dashboard {
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly comunitaAttiva = COMUNITA_ATTIVA_MOCK;
    private readonly currentCommunity = getCurrentCommunity();
    private readonly tappaStorageKey = 'eventiComunita.tappaCammino';

    readonly currentUserCarismi = this.leggiCarismiUtente();
    readonly currentUserPermessi = getPermessiByCarismi(this.currentUserCarismi);
    readonly userAccessContext = getUserAccessContext();
    readonly currentUserCanEditCommunity = this.currentUserPermessi.includes('EDIT_COMUNITA');
    tappeOptions = [...TAPPE_CAMMINO];
    tappaCammino: TappaCammino = 'Precatecumenato';
    tappaInBozza: TappaCammino = 'Precatecumenato';
    tappaInModifica = false;
    messaggio = '';

    constructor() {
        const normalizedUrl = this.router.url.split('?')[0].split('#')[0];

        if (!this.isDemo && (normalizedUrl === '/gestionale-cn' || normalizedUrl === '/gestionale-cn/dashboard')) {
            if (!hasSelectedCommunity()) {
                this.router.navigateByUrl('/gestionale-cn/onboarding-comunita', { replaceUrl: true });
                return;
            }

            const context = ensureAccessContext();

            if (context.id !== 'comunita' && normalizedUrl === '/gestionale-cn/dashboard') {
                this.router.navigateByUrl(context.route, { replaceUrl: true });
                return;
            }
        }

        this.tappaCammino = this.isDemo ? normalizeTappaCammino(DEMO_COMUNITA.tappaCammino) : this.leggiTappaSalvata();
        this.tappaInBozza = this.tappaCammino;
    }

    get isDemo() {
        const url = this.router.url.split('?')[0].split('#')[0];
        return this.route.snapshot.data['demo'] === true || url === '/demo' || url.startsWith('/demo/');
    }

    get basePath() {
        return this.isDemo ? '/demo' : '/gestionale-cn';
    }

    get nomeComunita() {
        return this.isDemo ? DEMO_COMUNITA.nome : this.currentCommunity.nomeComunita;
    }

    get parrocchia() {
        return this.isDemo ? DEMO_COMUNITA.parrocchia : this.currentCommunity.parrocchiaNome;
    }

    get settore() {
        return this.isDemo ? DEMO_COMUNITA.settore.replace(/^Settore\s+/i, '') : this.currentCommunity.settoreNome.replace(/^Settore\s+/i, '');
    }

    get diocesi() {
        return this.isDemo ? DEMO_COMUNITA.diocesi : this.currentCommunity.diocesiNome;
    }

    get membriCount() {
        return this.isDemo ? DEMO_MEMBRI.length : this.currentCommunity.isPilot ? 42 : 0;
    }

    get convivenzeCount() {
        return this.isDemo ? DEMO_CONVIVENZE.length : this.currentCommunity.isPilot ? 2 : 0;
    }

    get postiCount() {
        return this.isDemo ? DEMO_POSTI.length : 5;
    }

    get modules(): DashboardModule[] {
        const modules: DashboardModule[] = [
            {
                title: 'La tua Comunità',
                icon: 'pi-users',
                status: 'Attivo',
                route: `${this.basePath}/comunita`,
                tone: 'community',
                cta: 'Apri'
            },
            {
                title: 'Convivenze',
                icon: 'pi-calendar',
                status: 'In sviluppo',
                route: `${this.basePath}/convivenze`,
                tone: 'convivenze',
                cta: 'Entra'
            },
            {
                title: 'Catalogo strutture',
                icon: 'pi-building',
                status: 'In sviluppo',
                route: `${this.basePath}/catalogo-strutture`,
                tone: 'posti',
                cta: 'Vai al modulo'
            },
            {
                title: 'Viaggi / Pellegrinaggi',
                icon: 'pi-send',
                status: 'Prossimamente',
                route: `${this.basePath}/viaggi`,
                tone: 'viaggi',
                cta: 'Apri'
            }
        ];

        return modules.filter((module) => {
            if (module.route.endsWith('/catalogo-strutture')) {
                return canSeeMenuItem('posti-convivenza', this.userAccessContext);
            }

            return true;
        });
    }

    modificaTappa() {
        if (!this.currentUserCanEditCommunity) {
            return;
        }
        this.tappaInBozza = this.tappaCammino;
        this.tappaInModifica = true;
    }

    salvaTappa() {
        this.tappaCammino = this.tappaInBozza;
        updateSelectedCommunityTappa(this.tappaCammino);
        this.tappaInModifica = false;
        this.messaggio = 'Tappa del Cammino aggiornata';
    }

    annullaTappa() {
        this.tappaInBozza = this.tappaCammino;
        this.tappaInModifica = false;
    }

    private leggiTappaSalvata(): TappaCammino {
        const saved = this.currentCommunity.tappaCammino ?? localStorage.getItem(this.tappaStorageKey) ?? localStorage.getItem('eventiComunità.tappaCammino') ?? '';
        return saved ? normalizeTappaCammino(saved) : normalizeTappaCammino(this.comunitaAttiva.tappaCammino);
    }

    private leggiCarismiUtente(): Carisma[] {
        const raw = localStorage.getItem('onboardingUserProfile');

        if (!raw) {
            return ['responsabile'];
        }

        try {
            const profile = JSON.parse(raw) as { carismi?: string[]; ruoloComunitario?: string; isCatechista?: boolean };
            const carismi = new Set<Carisma>();

            if (Array.isArray(profile.carismi)) {
                profile.carismi.forEach((carisma) => carismi.add(normalizeCarismaForPermissions(carisma)));
            } else {
                carismi.add(normalizeCarismaForPermissions(profile.ruoloComunitario));
            }

            if (profile.isCatechista === true) {
                carismi.add('catechista');
            }

            return Array.from(carismi);
        } catch {
            return ['responsabile'];
        }
    }
}
