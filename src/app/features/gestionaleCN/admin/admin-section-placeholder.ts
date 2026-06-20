import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';

@Component({
    selector: 'app-admin-section-placeholder',
    standalone: true,
    imports: [CommonModule, RouterLink, ButtonModule, TagModule],
    template: `
        <section class="admin-section-page">
            <header>
                <div>
                    <span>Amministrazione globale</span>
                    <h1>{{ title }}</h1>
                    <p>{{ description }}</p>
                </div>
                <p-tag value="GLOBAL_ADMIN" severity="contrast"></p-tag>
            </header>

            <article>
                <h2>Sezione pronta per la gestione centralizzata</h2>
                <p>
                    La route è attiva e protetta dal controllo Global Admin. I dati operativi saranno collegati
                    ai servizi reali quando il backend sarà disponibile.
                </p>
                <a pButton routerLink="/gestionale-cn/admin/dashboard" label="Torna alla dashboard admin" icon="pi pi-arrow-left" outlined></a>
            </article>
        </section>
    `,
    styles: [
        `
            .admin-section-page { display: grid; gap: 1.25rem; color: #0f172a; }
            header,
            article {
                border: 1px solid rgba(226,232,240,.9);
                border-radius: 16px;
                background: rgba(255,255,255,.96);
                box-shadow: 0 16px 40px rgba(15,23,42,.12);
                padding: 1.25rem;
            }
            header { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; }
            header span { color: #1d4ed8; font-size: .78rem; font-weight: 900; text-transform: uppercase; letter-spacing: .04em; }
            h1,
            h2 { margin: .15rem 0 .35rem; color: #0f172a; }
            p { margin: 0; color: #334155; line-height: 1.55; }
            article { display: grid; gap: .9rem; }
            a[pButton] { width: fit-content; min-height: 44px; }
            @media (max-width: 720px) {
                header { flex-direction: column; }
                a[pButton] { width: 100%; justify-content: center; }
            }
        `
    ]
})
export class AdminSectionPlaceholder {
    private readonly route = inject(ActivatedRoute);

    get title(): string {
        return this.route.snapshot.data['title'] ?? 'Sezione admin';
    }

    get description(): string {
        return this.route.snapshot.data['description'] ?? 'Gestione globale della piattaforma.';
    }
}
