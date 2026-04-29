import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { COMUNITA_ATTIVA_MOCK, DIOCESI_MOCK, NUMERI_COMUNITA, PARROCCHIE_MOCK, SETTORI_MOCK, creaNomeComunitaVisualizzato } from '../gestionaleCN/data/anagrafica-ecclesiale.mock';

@Component({
    selector: 'app-completa-profilo',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink, ButtonModule, SelectModule],
    template: `
        <main class="profile-page">
            <section class="profile-card">
                <span class="eyebrow">Primo accesso</span>
                <h1>Richiesta associazione comunità</h1>
                <p>Se è il tuo primo accesso, indica la comunità di appartenenza. La richiesta sarà verificata prima dell’attivazione definitiva.</p>

                <form class="profile-form">
                    <div>
                        <label for="diocesi">Diocesi</label>
                        <p-select inputId="diocesi" appendTo="body" [options]="diocesi" optionLabel="nome" optionValue="id" [(ngModel)]="profilo.diocesiId" name="diocesi" (ngModelChange)="onDiocesiChange()"></p-select>
                    </div>
                    <div>
                        <label for="settore">Settore</label>
                        <p-select inputId="settore" appendTo="body" [options]="settoriFiltrati" optionLabel="nome" optionValue="id" [(ngModel)]="profilo.settoreId" name="settore" (ngModelChange)="onSettoreChange()"></p-select>
                    </div>
                    <div>
                        <label for="parrocchia">Parrocchia</label>
                        <p-select inputId="parrocchia" appendTo="body" [options]="parrocchieFiltrate" optionLabel="nome" optionValue="id" [(ngModel)]="profilo.parrocchiaId" name="parrocchia"></p-select>
                    </div>
                    <div>
                        <label for="numero">Numero comunità</label>
                        <p-select inputId="numero" appendTo="body" [options]="numeriComunita" [(ngModel)]="profilo.numero" name="numero"></p-select>
                    </div>
                </form>

                <div class="preview">
                    <span>Anteprima richiesta</span>
                    <strong>{{ previewComunita }}</strong>
                </div>

                <div class="actions">
                    <a routerLink="/" class="ghost-link">Torna alla login</a>
                    <button pButton type="button" label="Invia richiesta" icon="pi pi-send"></button>
                </div>
            </section>

            <footer>
                <span>All rights reserved. Progettato da PANTELEIA - Associazione Promozione Sociale. CF: 96647400587</span>
                <span>Iscrizione RUNTS: Rep. n. 165890 – Det. n. G03684 del 19/03/2026</span>
            </footer>
        </main>
    `,
    styles: [
        `
            .profile-page {
                min-height: 100vh;
                padding: clamp(1rem, 3vw, 2rem);
                background: #f5f7fb;
                display: grid;
                gap: 1rem;
                place-items: center;
            }
            .profile-card {
                width: min(100%, 860px);
                background: #fff;
                border: 1px solid #e4e8ef;
                border-radius: 18px;
                box-shadow: 0 18px 38px rgba(15, 23, 42, .08);
                padding: clamp(1.25rem, 3vw, 2rem);
            }
            .eyebrow {
                color: #476078;
                font-weight: 800;
                text-transform: uppercase;
                font-size: .8rem;
            }
            h1 { margin: .45rem 0 .5rem; color: #111827; }
            p { margin: 0; color: #64748b; line-height: 1.55; }
            .profile-form {
                display: grid;
                grid-template-columns: repeat(2, minmax(0, 1fr));
                gap: 1rem;
                margin-top: 1.25rem;
            }
            .profile-form div {
                display: grid;
                gap: .45rem;
            }
            label { font-weight: 800; color: #1f2937; }
            p-select { width: 100%; }
            .preview {
                margin-top: 1.25rem;
                padding: 1rem;
                border-radius: 14px;
                background: #f8fafc;
                border: 1px solid #e4e8ef;
            }
            .preview span { display: block; color: #64748b; font-size: .85rem; }
            .preview strong { display: block; margin-top: .25rem; color: #111827; font-size: 1.1rem; }
            .actions {
                display: flex;
                justify-content: flex-end;
                align-items: center;
                gap: .75rem;
                margin-top: 1.25rem;
            }
            .ghost-link {
                color: #476078;
                font-weight: 800;
                text-decoration: none;
            }
            footer {
                display: flex;
                flex-wrap: wrap;
                justify-content: center;
                gap: .35rem 1rem;
                color: #6b7280;
                font-size: .75rem;
                text-align: center;
            }
            @media (max-width: 700px) {
                .profile-form { grid-template-columns: 1fr; }
                .actions { flex-direction: column; align-items: stretch; }
                .actions button { min-height: 44px; }
            }
        `
    ]
})
export class CompletaProfilo {
    diocesi = DIOCESI_MOCK;
    settori = SETTORI_MOCK;
    parrocchie = PARROCCHIE_MOCK;
    numeriComunita = NUMERI_COMUNITA;
    profilo = { ...COMUNITA_ATTIVA_MOCK };

    get settoriFiltrati() {
        return this.settori.filter((settore) => settore.diocesiId === this.profilo.diocesiId);
    }

    get parrocchieFiltrate() {
        return this.parrocchie.filter((parrocchia) => parrocchia.diocesiId === this.profilo.diocesiId && parrocchia.settoreId === this.profilo.settoreId);
    }

    get settoreSelezionato() {
        return this.settori.find((settore) => settore.id === this.profilo.settoreId);
    }

    get parrocchiaSelezionata() {
        return this.parrocchie.find((parrocchia) => parrocchia.id === this.profilo.parrocchiaId);
    }

    get previewComunita() {
        return creaNomeComunitaVisualizzato(this.profilo.numero, this.parrocchiaSelezionata?.nome ?? 'Parrocchia da scegliere', this.settoreSelezionato?.nome ?? 'Settore');
    }

    onDiocesiChange() {
        const primoSettore = this.settoriFiltrati[0];
        this.profilo.settoreId = primoSettore?.id ?? 0;
        this.onSettoreChange();
    }

    onSettoreChange() {
        const primaParrocchia = this.parrocchieFiltrate[0];
        this.profilo.parrocchiaId = primaParrocchia?.id ?? 0;
    }
}
