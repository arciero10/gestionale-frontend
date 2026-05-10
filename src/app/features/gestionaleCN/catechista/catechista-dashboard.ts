import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';

@Component({
    selector: 'app-catechista-dashboard',
    standalone: true,
    imports: [CommonModule, RouterLink, ButtonModule],
    template: `
        <section class="catechista-page">
            <header class="page-head">
                <span>Area Catechista</span>
                <h1>Area Catechista</h1>
                <p>Gestisci equipe, comunità figlie e convivenze catechistiche nel contesto assegnato.</p>
            </header>

            <section class="workspace-card">
                <div>
                    <h2>Convivenze con comunità figlie</h2>
                    <p>Le convivenze catechistiche restano organizzate dall'equipe dei catechisti e collegate alla comunità destinataria.</p>
                </div>
                <a pButton routerLink="/gestionale-cn/convivenze" label="Apri convivenze" icon="pi pi-calendar" iconPos="left"></a>
            </section>

            <section class="workspace-card">
                <div>
                    <h2>Comunità figlie</h2>
                    <p>Consulta le comunità figlie associate alla tua equipe senza assumere il ruolo di responsabile della comunità destinataria.</p>
                </div>
                <a pButton routerLink="/gestionale-cn/comunita" label="Apri comunità" icon="pi pi-users" iconPos="left" outlined></a>
            </section>
        </section>
    `,
    styles: [
        `
            .catechista-page {
                display: grid;
                gap: 1.25rem;
            }

            .page-head,
            .workspace-card {
                border: 1px solid rgba(255, 255, 255, .42);
                border-radius: 16px;
                background: rgba(255, 255, 255, .94);
                box-shadow: 0 16px 40px rgba(15, 23, 42, .14);
                backdrop-filter: blur(10px);
            }

            .page-head,
            .workspace-card {
                padding: 1.15rem;
            }

            .page-head span {
                color: #475569;
                font-size: .82rem;
                font-weight: 850;
                text-transform: uppercase;
            }

            h1,
            h2 {
                margin: .2rem 0 .35rem;
                color: #0f172a;
            }

            p {
                margin: 0;
                color: #475569;
                line-height: 1.5;
            }

            .workspace-card {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 1rem;
            }

            a[pButton] {
                min-height: 44px;
                white-space: nowrap;
            }

            @media (max-width: 720px) {
                .workspace-card {
                    flex-direction: column;
                    align-items: stretch;
                }
            }
        `
    ]
})
export class CatechistaDashboard {}
