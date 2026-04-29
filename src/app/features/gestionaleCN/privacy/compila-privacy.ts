import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { MEMBRI_COMUNITA_PILOTA } from '../data/comunita-pilota.mock';
import { PRIVACY_CONSENTS_DRAFT, PRIVACY_POLICY_DRAFT_DATA_ITEMS, PRIVACY_POLICY_DRAFT_PARAGRAPHS, PRIVACY_POLICY_DRAFT_TITLE } from './privacy-policy-draft';

@Component({
    selector: 'app-compila-privacy',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, TextareaModule],
    template: `
        <main class="privacy-page">
            <header>
                <span class="draft-badge">Bozza ambiente test</span>
                <h1>Modulo privacy</h1>
                <p>Questa schermata è una bozza funzionale. I testi definitivi dovranno essere validati prima della produzione.</p>
            </header>

            @if (membroCorrente) {
                <section class="privacy-card person-card">
                    <span>Membro</span>
                    <strong>{{ membroCorrente.nomeCompleto }}</strong>
                    <small>Stato mock dopo salvataggio: {{ statoMock }}</small>
                </section>
            }

            @if (errore) {
                <section class="privacy-card error">{{ errore }}</section>
            }

            <section class="privacy-card">
                <details open>
                    <summary>{{ policyTitle }}</summary>
                    @for (paragraph of policyParagraphs; track paragraph) {
                        <p>{{ paragraph }}</p>
                    }
                    <h3>Dati trattati</h3>
                    <ul>
                        @for (item of dataItems; track item) {
                            <li>{{ item }}</li>
                        }
                    </ul>
                </details>
            </section>

            <section class="privacy-card">
                <h2>Consensi</h2>
                @for (consenso of consensi; track consenso.key) {
                    <label class="check-row">
                        <input type="checkbox" [(ngModel)]="form[consenso.key]" />
                        <span>
                            <strong>{{ consenso.title }} <em *ngIf="consenso.required">obbligatorio</em></strong>
                            {{ consenso.text }}
                        </span>
                    </label>
                }
            </section>

            <section class="privacy-card">
                <h2>Firma digitale mock</h2>
                <label>
                    Nome e cognome per conferma
                    <input pInputText [(ngModel)]="firmaNome" />
                </label>
                <label class="check-row">
                    <input type="checkbox" [(ngModel)]="confermaInvio" />
                    Confermo l’invio dei consensi
                </label>
                <label>
                    Note facoltative
                    <textarea pTextarea rows="4" [(ngModel)]="note"></textarea>
                </label>
            </section>

            <section class="privacy-card warning">
                <p>Non condividere dati personali o particolari con strutture esterne senza consenso valido.</p>
            </section>

            <div class="actions">
                <button pButton type="button" label="Salva consensi" icon="pi pi-check" (click)="salvaConsensi()"></button>
            </div>

            @if (salvato) {
                <section class="privacy-card success">
                    Consensi salvati in modalità mock. Stato aggiornato: Raccolto, metodo: Digitale, modulo ricevuto: sì, data consenso: {{ dataConsenso }}.
                </section>
            }
        </main>
    `,
    styles: [
        `
            .privacy-page { display: grid; gap: 1.25rem; max-width: 980px; margin: 0 auto; }
            h1, h2, h3, p { margin: 0; }
            header p, li, small { color: #64748b; }
            .draft-badge { display: inline-flex; margin-bottom: .5rem; padding: .25rem .65rem; border-radius: 999px; background: #fffbeb; color: #92400e; border: 1px solid #fde68a; font-weight: 800; }
            .privacy-card { display: grid; gap: 1rem; padding: 1.25rem; border-radius: 16px; background: #fff; border: 1px solid #e5e7eb; box-shadow: 0 10px 24px rgba(15, 23, 42, .06); }
            .person-card strong { font-size: 1.2rem; color: #111827; }
            details { display: grid; gap: .85rem; }
            summary { cursor: pointer; font-size: 1.15rem; font-weight: 800; color: #111827; }
            ul { margin: 0; padding-left: 1.25rem; }
            label { display: grid; gap: .4rem; color: #1f2937; font-weight: 700; }
            .check-row { min-height: 44px; display: flex; align-items: flex-start; gap: .65rem; }
            .check-row span { display: grid; gap: .2rem; line-height: 1.45; font-weight: 500; }
            .check-row em { margin-left: .35rem; color: #92400e; font-size: .78rem; font-style: normal; }
            .warning { background: #fffbeb; color: #92400e; border-color: #fde68a; font-weight: 700; }
            .error { background: #fef2f2; color: #991b1b; border-color: #fecaca; font-weight: 800; }
            .success { background: #ecfdf5; color: #065f46; border-color: #a7f3d0; font-weight: 800; }
            .actions { display: flex; justify-content: flex-end; }
            @media (max-width: 767px) { .actions button { width: 100%; min-height: 44px; } }
        `
    ]
})
export class CompilaPrivacy {
    private readonly route = inject(ActivatedRoute);
    policyTitle = PRIVACY_POLICY_DRAFT_TITLE;
    policyParagraphs = PRIVACY_POLICY_DRAFT_PARAGRAPHS;
    dataItems = PRIVACY_POLICY_DRAFT_DATA_ITEMS;
    consensi = PRIVACY_CONSENTS_DRAFT;
    membroCorrente = MEMBRI_COMUNITA_PILOTA.find((membro) => membro.id === Number(this.route.snapshot.queryParamMap.get('membroId')));
    statoMock = this.membroCorrente?.consensoPrivacyStato ?? 'Da raccogliere';
    firmaNome = this.membroCorrente?.nomeCompleto ?? '';
    note = '';
    confermaInvio = false;
    errore = '';
    salvato = false;
    dataConsenso = '';
    form: Record<string, boolean> = {
        consensoDatiPersonali: false,
        consensoDatiParticolari: false,
        consensoStrutture: false,
        consensoComunicazioni: false,
        presaVisione: false
    };

    salvaConsensi() {
        this.errore = '';
        this.salvato = false;

        if (!this.form['presaVisione'] || !this.form['consensoDatiPersonali']) {
            this.errore = 'Per salvare servono presa visione informativa e consenso al trattamento dei dati personali.';
            return;
        }

        if (!this.confermaInvio || !this.firmaNome.trim()) {
            this.errore = 'Conferma l’invio dei consensi e indica nome e cognome per la firma digitale mock.';
            return;
        }

        this.statoMock = 'Raccolto';
        this.dataConsenso = new Date().toISOString().slice(0, 10);
        this.salvato = true;
    }
}
