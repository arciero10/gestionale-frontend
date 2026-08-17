import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { getCurrentCommunity } from '../data/community-selection.storage';

type FlowTone = 'community' | 'convivenze' | 'structures' | 'travel' | 'quiet';

type FlowItem = {
    title: string;
    description: string;
    icon: string;
    route: string;
    primary?: boolean;
};

type FlowSection = {
    title: string;
    description: string;
    icon: string;
    tone: FlowTone;
    items: FlowItem[];
};

@Component({
    selector: 'app-responsabile-dashboard',
    standalone: true,
    imports: [CommonModule, RouterLink, ButtonModule],
    template: `
        <section class="responsabile-dashboard">
            <header class="responsabile-hero">
                <div class="hero-copy">
                    <span class="eyebrow">Area Responsabile</span>
                    <h1>Dashboard responsabile</h1>
                    <p class="community-name">{{ community.nomeComunita }} - {{ community.parrocchiaNome }}</p>
                    <p class="hero-text">Gestisci comunità, convivenze e richieste alle strutture da un'unica base operativa.</p>
                </div>

                <div class="hero-actions" aria-label="Azioni principali responsabile">
                    <a pButton routerLink="/gestionale-cn/convivenze" label="Nuova convivenza" icon="pi pi-calendar-plus"></a>
                    <a pButton routerLink="/gestionale-cn/richieste-strutture/nuova" label="Nuova richiesta struttura" icon="pi pi-send" severity="secondary"></a>
                    <button pButton type="button" label="Invita struttura" icon="pi pi-building" outlined (click)="copyStructureInviteLink()"></button>
                </div>
            </header>

            @if (inviteStructureFeedback) {
                <section class="invite-feedback">
                    <i class="pi pi-link"></i>
                    <span>{{ inviteStructureFeedback }}</span>
                    <code>{{ publicStructureInviteUrl }}</code>
                </section>
            }

            <section class="flow-grid" aria-label="Macro aree operative">
                @for (section of sections; track section.title) {
                    <article class="flow-panel" [class]="'flow-panel tone-' + section.tone">
                        <header class="flow-head">
                            <span class="flow-icon"><i [class]="section.icon"></i></span>
                            <div>
                                <h2>{{ section.title }}</h2>
                                <p>{{ section.description }}</p>
                            </div>
                        </header>

                        <div class="flow-list">
                            @for (item of section.items; track item.title) {
                                <a [routerLink]="item.route" class="flow-item" [class.primary-item]="item.primary">
                                    <span><i [class]="item.icon"></i></span>
                                    <div>
                                        <strong>{{ item.title }}</strong>
                                        <small>{{ item.description }}</small>
                                    </div>
                                    <i class="pi pi-arrow-right"></i>
                                </a>
                            }
                        </div>
                    </article>
                }
            </section>

            <section class="approval-panel">
                <div>
                    <span class="eyebrow">Operatività comunità</span>
                    <h2>Richieste da approvare</h2>
                    <p>Nessuna convivenza, invito o permesso operativo richiede approvazione in questo momento.</p>
                </div>
                <span class="approval-state">Nessuna richiesta in attesa</span>
            </section>
        </section>
    `,
    styles: [
        `
            :host { display: block; width: 100%; }

            .responsabile-dashboard {
                max-width: 1180px;
                margin: 0 auto;
                padding: clamp(.75rem, 1.8vw, 1.25rem);
                display: grid;
                gap: 1rem;
            }

            .responsabile-hero,
            .flow-panel,
            .approval-panel {
                border: 1px solid rgba(255, 255, 255, .72);
                border-radius: 16px;
                background: rgba(255, 252, 245, .95);
                box-shadow: 0 16px 34px rgba(31, 41, 55, .16);
                backdrop-filter: blur(10px);
            }

            .responsabile-hero {
                padding: 1.25rem;
                display: grid;
                grid-template-columns: minmax(0, 1fr) auto;
                gap: 1rem;
                align-items: center;
            }

            .eyebrow {
                display: block;
                color: #476078;
                font-size: .78rem;
                font-weight: 900;
                text-transform: uppercase;
                letter-spacing: .02em;
            }

            h1,
            h2,
            p { margin: 0; }

            h1,
            h2 { color: #111827; line-height: 1.15; }

            h1 { margin-top: .25rem; font-size: clamp(1.55rem, 2.4vw, 2.1rem); }
            h2 { font-size: 1.1rem; }

            p,
            small { color: #334155; line-height: 1.42; font-weight: 680; }

            .community-name { margin-top: .35rem; font-weight: 850; }
            .hero-text { margin-top: .45rem; max-width: 42rem; }

            .hero-actions {
                display: grid;
                gap: .55rem;
                min-width: min(100%, 17rem);
            }

            .hero-actions a[pButton],
            .hero-actions button[pButton] { justify-content: center; min-height: 42px; }

            .invite-feedback {
                display: flex;
                flex-wrap: wrap;
                gap: .55rem;
                align-items: center;
                padding: .75rem .95rem;
                border-radius: 14px;
                color: #0f172a;
                background: rgba(236, 253, 245, .96);
                border: 1px solid #bbf7d0;
                font-weight: 820;
            }

            .invite-feedback i { color: #15803d; }
            .invite-feedback code { color: #14532d; overflow-wrap: anywhere; }

            .flow-grid {
                display: grid;
                grid-template-columns: repeat(3, minmax(0, 1fr));
                gap: 1rem;
            }

            .flow-panel {
                --accent: #547fa3;
                padding: 1rem;
                border-top: 4px solid var(--accent);
            }

            .flow-head {
                display: grid;
                grid-template-columns: 2.75rem minmax(0, 1fr);
                gap: .75rem;
                align-items: start;
                margin-bottom: .9rem;
            }

            .flow-icon,
            .flow-item > span {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                border-radius: 14px;
                color: var(--accent);
                background: color-mix(in srgb, var(--accent), transparent 90%);
            }

            .flow-icon { width: 2.75rem; height: 2.75rem; }
            .flow-icon i { font-size: 1.25rem; }

            .flow-list { display: grid; gap: .6rem; }

            .flow-item {
                display: grid;
                grid-template-columns: 2.35rem minmax(0, 1fr) auto;
                gap: .65rem;
                align-items: center;
                min-height: 4.15rem;
                padding: .7rem;
                border-radius: 13px;
                color: #0f172a;
                text-decoration: none;
                background: rgba(255, 255, 255, .72);
                border: 1px solid rgba(31, 41, 55, .08);
                transition: transform 160ms ease, box-shadow 160ms ease;
            }

            .flow-item:hover {
                transform: translateY(-2px);
                box-shadow: 0 12px 24px rgba(15, 23, 42, .14);
            }

            .flow-item > span { width: 2.35rem; height: 2.35rem; border-radius: 12px; }
            .flow-item strong { display: block; color: #0f172a; }
            .flow-item small { display: block; margin-top: .12rem; font-size: .82rem; }
            .flow-item > .pi { color: #64748b; }

            .primary-item {
                color: #fff;
                background: var(--accent);
                border-color: var(--accent);
            }

            .primary-item strong,
            .primary-item small,
            .primary-item > .pi { color: #fff; }

            .primary-item > span {
                color: #fff;
                background: rgba(255, 255, 255, .18);
            }

            .tone-community { --accent: #547fa3; }
            .tone-convivenze { --accent: #2f867c; }
            .tone-structures { --accent: #b86f35; }
            .tone-travel { --accent: #8a3f4c; }
            .tone-quiet { --accent: #4f46e5; }

            .approval-panel {
                padding: 1rem 1.15rem;
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 1rem;
            }

            .approval-panel h2 { margin: .2rem 0 .25rem; }

            .approval-state {
                display: inline-flex;
                align-items: center;
                min-height: 2.35rem;
                padding: .45rem .75rem;
                border-radius: 999px;
                color: #166534;
                background: #ecfdf5;
                font-weight: 850;
                white-space: nowrap;
            }

            @media (max-width: 1100px) {
                .responsabile-hero,
                .flow-grid { grid-template-columns: 1fr; }

                .hero-actions {
                    grid-template-columns: repeat(3, minmax(0, 1fr));
                }
            }

            @media (max-width: 720px) {
                .hero-actions { grid-template-columns: 1fr; }

                .approval-panel {
                    align-items: stretch;
                    flex-direction: column;
                }
            }
        `
    ]
})
export class ResponsabileDashboard {
    readonly community = getCurrentCommunity();
    readonly publicStructureInvitePath = '/area-strutture';
    inviteStructureFeedback = '';

