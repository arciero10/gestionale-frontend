import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';

type AdminCard = {
    title: string;
    description: string;
    icon: string;
    route?: string;
    active: boolean;
};

@Component({
    selector: 'app-admin-dashboard',
    standalone: true,
    imports: [CommonModule, RouterLink, ButtonModule, TagModule],
    template: `
        <section class="admin-page">
            <header class="page-head">
                <div>
                    <span>Global Admin</span>
                    <h1>Admin piattaforma</h1>
                    <p>Area mock per il governo centrale della piattaforma Eventi di Comunità.</p>
                </div>
            </header>

            <section class="admin-grid">
                @for (card of cards; track card.title) {
                    <article class="admin-card" [class.disabled]="!card.active">
                        <div class="icon-box"><i [class]="card.icon"></i></div>
                        <div>
                            <h2>{{ card.title }}</h2>
                            <p>{{ card.description }}</p>
                        </div>
                        @if (card.active && card.route) {
                            <a pButton [routerLink]="card.route" label="Apri" icon="pi pi-arrow-right" iconPos="right"></a>
                        } @else {
                            <p-tag value="Prossimamente" severity="secondary"></p-tag>
                        }
                    </article>
                }
            </section>
        </section>
    `,
    styles: [
        `
            .admin-page { display: grid; gap: 1.25rem; }
            .page-head,
            .admin-card {
                border: 1px solid rgba(255,255,255,.35);
                border-radius: 16px;
                background: rgba(255,255,255,.88);
                box-shadow: 0 16px 40px rgba(15,23,42,.14);
                backdrop-filter: blur(10px);
            }
            .page-head { padding: 1.15rem; }
            .page-head span { color: #64748b; font-size: .82rem; font-weight: 850; text-transform: uppercase; }
            h1,
            h2 { margin: .2rem 0 .35rem; color: #111827; }
            p { margin: 0; color: #64748b; line-height: 1.55; }
            .admin-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 1rem; }
            .admin-card { display: grid; gap: 1rem; align-content: space-between; min-height: 220px; padding: 1rem; }
            .admin-card.disabled { opacity: .78; }
            .icon-box {
                width: 3rem;
                height: 3rem;
                display: grid;
                place-items: center;
                border-radius: 14px;
                color: #fff;
                background: #0f3558;
                box-shadow: 0 12px 28px rgba(15,53,88,.18);
            }
            .icon-box i { font-size: 1.3rem; }
            a[pButton] { min-height: 44px; justify-content: center; }
            @media (max-width: 1180px) {
                .admin-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
            }
            @media (max-width: 720px) {
                .admin-grid { grid-template-columns: 1fr; }
            }
        `
    ]
})
export class AdminDashboard {
    readonly cards: AdminCard[] = [
        {
            title: 'Strutture',
            description: 'Segnalazioni, inviti censimento e pubblicazione delle strutture.',
            icon: 'pi pi-building',
            route: '/gestionale-cn/admin/strutture',
            active: true
        },
        {
            title: 'Comunità',
            description: 'Governance e verifica delle comunità censite.',
            icon: 'pi pi-users',
            active: false
        },
        {
            title: 'Utenti e ruoli',
            description: 'Gestione ruoli globali e abilitazioni piattaforma.',
            icon: 'pi pi-id-card',
            active: false
        },
        {
            title: 'Segnalazioni',
            description: 'Coda generale delle segnalazioni operative.',
            icon: 'pi pi-inbox',
            active: false
        }
    ];
}
