import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TagModule } from 'primeng/tag';

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
                <aside class="community-summary" aria-label="Dati comunità">
                    <span class="summary-eyebrow">Comunità attiva</span>
                    <h1>3ª Comunità</h1>
                    <dl>
                        <div>
                            <dt>Parrocchia</dt>
                            <dd>San Giovanni Battista</dd>
                        </div>
                        <div>
                            <dt>Settore</dt>
                            <dd>Roma Sud</dd>
                        </div>
                        <div>
                            <dt>Membri</dt>
                            <dd>42</dd>
                        </div>
                        <div>
                            <dt>Convivenze in programma</dt>
                            <dd>2</dd>
                        </div>
                        <div>
                            <dt>Posti censiti</dt>
                            <dd>5</dd>
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
    modules: DashboardModule[] = [
        {
            title: 'La tua Comunità',
            icon: 'pi-users',
            status: 'Attivo',
            route: '/gestionale-cn/comunita',
            tone: 'community',
            cta: 'Apri'
        },
        {
            title: 'Convivenze',
            icon: 'pi-calendar',
            status: 'In sviluppo',
            route: '/gestionale-cn/convivenze',
            tone: 'convivenze',
            cta: 'Entra'
        },
        {
            title: 'Posti di Convivenza',
            icon: 'pi-building',
            status: 'In sviluppo',
            route: '/gestionale-cn/posti-convivenza',
            tone: 'posti',
            cta: 'Vai al modulo'
        },
        {
            title: 'Viaggi / Pellegrinaggi',
            icon: 'pi-send',
            status: 'Prossimamente',
            route: '/gestionale-cn/viaggi',
            tone: 'viaggi',
            cta: 'Apri'
        }
    ];
}
