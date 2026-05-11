import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { getCurrentCommunity } from '../data/community-selection.storage';

type ResponsibleAction = {
    title: string;
    description: string;
    icon: string;
    route: string;
    primary?: boolean;
};

@Component({
    selector: 'app-responsabile-dashboard',
    standalone: true,
    imports: [CommonModule, RouterLink, ButtonModule],
    template: `
        <section class="responsabile-dashboard">
            <aside class="responsabile-rail">
                <span>Area Responsabile</span>
                <h1>{{ community.nomeComunita }}</h1>
                <p>{{ community.parrocchiaNome }}</p>
                <a pButton routerLink="/gestionale-cn/comunita" label="Membri comunità" icon="pi pi-users" outlined></a>
                <a pButton routerLink="/gestionale-cn/convivenze" label="Nuova convivenza" icon="pi pi-calendar-plus"></a>
                <a pButton routerLink="/gestionale-cn/censimento-comunita" label="Nuovo membro" icon="pi pi-user-plus" outlined></a>
            </aside>

            <main class="responsabile-main">
                <header class="dashboard-head">
                    <div>
                        <span>Gestione comunità</span>
                        <h2>Dashboard responsabile</h2>
                    </div>
                    <a routerLink="/gestionale-cn/convivenze/storico">Storico convivenze</a>
                </header>

                <section class="action-grid">
                    @for (action of actions; track action.title) {
                        <a [routerLink]="action.route" class="action-card" [class.primary]="action.primary">
                            <i [class]="action.icon"></i>
                            <div>
                                <h3>{{ action.title }}</h3>
                                <p>{{ action.description }}</p>
                            </div>
                        </a>
                    }
                </section>

                <section class="approval-panel">
                    <div>
                        <h3>Richieste da approvare</h3>
                        <p>Convivenze, inviti e permessi assegnati restano in questa sezione quando arriveranno dal backend.</p>
                    </div>
                    <span>Nessuna richiesta in attesa</span>
                </section>
            </main>
        </section>
    `,
    styles: [
        `
            .responsabile-dashboard {
                display: grid;
                grid-template-columns: minmax(15rem, 18rem) minmax(0, 1fr);
                gap: 1rem;
                max-width: 1180px;
                margin: 0 auto;
            }

            .responsabile-rail,
            .dashboard-head,
            .action-card,
            .approval-panel {
                border: 1px solid rgba(255, 255, 255, .46);
                border-radius: 16px;
                background: rgba(255, 255, 255, .96);
                box-shadow: 0 16px 36px rgba(15, 23, 42, .14);
                backdrop-filter: blur(10px);
            }

            .responsabile-rail {
                display: grid;
                gap: .75rem;
                align-content: start;
                padding: 1rem;
                position: sticky;
                top: 1rem;
            }

            .responsabile-main {
                display: grid;
                gap: 1rem;
            }

            .dashboard-head,
            .approval-panel {
                padding: 1rem;
                display: flex;
                justify-content: space-between;
                gap: 1rem;
                align-items: center;
            }

            .responsabile-rail span,
            .dashboard-head span {
                color: #334155;
                font-size: .78rem;
                font-weight: 900;
                text-transform: uppercase;
            }

            h1,
            h2,
            h3 {
                margin: .15rem 0 .25rem;
                color: #0f172a;
            }

            p {
                margin: 0;
                color: #334155;
                line-height: 1.45;
                font-weight: 650;
            }

            .action-grid {
                display: grid;
                grid-template-columns: repeat(2, minmax(0, 1fr));
                gap: .85rem;
            }

            .action-card {
                min-height: 112px;
                display: grid;
                grid-template-columns: 2.4rem minmax(0, 1fr);
                gap: .75rem;
                align-items: start;
                padding: .9rem;
                text-decoration: none;
            }

            .action-card i {
                width: 2.4rem;
                height: 2.4rem;
                display: grid;
                place-items: center;
                border-radius: 12px;
                color: #fff;
                background: #0f3558;
            }

            .action-card.primary {
                border-color: rgba(47, 134, 124, .45);
            }

            .approval-panel span {
                display: inline-flex;
                padding: .45rem .7rem;
                border-radius: 999px;
                background: #ecfdf5;
                color: #166534;
                font-weight: 850;
                white-space: nowrap;
            }

            a[pButton] {
                min-height: 40px;
                justify-content: center;
            }

            @media (max-width: 900px) {
                .responsabile-dashboard {
                    grid-template-columns: 1fr;
                }

                .responsabile-rail {
                    position: static;
                }
            }

            @media (max-width: 640px) {
                .action-grid {
                    grid-template-columns: 1fr;
                }

                .dashboard-head,
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
    readonly actions: ResponsibleAction[] = [
        {
            title: 'Convivenze attive',
            description: 'Programma e segui le convivenze della comunità.',
            icon: 'pi pi-calendar',
            route: '/gestionale-cn/convivenze',
            primary: true
        },
        {
            title: 'Storico convivenze',
            description: 'Consulta le convivenze concluse automaticamente.',
            icon: 'pi pi-history',
            route: '/gestionale-cn/convivenze/storico'
        },
        {
            title: 'Membri comunità',
            description: 'Gestisci censimento, inviti e anagrafica.',
            icon: 'pi pi-users',
            route: '/gestionale-cn/comunita'
        },
        {
            title: 'Permessi assegnati',
            description: 'Controlla autorizzazioni operative già approvate.',
            icon: 'pi pi-shield',
            route: '/gestionale-cn/comunita'
        }
    ];
}
