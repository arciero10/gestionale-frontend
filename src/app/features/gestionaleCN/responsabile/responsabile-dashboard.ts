import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { getCurrentCommunity } from '../data/community-selection.storage';

type ResponsibleActionTone = 'community' | 'members' | 'convivenze' | 'structures' | 'travel' | 'permissions';

type ResponsibleAction = {
    title: string;
    description: string;
    icon: string;
    route: string;
    tone: ResponsibleActionTone;
    cta: string;
};

@Component({
    selector: 'app-responsabile-dashboard',
    standalone: true,
    imports: [CommonModule, RouterLink, ButtonModule],
    template: `
        <section class="responsabile-dashboard">
            <header class="responsabile-hero">
                <div>
                    <span class="hero-eyebrow">Area Responsabile</span>
                    <h1>Dashboard responsabile</h1>
                    <p>{{ community.nomeComunita }} - {{ community.parrocchiaNome }}</p>
                </div>
                <a pButton routerLink="/gestionale-cn/censimento-comunita" label="Nuovo membro" icon="pi pi-user-plus"></a>
            </header>

            <section class="action-grid" aria-label="Funzioni responsabile">
                @for (action of actions; track action.title) {
                    <a [routerLink]="action.route" class="action-card" [class]="'action-card tone-' + action.tone">
                        <span class="action-icon">
                            <i [class]="action.icon"></i>
                        </span>
                        <h2>{{ action.title }}</h2>
                        <p>{{ action.description }}</p>
                        <span class="action-cta">{{ action.cta }}</span>
                    </a>
                }
            </section>

            <section class="approval-panel">
                <div>
                    <span class="panel-eyebrow">Operatività comunità</span>
                    <h2>Richieste da approvare</h2>
                    <p>Convivenze, inviti e permessi assegnati resteranno qui quando arriveranno dal backend.</p>
                </div>
                <span class="approval-state">Nessuna richiesta in attesa</span>
            </section>
        </section>
    `,
    styles: [
        `
            :host {
                display: block;
                width: 100%;
            }

            .responsabile-dashboard {
                width: 100%;
                max-width: 1180px;
                margin: 0 auto;
                padding: clamp(0.75rem, 1.8vw, 1.25rem);
                display: grid;
                gap: clamp(1rem, 2vw, 1.35rem);
            }

            .responsabile-hero,
            .action-card,
            .approval-panel {
                border: 1px solid rgba(255, 255, 255, 0.72);
                border-radius: 16px;
                background: rgba(255, 252, 245, 0.94);
                box-shadow: 0 16px 34px rgba(31, 41, 55, 0.16);
                backdrop-filter: blur(10px);
            }

            .responsabile-hero {
                min-height: 116px;
                padding: 1.15rem 1.25rem;
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 1rem;
            }

            .hero-eyebrow,
            .panel-eyebrow {
                display: block;
                color: #476078;
                font-size: 0.78rem;
                font-weight: 900;
                text-transform: uppercase;
                letter-spacing: 0.02em;
            }

            h1,
            h2 {
                margin: 0.2rem 0 0.35rem;
                color: #111827;
                line-height: 1.15;
            }

            h1 {
                font-size: clamp(1.55rem, 2.4vw, 2.1rem);
            }

            h2 {
                font-size: 1.12rem;
            }

            p {
                margin: 0;
                color: #334155;
                line-height: 1.45;
                font-weight: 700;
            }

            .action-grid {
                display: grid;
                grid-template-columns: repeat(3, minmax(0, 1fr));
                gap: 1rem;
            }

            .action-card {
                --card-accent: #547fa3;
                min-height: 190px;
                padding: 1.1rem;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 0.75rem;
                color: #1f2937;
                text-align: center;
                text-decoration: none;
                border-top: 4px solid var(--card-accent);
                transition:
                    transform 180ms ease,
                    box-shadow 180ms ease,
                    border-color 180ms ease;
            }

            .action-card:hover {
                transform: translateY(-4px);
                box-shadow: 0 22px 42px rgba(31, 41, 55, 0.22);
                border-color: rgba(255, 255, 255, 0.95);
            }

            .action-icon {
                width: 3rem;
                height: 3rem;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                border-radius: 14px;
                color: var(--card-accent);
                background: color-mix(in srgb, var(--card-accent), transparent 90%);
            }

            .action-icon i {
                font-size: 1.45rem;
            }

            .action-card p {
                min-height: 2.6rem;
                font-size: 0.95rem;
            }

            .action-cta {
                min-height: 44px;
                width: 100%;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                margin-top: auto;
                border-radius: 10px;
                background: var(--card-accent);
                color: #fff;
                font-weight: 850;
            }

            .tone-community,
            .tone-members {
                --card-accent: #547fa3;
            }

            .tone-convivenze {
                --card-accent: #2f867c;
            }

            .tone-structures {
                --card-accent: #b86f35;
            }

            .tone-travel {
                --card-accent: #8a3f4c;
            }

            .tone-permissions {
                --card-accent: #4f46e5;
            }

            .approval-panel {
                padding: 1rem 1.15rem;
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 1rem;
            }

            .approval-state {
                display: inline-flex;
                align-items: center;
                min-height: 2.35rem;
                padding: 0.45rem 0.75rem;
                border-radius: 999px;
                background: #ecfdf5;
                color: #166534;
                font-weight: 850;
                white-space: nowrap;
            }

            @media (max-width: 1024px) {
                .action-grid {
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                }
            }

            @media (max-width: 700px) {
                .responsabile-hero,
                .approval-panel {
                    align-items: stretch;
                    flex-direction: column;
                }

                .action-grid {
                    grid-template-columns: 1fr;
                }

                .action-card {
                    min-height: 168px;
                }
            }
        `
    ]
})
export class ResponsabileDashboard {
    readonly community = getCurrentCommunity();
    readonly actions: ResponsibleAction[] = [
        {
            title: 'La tua Comunità',
            description: 'Apri la scheda della comunità attiva.',
            icon: 'pi pi-home',
            route: '/gestionale-cn/comunita',
            tone: 'community',
            cta: 'Apri'
        },
        {
            title: 'Membri comunità',
            description: 'Gestisci censimento, inviti e anagrafica.',
            icon: 'pi pi-users',
            route: '/gestionale-cn/comunita',
            tone: 'members',
            cta: 'Gestisci'
        },
        {
            title: 'Convivenze attive',
            description: 'Segui convivenze e organizzazione corrente.',
            icon: 'pi pi-calendar',
            route: '/gestionale-cn/convivenze',
            tone: 'convivenze',
            cta: 'Apri'
        },
        {
            title: 'Nuova convivenza',
            description: 'Crea una convivenza della tua comunità.',
            icon: 'pi pi-calendar-plus',
            route: '/gestionale-cn/convivenze',
            tone: 'convivenze',
            cta: 'Crea'
        },
        {
            title: 'Storico convivenze',
            description: 'Consulta le convivenze concluse automaticamente.',
            icon: 'pi pi-history',
            route: '/gestionale-cn/convivenze/storico',
            tone: 'convivenze',
            cta: 'Consulta'
        },
        {
            title: 'Posti di Convivenza',
            description: 'Cerca strutture e posti disponibili.',
            icon: 'pi pi-building',
            route: '/gestionale-cn/posti-convivenza',
            tone: 'structures',
            cta: 'Cerca'
        },
        {
            title: 'Richieste strutture',
            description: 'Prepara e monitora richieste disponibilità.',
            icon: 'pi pi-send',
            route: '/gestionale-cn/richieste-strutture',
            tone: 'structures',
            cta: 'Gestisci'
        },
        {
            title: 'Viaggi / Pellegrinaggi',
            description: 'Apri il modulo viaggi quando disponibile.',
            icon: 'pi pi-map',
            route: '/gestionale-cn/viaggi',
            tone: 'travel',
            cta: 'Apri'
        },
        {
            title: 'Permessi assegnati',
            description: 'Controlla autorizzazioni operative approvate.',
            icon: 'pi pi-shield',
            route: '/gestionale-cn/comunita',
            tone: 'permissions',
            cta: 'Verifica'
        }
    ];
}
