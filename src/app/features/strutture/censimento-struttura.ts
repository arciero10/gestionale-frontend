import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { CensimentoStrutturaMock, SAN_GAETANO_CENSIMENTO_DEFAULT, SAN_GAETANO_CENSIMENTO_STORAGE_KEY } from './strutture-censimento.mock';

@Component({
    selector: 'app-censimento-struttura',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, CheckboxModule, InputTextModule, SelectModule, TextareaModule],
    template: `
        <main class="struttura-public-page">
            <section class="hero-card">
                <span class="eyebrow">Portale strutture</span>
                <h1>Censimento struttura di accoglienza</h1>
                <p>Compila o aggiorna i dati della struttura per il gestionale Eventi di Comunità.</p>
            </section>

            <form class="form-card" (ngSubmit)="submit()" #censimentoForm="ngForm">
                <div class="form-grid">
                    <label>
                        <span>Nome struttura</span>
                        <input pInputText name="nomeStruttura" [(ngModel)]="form.nomeStruttura" required />
                    </label>
                    <label>
                        <span>Tipo struttura</span>
                        <p-select name="tipoStruttura" appendTo="body" [options]="tipiStruttura" [(ngModel)]="form.tipoStruttura" required></p-select>
                    </label>
                    <label class="span-2">
                        <span>Indirizzo</span>
                        <input pInputText name="indirizzo" [(ngModel)]="form.indirizzo" required />
                    </label>
                    <label>
                        <span>Città</span>
                        <input pInputText name="citta" [(ngModel)]="form.citta" required />
                    </label>
                    <label>
                        <span>Regione</span>
                        <input pInputText name="regione" [(ngModel)]="form.regione" required />
                    </label>
                    <label>
                        <span>Referente</span>
                        <input pInputText name="referente" [(ngModel)]="form.referente" required />
                    </label>
                    <label>
                        <span>Telefono</span>
                        <input pInputText name="telefono" [(ngModel)]="form.telefono" />
                    </label>
                    <label>
                        <span>Email</span>
                        <input pInputText type="email" name="email" [(ngModel)]="form.email" />
                    </label>
                    <label>
                        <span>Capienza posti letto</span>
                        <input pInputText type="number" min="0" name="capienzaPostiLetto" [(ngModel)]="form.capienzaPostiLetto" />
                    </label>
                    <label>
                        <span>Numero camere</span>
                        <input pInputText type="number" min="0" name="numeroCamere" [(ngModel)]="form.numeroCamere" />
                    </label>
                    <label>
                        <span>Bagni</span>
                        <input pInputText name="bagni" [(ngModel)]="form.bagni" />
                    </label>
                    <label>
                        <span>Sale incontri</span>
                        <input pInputText name="saleIncontri" [(ngModel)]="form.saleIncontri" />
                    </label>
                    <label>
                        <span>Pasti disponibili</span>
                        <input pInputText name="pastiDisponibili" [(ngModel)]="form.pastiDisponibili" placeholder="Es. colazione, pranzo, cena" />
                    </label>
                    <div class="checks span-2">
                        <label><p-checkbox name="refettorio" [(ngModel)]="form.refettorio" [binary]="true"></p-checkbox><span>Refettorio</span></label>
                        <label><p-checkbox name="cappella" [(ngModel)]="form.cappella" [binary]="true"></p-checkbox><span>Cappella</span></label>
                        <label><p-checkbox name="parcheggio" [(ngModel)]="form.parcheggio" [binary]="true"></p-checkbox><span>Parcheggio</span></label>
                    </div>
                    <label class="span-2">
                        <span>Note organizzative</span>
                        <textarea pTextarea rows="5" name="noteOrganizzative" [(ngModel)]="form.noteOrganizzative"></textarea>
                    </label>
                </div>

                <div class="consenso">
                    <p-checkbox inputId="consensoGestionale" name="consensoGestionale" [(ngModel)]="form.consensoGestionale" [binary]="true"></p-checkbox>
                    <label for="consensoGestionale">Acconsento a far comparire questa struttura nel gestionale dopo verifica dei dati.</label>
                </div>

                @if (errore) {
                    <div class="message error"><i class="pi pi-exclamation-triangle"></i>{{ errore }}</div>
                }
                @if (successo) {
                    <div class="message success"><i class="pi pi-check-circle"></i>{{ successo }}</div>
                }

                <footer>
                    <button pButton type="submit" label="Invia censimento" icon="pi pi-send"></button>
                </footer>
            </form>
        </main>
    `,
    styles: [
        `
            .struttura-public-page {
                min-height: 100vh;
                display: grid;
                gap: 1.25rem;
                align-content: start;
                padding: clamp(1rem, 3vw, 2.5rem);
                background:
                    linear-gradient(rgba(15, 23, 42, .48), rgba(15, 23, 42, .58)),
                    url('/images/backgrounds/posti-convivenza-bg.jpg') center center / cover no-repeat fixed;
                color: #111827;
            }
            .hero-card,
            .form-card {
                width: min(100%, 64rem);
                margin: 0 auto;
                border: 1px solid rgba(255, 255, 255, .32);
                border-radius: 16px;
                background: rgba(255, 255, 255, .86);
                box-shadow: 0 24px 60px rgba(15, 23, 42, .22);
                backdrop-filter: blur(10px);
            }
            .hero-card { padding: 1.4rem 1.5rem; }
            .eyebrow {
                color: #0f3558;
                font-weight: 850;
                text-transform: uppercase;
                font-size: .78rem;
                letter-spacing: .04em;
            }
            h1 { margin: .35rem 0 .4rem; color: #0f172a; font-size: clamp(1.65rem, 3vw, 2.4rem); }
            p { margin: 0; color: #475569; line-height: 1.5; }
            .form-card { padding: 1.4rem; display: grid; gap: 1rem; }
            .form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .9rem; }
            label { display: grid; gap: .4rem; color: #334155; font-weight: 800; }
            label span { font-size: .86rem; }
            input,
            textarea,
            p-select { width: 100%; }
            textarea { resize: vertical; }
            .span-2 { grid-column: span 2; }
            .checks {
                display: flex;
                flex-wrap: wrap;
                gap: .75rem 1rem;
                padding: .85rem;
                border-radius: 12px;
                background: rgba(248, 250, 252, .78);
                border: 1px solid #e2e8f0;
            }
            .checks label,
            .consenso {
                display: flex;
                align-items: center;
                gap: .55rem;
            }
            .consenso {
                padding: .9rem;
                border-radius: 12px;
                background: #f8fafc;
                border: 1px solid #e2e8f0;
                color: #334155;
                font-weight: 800;
            }
            .message {
                display: inline-flex;
                align-items: center;
                gap: .55rem;
                width: fit-content;
                padding: .7rem .9rem;
                border-radius: 12px;
                font-weight: 850;
            }
            .error { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }
            .success { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
            footer { display: flex; justify-content: flex-end; }
            @media (max-width: 760px) {
                .form-grid { grid-template-columns: 1fr; }
                .span-2 { grid-column: span 1; }
                footer button { width: 100%; }
                .struttura-public-page { background-attachment: scroll; }
            }
        `
    ]
})
export class CensimentoStruttura {
    readonly tipiStruttura = ['Struttura di accoglienza', 'Casa di convivenza', 'Istituto', 'Parrocchia', 'Hotel', 'Altro'];
    errore = '';
    successo = '';

    form: CensimentoStrutturaMock = { ...SAN_GAETANO_CENSIMENTO_DEFAULT };

    submit() {
        this.errore = '';
        this.successo = '';

        if (!this.form.consensoGestionale) {
            this.errore = 'Seleziona il consenso a comparire nel gestionale prima di inviare il censimento.';
            return;
        }

        const payload: CensimentoStrutturaMock = {
            ...this.form,
            statoCensimento: 'Censimento ricevuto',
            statoVerifica: 'Da verificare',
            dataInvio: new Date().toISOString()
        };

        // Fase futura: /strutture/dashboard consentirà all'utente struttura di aggiornare solo la propria scheda,
        // senza accedere a dati di comunità, persone o consensi individuali.
        localStorage.setItem(SAN_GAETANO_CENSIMENTO_STORAGE_KEY, JSON.stringify(payload));
        this.form = payload;
        this.successo = 'Censimento inviato. La scheda sarà verificata prima della pubblicazione.';
    }
}
