import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { canPerformAction, getUserAccessContext } from '../data/access-policy.mock';
import { getCurrentCommunity } from '../data/community-selection.storage';

type ModuleTone = 'community' | 'convivenze' | 'posti' | 'viaggi' | 'catechista' | 'quiet';

interface DashboardModule {
    key: string;
    title: string;
    description: string;
    icon: string;
    route: string;
    tone: ModuleTone;
    cta: string;
    status?: string;
    imageUrl?: string;
    primary?: boolean;
}

@Component({
    selector: 'app-responsabile-dashboard',
    standalone: true,
    imports: [CommonModule, RouterLink, ButtonModule, TagModule],
    template: `
        <section class="responsabile-dashboard">
            <aside class="community-summary" aria-label="Comunità attiva">
                <div>
                    <span class="summary-eyebrow">Area Responsabile</span>
                    <h1>Dashboard responsabile</h1>
                    <p class="summary-parish">{{ communityLabel }}</p>
                    <p class="summary-text">Gestisci comunità, membri, convivenze e richieste struttura con gli strumenti abilitati per il tuo profilo.</p>
                </div>

                <dl>
                    <div>
                        <dt>Comunità</dt>
                        <dd>{{ community.nomeComunita }}</dd>
                    </div>
                    <div>
                        <dt>Parrocchia</dt>
                        <dd>{{ community.parrocchiaNome }}</dd>
                    </div>
                    <div>
                        <dt>Comunità figlie</dt>
                        <dd>{{ hasChildCommunities() ? userContext.childCommunityNames.length : 'Non presenti' }}</dd>
                    </div>
                    <div>
                        <dt>Area catechista</dt>
                        <dd>{{ canShowCatechistArea() ? 'Disponibile' : 'Non prevista' }}</dd>
                    </div>
                </dl>
            </aside>

            <section class="quick-actions" aria-label="Azioni principali">
                @if (canShowModule('nuova-convivenza')) {
                    <a pButton routerLink="/gestionale-cn/convivenze" label="Nuova convivenza" icon="pi pi-calendar-plus"></a>
                }
                @if (canShowModule('richieste-strutture')) {
                    <a pButton routerLink="/gestionale-cn/richieste-strutture/nuova" label="Nuova richiesta struttura" icon="pi pi-send" severity="secondary"></a>
                }
                <button pButton type="button" label="Invita struttura" icon="pi pi-building" outlined (click)="copyStructureInviteLink()"></button>
            </section>

            @if (inviteStructureFeedback) {
                <section class="invite-feedback">
                    <i class="pi pi-link"></i>
                    <span>{{ inviteStructureFeedback }}</span>
                    <code>{{ publicStructureInviteUrl }}</code>
                </section>
            }

            <section class="dashboard-grid" aria-label="Funzioni responsabile">
                @for (module of visibleModules; track module.key) {
                    <a [routerLink]="module.route" class="module-card" [class.primary-card]="module.primary" [ngClass]="'module-card-' + module.tone" [attr.aria-label]="module.title">
                        @if (module.imageUrl) {
                            <img class="module-image" [src]="module.imageUrl" [alt]="module.title" (error)="nascondiImmagineCard($event)" />
                        }
                        <div class="module-icon"><i class="pi" [ngClass]="module.icon"></i></div>
                        <h2>{{ module.title }}</h2>
                        <p>{{ module.description }}</p>
                        @if (module.status) {
                            <p-tag [value]="module.status"></p-tag>
                        }
                        <span class="module-button">{{ module.cta }}</span>
                    </a>
                }
            </section>

            <section class="approval-panel">
                <div>
                    <span class="summary-eyebrow">Operatività comunità</span>
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
                padding: clamp(.85rem, 2vw, 1.35rem);
                display: grid;
                gap: 1rem;
            }

            .community-summary,
            .module-card,
            .approval-panel,
            .invite-feedback {
                border: 1px solid rgba(255, 255, 255, .72);
                border-radius: 16px;
                background: rgba(255, 252, 245, .95);
                box-shadow: 0 16px 34px rgba(31, 41, 55, .16);
            }

            .community-summary {
                min-height: 126px;
                padding: 1.1rem 1.2rem;
                display: grid;
                grid-template-columns: minmax(16rem, 1fr) minmax(0, 1.4fr);
                gap: 1rem;
                align-items: center;
            }

            .summary-eyebrow {
                display: block;
                margin-bottom: .35rem;
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

            h1 { font-size: clamp(1.55rem, 2.4vw, 2.1rem); }
            h2 { font-size: 1.1rem; }

            p { color: #334155; line-height: 1.42; font-weight: 680; }

            .summary-parish { margin-top: .35rem; color: #0f172a; font-weight: 850; }
            .summary-text { margin-top: .45rem; max-width: 43rem; }

            .community-summary dl {
                display: grid;
                grid-template-columns: repeat(2, minmax(0, 1fr));
                gap: .65rem;
                margin: 0;
            }

            .community-summary dl div {
                min-height: 3.25rem;
                padding: .55rem .7rem;
                display: grid;
                align-content: center;
                border-radius: 12px;
                background: rgba(255, 255, 255, .7);
                border: 1px solid rgba(31, 41, 55, .08);
            }

            dt { color: #475569; font-size: .75rem; font-weight: 760; }
            dd { margin: .15rem 0 0; color: #0f172a; font-weight: 850; line-height: 1.18; }

            .quick-actions {
                display: grid;
                grid-template-columns: repeat(3, minmax(0, 1fr));
                gap: .75rem;
            }

            .quick-actions a[pButton],
            .quick-actions button[pButton] {
                justify-content: center;
                min-height: 46px;
            }

            .invite-feedback {
                display: flex;
                flex-wrap: wrap;
                gap: .55rem;
                align-items: center;
                padding: .75rem .95rem;
                color: #0f172a;
                background: rgba(236, 253, 245, .96);
                border-color: #bbf7d0;
                font-weight: 820;
            }

            .invite-feedback i { color: #15803d; }
            .invite-feedback code { color: #14532d; overflow-wrap: anywhere; }

            .dashboard-grid {
                display: grid;
                grid-template-columns: repeat(4, minmax(0, 1fr));
                gap: 1rem;
            }

            .module-card {
                --card-accent: #4f7da3;
                min-height: 214px;
                padding: 1rem;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: .65rem;
                color: #0f172a;
                text-align: center;
                text-decoration: none;
                border-top: 4px solid var(--card-accent);
                transition: transform 180ms ease, box-shadow 180ms ease;
            }

            .module-card:has(.module-image) {
                justify-content: flex-start;
                padding-top: .85rem;
            }

            .module-card:hover {
                transform: translateY(-4px);
                box-shadow: 0 22px 42px rgba(31, 41, 55, .22);
            }

            .module-image {
                width: 100%;
                height: clamp(90px, 8vw, 120px);
                object-fit: cover;
                border-radius: 12px;
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

            .module-icon .pi { font-size: 1.45rem; }
            .module-card h2 { font-size: 1.08rem; }
            .module-card p { min-height: 2.45rem; font-size: .9rem; }

            .module-button {
                min-height: 44px;
                width: 100%;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                margin-top: auto;
                border-radius: 10px;
                color: #fff;
                background: var(--card-accent);
                font-weight: 850;
            }

            .primary-card { box-shadow: 0 18px 38px rgba(47, 134, 124, .22); }

            :host ::ng-deep .module-card .p-tag {
                padding: .22rem .55rem;
                background: rgba(255, 255, 255, .78);
                color: #374151;
                border: 1px solid rgba(31, 41, 55, .1);
            }

            .module-card-community { --card-accent: #547fa3; }
            .module-card-convivenze { --card-accent: #2f867c; }
            .module-card-posti { --card-accent: #b86f35; }
            .module-card-viaggi { --card-accent: #8a3f4c; }
            .module-card-catechista { --card-accent: #4f46e5; }
            .module-card-quiet { --card-accent: #64748b; }

            .approval-panel {
                padding: 1rem 1.15rem;
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 1rem;
            }

            .approval-panel h2 { margin-bottom: .25rem; }

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

            @media (max-width: 1120px) {
                .community-summary,
                .quick-actions { grid-template-columns: 1fr; }

                .dashboard-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
            }

            @media (max-width: 720px) {
                .responsabile-dashboard { padding: .85rem; }
                .community-summary dl,
                .dashboard-grid { grid-template-columns: 1fr; }

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
    readonly userContext = getUserAccessContext();
    readonly publicStructureInvitePath = '/area-strutture';
    inviteStructureFeedback = '';

    readonly modules: DashboardModule[] = [
        {
            key: 'comunita',
            title: 'La mia comunità',
            description: 'Scheda, anagrafica e riferimenti della comunità.',
            icon: 'pi-users',
            route: '/gestionale-cn/comunita',
            tone: 'community',
            cta: 'Apri',
            status: 'Attivo'
        },
        {
            key: 'membri',
            title: 'Membri comunità',
            description: 'Censimento fratelli, inviti e consensi.',
            icon: 'pi-user-plus',
            route: '/gestionale-cn/membri-comunita',
            tone: 'community',
            cta: 'Gestisci',
            status: 'Attivo'
        },
        {
            key: 'convivenze',
            title: 'Convivenze',
            description: 'Programmazione corrente della comunità.',
            icon: 'pi-calendar',
            route: '/gestionale-cn/convivenze',
            tone: 'convivenze',
            cta: 'Entra',
            status: 'Attivo',
            imageUrl: 'assets/images/dashboard/convivenze.jpg'
        },
        {
            key: 'nuova-convivenza',
            title: 'Nuova convivenza',
            description: 'Avvia un nuovo flusso organizzativo.',
            icon: 'pi-calendar-plus',
            route: '/gestionale-cn/convivenze',
            tone: 'convivenze',
            cta: 'Crea',
            status: 'Attivo',
            primary: true
        },
        {
            key: 'storico-convivenze',
            title: 'Storico convivenze',
            description: 'Convivenze concluse e archiviate.',
            icon: 'pi-history',
            route: '/gestionale-cn/convivenze/storico',
            tone: 'convivenze',
            cta: 'Consulta',
            status: 'Attivo'
        },
        {
            key: 'posti-convivenza',
            title: 'Posti di Convivenza',
            description: 'Catalogo strutture approvate e posti disponibili.',
            icon: 'pi-building',
            route: '/gestionale-cn/posti-convivenza',
            tone: 'posti',
            cta: 'Vai al modulo',
            status: 'Attivo',
            imageUrl: 'assets/images/posti-convivenza/posti-convivenza-hero.jpg'
        },
        {
            key: 'richieste-strutture',
            title: 'Richieste strutture',
            description: 'Richieste disponibilità e preparazione comunicazioni.',
            icon: 'pi-send',
            route: '/gestionale-cn/richieste-strutture',
            tone: 'posti',
            cta: 'Apri',
            status: 'Attivo'
        },
        {
            key: 'viaggi',
            title: 'Viaggi / Pellegrinaggi',
            description: 'Modulo viaggi e pellegrinaggi.',
            icon: 'pi-map',
            route: '/gestionale-cn/viaggi',
            tone: 'viaggi',
            cta: 'Apri',
            status: 'Prossimamente'
        },
        {
            key: 'permessi',
            title: 'Permessi assegnati',
            description: 'Autorizzazioni operative già approvate.',
            icon: 'pi-shield',
            route: '/gestionale-cn/comunita',
            tone: 'quiet',
            cta: 'Consulta',
            status: 'Attivo'
        },
        {
            key: 'comunita-figlie',
            title: 'Comunità figlie',
            description: 'Comunità seguite nel contesto catechisti.',
            icon: 'pi-sitemap',
            route: '/gestionale-cn/catechista/comunita-figlie',
            tone: 'catechista',
            cta: 'Apri',
            status: 'Attivo'
        },
        {
            key: 'convivenze-catechistiche',
            title: 'Convivenze catechistiche',
            description: 'Convivenze organizzate dall’equipe per comunità figlie.',
            icon: 'pi-calendar-plus',
            route: '/gestionale-cn/catechista/convivenze',
            tone: 'catechista',
            cta: 'Apri',
            status: 'Attivo'
        }
    ];

    get communityLabel(): string {
        return `${this.community.nomeComunita} - ${this.community.parrocchiaNome}`;
    }

    get publicStructureInviteUrl(): string {
        return `${window.location.origin}${this.publicStructureInvitePath}`;
    }

    get visibleModules(): DashboardModule[] {
        return this.modules.filter((module) => this.canShowModule(module.key));
    }

    hasChildCommunities(): boolean {
        return this.userContext.childCommunityIds.length > 0;
    }

    canManageChildCommunities(): boolean {
        return this.hasChildCommunities() && this.userContext.isCatechista;
    }

    canShowCatechistArea(): boolean {
        return this.canManageChildCommunities();
    }

    canInviteMembers(): boolean {
        return canPerformAction('aggiungi-membro', this.userContext);
    }

    canShowModule(moduleKey: string): boolean {
        switch (moduleKey) {
            case 'membri':
            case 'permessi':
                return this.canInviteMembers();
            case 'nuova-convivenza':
                return canPerformAction('nuova-convivenza', this.userContext);
            case 'richieste-strutture':
                return canPerformAction('invia-richiesta-struttura', this.userContext);
            case 'comunita-figlie':
            case 'convivenze-catechistiche':
                return this.canShowCatechistArea();
            default:
                return true;
        }
    }

    copyStructureInviteLink(): void {
        void navigator.clipboard?.writeText(this.publicStructureInviteUrl);
        this.inviteStructureFeedback = 'Invia questo link alla struttura per accreditarsi';
        window.setTimeout(() => (this.inviteStructureFeedback = ''), 4500);
    }

    nascondiImmagineCard(event: Event): void {
        const image = event.target instanceof HTMLImageElement ? event.target : null;
        if (image) {
            image.style.display = 'none';
        }
    }
}
