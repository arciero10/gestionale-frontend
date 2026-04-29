import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TagModule } from 'primeng/tag';
import { DEMO_COMUNITA, DEMO_CONVIVENZE, DEMO_MEMBRI, DEMO_POSTI } from '../demo/demo.mock';
import { COMUNITA_ATTIVA_MOCK, DIOCESI_MOCK, PARROCCHIE_MOCK, SETTORI_MOCK, generaNomeComunita } from '../gestionaleCN/data/anagrafica-ecclesiale.mock';

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
    imports: [CommonModule, RouterLink, TagModule],
    template: `
        <section class="dashboard-stage">
            <div class="dashboard-overlay"></div>

            <div class="dashboard-content">
                <span class="auth-render-check" *ngIf="!isDemo">Dashboard autenticata caricata</span>
                <aside class="community-summary" aria-label="Dati comunità">
                    <span class="summary-eyebrow">{{ isDemo ? 'Comunità demo' : 'Comunità attiva' }}</span>
                    <h1>{{ nomeComunita }}</h1>
                    <dl>
                        <div>
                            <dt>Parrocchia</dt>
                            <dd>{{ parrocchia }}</dd>
                        </div>
                        <div>
                            <dt>Settore</dt>
                            <dd>Settore {{ settore }}</dd>
                        </div>
                        <div>
                            <dt>Diocesi</dt>
                            <dd>{{ diocesi }}</dd>
                        </div>
                        <div>
                            <dt>Tappa del Cammino</dt>
                            <dd>{{ tappaCammino }}</dd>
                        </div>
                        <div>
                            <dt>Membri</dt>
                            <dd>{{ membriCount }}</dd>
                        </div>
                        <div>
                            <dt>Convivenze in programma</dt>
                            <dd>{{ convivenzeCount }}</dd>
                        </div>
                        <div>
                            <dt>Posti censiti</dt>
                            <dd>{{ postiCount }}</dd>
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
                min-height: calc(100vh - 4rem);
                padding: clamp(1rem, 2.5vw, 2rem);
                display: flex;
                align-items: center;
                overflow: hidden;
                isolation: isolate;
                background-image: url('/assets/images/dashboard-bg.jpg');
                background-size: cover;
                background-position: center;
                background-repeat: no-repeat;
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
                grid-template-columns: minmax(14rem, 18rem) minmax(0, 1fr);
                gap: clamp(1rem, 2vw, 1.5rem);
                align-items: stretch;
            }

            .auth-render-check {
                position: absolute;
                top: -0.2rem;
                right: 0;
                padding: 0.3rem 0.65rem;
                border-radius: 999px;
                background: rgba(255, 255, 255, 0.82);
                color: #0f2440;
                font-size: 0.78rem;
                font-weight: 800;
                box-shadow: 0 8px 18px rgba(15, 23, 42, 0.14);
            }

            .community-summary,
            .module-card {
                background: rgba(255, 252, 245, 0.9);
                border: 1px solid rgba(255, 255, 255, 0.7);
                box-shadow: 0 16px 34px rgba(31, 41, 55, 0.16);
                border-radius: 16px;
            }

            .community-summary {
                padding: 1.25rem;
                color: #1f2937;
            }

            .summary-eyebrow {
                display: block;
                margin-bottom: 0.5rem;
                font-size: 0.8rem;
                font-weight: 700;
                color: #476078;
                text-transform: uppercase;
            }

            .community-summary h1 {
                margin: 0 0 1rem;
                color: #111827;
                font-size: 1.55rem;
            }

            .community-summary dl {
                display: grid;
                gap: 0.9rem;
                margin: 0;
            }

            .community-summary dt {
                color: #6b7280;
                font-size: 0.82rem;
            }

            .community-summary dd {
                margin: 0.15rem 0 0;
                color: #111827;
                font-weight: 700;
            }

            .dashboard-grid {
                display: grid;
                grid-template-columns: repeat(4, minmax(0, 1fr));
                gap: 1rem;
            }

            .module-card {
                --card-accent: #4f7da3;
                min-height: 15rem;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 1rem;
                padding: 1.25rem;
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
                width: 3.25rem;
                height: 3.25rem;
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
                font-size: 1.28rem;
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

                .dashboard-grid {
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                }
            }

            @media (max-width: 767px) {
                .dashboard-stage {
                    min-height: calc(100vh - 4rem);
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
                    min-height: 10.75rem;
                    gap: 0.75rem;
                }
            }
        `
    ]
})
export class Dashboard {
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly comunitaAttiva = COMUNITA_ATTIVA_MOCK;

    get isDemo() {
        const url = this.router.url.split('?')[0].split('#')[0];
        return this.route.snapshot.data['demo'] === true || url === '/demo' || url.startsWith('/demo/');
    }

    get basePath() {
        return this.isDemo ? '/demo' : '/gestionale-cn';
    }

    get nomeComunita() {
        return this.isDemo ? DEMO_COMUNITA.nome : generaNomeComunita(this.comunitaAttiva.numero);
    }

    get parrocchia() {
        return this.isDemo ? DEMO_COMUNITA.parrocchia : (PARROCCHIE_MOCK.find((parrocchia) => parrocchia.id === this.comunitaAttiva.parrocchiaId)?.nome ?? '-');
    }

    get settore() {
        return this.isDemo ? DEMO_COMUNITA.settore.replace(/^Settore\s+/i, '') : (SETTORI_MOCK.find((settore) => settore.id === this.comunitaAttiva.settoreId)?.nome ?? '-');
    }

    get diocesi() {
        return this.isDemo ? DEMO_COMUNITA.diocesi : (DIOCESI_MOCK.find((diocesi) => diocesi.id === this.comunitaAttiva.diocesiId)?.nome ?? '-');
    }

    get tappaCammino() {
        return this.isDemo ? DEMO_COMUNITA.tappaCammino : this.comunitaAttiva.tappaCammino;
    }

    get membriCount() {
        return this.isDemo ? DEMO_MEMBRI.length : 42;
    }

    get convivenzeCount() {
        return this.isDemo ? DEMO_CONVIVENZE.length : 2;
    }

    get postiCount() {
        return this.isDemo ? DEMO_POSTI.length : 5;
    }

    get modules(): DashboardModule[] {
        return [
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
                title: 'Posti di Convivenza',
                icon: 'pi-building',
                status: 'In sviluppo',
                route: `${this.basePath}/posti-convivenza`,
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
    }
}