    get publicStructureInviteUrl(): string {
        return `${window.location.origin}${this.publicStructureInvitePath}`;
    }

    copyStructureInviteLink(): void {
        void navigator.clipboard?.writeText(this.publicStructureInviteUrl);
        this.inviteStructureFeedback = 'Invia questo link alla struttura per accreditarsi';
        window.setTimeout(() => (this.inviteStructureFeedback = ''), 4500);
    }

    readonly sections: FlowSection[] = [
        {
            title: 'Comunità',
            description: 'Anagrafica, membri e autorizzazioni operative.',
            icon: 'pi pi-users',
            tone: 'community',
            items: [
                {
                    title: 'La tua Comunità',
                    description: 'Scheda e dati della comunità',
                    icon: 'pi pi-home',
                    route: '/gestionale-cn/comunita'
                },
                {
                    title: 'Membri comunità / Censimento fratelli',
                    description: 'Censimento, inviti e anagrafica',
                    icon: 'pi pi-user-plus',
                    route: '/gestionale-cn/membri-comunita'
                },
                {
                    title: 'Permessi assegnati',
                    description: 'Autorizzazioni già approvate',
                    icon: 'pi pi-shield',
                    route: '/gestionale-cn/comunita'
                }
            ]
        },
        {
            title: 'Convivenze',
            description: 'Pianificazione, convivenze attive e storico.',
            icon: 'pi pi-calendar',
            tone: 'convivenze',
            items: [
                {
                    title: 'Convivenze attive',
                    description: 'Programmazione corrente',
                    icon: 'pi pi-calendar',
                    route: '/gestionale-cn/convivenze'
                },
                {
                    title: 'Nuova convivenza',
                    description: 'Avvia un nuovo flusso operativo',
                    icon: 'pi pi-calendar-plus',
                    route: '/gestionale-cn/convivenze',
                    primary: true
                },
                {
                    title: 'Storico convivenze',
                    description: 'Convivenze concluse e archiviate',
                    icon: 'pi pi-history',
                    route: '/gestionale-cn/convivenze/storico'
                }
            ]
        },
        {
            title: 'Strutture e viaggi',
            description: 'Posti, richieste disponibilità e pellegrinaggi.',
            icon: 'pi pi-building',
            tone: 'structures',
            items: [
                {
                    title: 'Posti di Convivenza',
                    description: 'Catalogo strutture approvate',
                    icon: 'pi pi-building',
                    route: '/gestionale-cn/posti-convivenza'
                },
                {
                    title: 'Richieste strutture',
                    description: 'Richieste e risposte dalle strutture',
                    icon: 'pi pi-send',
                    route: '/gestionale-cn/richieste-strutture'
                },
                {
                    title: 'Viaggi / Pellegrinaggi',
                    description: 'Modulo viaggi e pellegrinaggi',
                    icon: 'pi pi-map',
                    route: '/gestionale-cn/viaggi'
                }
            ]
        }
    ];
}
