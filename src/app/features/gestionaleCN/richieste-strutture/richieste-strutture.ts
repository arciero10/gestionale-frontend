import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { GRAPH_SENDER_MAILBOX_PLACEHOLDER, RICHIESTE_STRUTTURE_API_CONTRACTS, codiceRichiestaRegexDocumentata } from './graph-email.placeholder';
import { RichiesteStruttureService } from './richieste-strutture.service';
import { CreaRichiestaStrutturaPayload, MessaggioRichiestaStruttura, RichiestaStruttura, StatoRichiestaStruttura, creaOggettoRichiesta, generaCodiceRichiesta } from './richieste-strutture.models';

@Component({
    selector: 'app-richieste-strutture',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, SelectModule, TagModule, TextareaModule],
    template: `
        <section class="richieste-page">
            <header class="page-head">
                <div>
                    <h1>Richieste strutture</h1>
                    <p>Prepara, invia e monitora le richieste di disponibilità alle strutture di accoglienza.</p>
                </div>
                <button pButton type="button" icon="pi pi-plus" [label]="formVisibile ? 'Chiudi form' : 'Nuova richiesta'" (click)="toggleForm()"></button>
            </header>

            @if (messaggioUtente) {
                <section class="action-message">
                    <i class="pi pi-info-circle"></i>
                    <span>{{ messaggioUtente }}</span>
                </section>
            }

            <section class="privacy-note">
                <strong>Privacy organizzativa</strong>
                <span>Le richieste alle strutture devono contenere solo le informazioni necessarie all'organizzazione della convivenza. Prima di condividere dati personali o particolari verificare i consensi privacy.</span>
            </section>

            @if (formVisibile) {
                <section class="request-form-card">
                    <div class="form-head">
                        <div>
                            <span>Bozza richiesta</span>
                            <h2>{{ form.oggetto }}</h2>
                        </div>
                        <p-tag value="Mock front-end" severity="warn" />
                    </div>

                    <form class="request-form" #richiestaForm="ngForm" (ngSubmit)="creaRichiesta()">
                        <div>
                            <label for="convivenza">Convivenza</label>
                            <p-select inputId="convivenza" name="convivenza" appendTo="body" [options]="convivenzeOptions" optionLabel="label" optionValue="id" [(ngModel)]="form.convivenzaId" (onChange)="aggiornaBozza()" required></p-select>
                        </div>
                        <div>
                            <label for="struttura">Struttura</label>
                            <p-select inputId="struttura" name="struttura" appendTo="body" [options]="struttureOptions" optionLabel="label" optionValue="id" [(ngModel)]="form.strutturaId" required></p-select>
                        </div>
                        <div>
                            <label for="comunitaCoinvolte">Comunità coinvolte</label>
                            <input id="comunitaCoinvolte" name="comunitaCoinvolte" pInputText [(ngModel)]="comunitaCoinvolteTesto" (ngModelChange)="aggiornaBozza()" required />
                        </div>
                        <div class="form-full">
                            <label for="oggetto">Oggetto</label>
                            <input id="oggetto" name="oggetto" pInputText [(ngModel)]="form.oggetto" required />
                            <small>Il codice richiesta deve restare tra parentesi quadre, ad esempio [EC-2026-000001].</small>
                        </div>
                        <div class="form-full">
                            <label for="messaggio">Messaggio</label>
                            <textarea id="messaggio" name="messaggio" pTextarea rows="9" [(ngModel)]="form.messaggio" required></textarea>
                        </div>
                        <footer>
                            <button pButton type="button" label="Annulla" severity="secondary" outlined (click)="toggleForm()"></button>
                            <button pButton type="submit" label="Crea bozza" icon="pi pi-check" [disabled]="richiestaForm.invalid"></button>
                        </footer>
                    </form>
                </section>
            }

            <div class="workspace">
                <aside class="list-panel">
                    <div class="panel-title">
                        <strong>{{ richieste.length }} richieste</strong>
                        <span>{{ senderMailbox }}</span>
                    </div>

                    @for (richiesta of richieste; track richiesta.id) {
                        <button type="button" class="request-row" [class.active]="selected.id === richiesta.id" (click)="select(richiesta)">
                            <span class="code">{{ richiesta.codiceRichiesta }}</span>
                            <strong>{{ getStrutturaLabel(richiesta.strutturaId) }}</strong>
                            <span>{{ getConvivenzaLabel(richiesta.convivenzaId) }}</span>
                            <span>{{ richiesta.comunitaCoinvolte.join(', ') }}</span>
                            <span class="row-bottom">
                                <span class="status-badge" [ngClass]="getStatoClass(richiesta.stato)">{{ richiesta.stato }}</span>
                                <small>Ultima risposta: {{ richiesta.dataUltimaRisposta || 'Nessuna' }}</small>
                            </span>
                        </button>
                    }
                </aside>

                <main class="detail-panel">
                    <section class="detail-card">
                        <div class="detail-head">
                            <div>
                                <span class="code">{{ selected.codiceRichiesta }}</span>
                                <h2>{{ getStrutturaLabel(selected.strutturaId) }}</h2>
                            </div>
                            <span class="status-badge" [ngClass]="getStatoClass(selected.stato)">{{ selected.stato }}</span>
                        </div>

                        <dl class="detail-grid">
                            <div><dt>Convivenza</dt><dd>{{ getConvivenzaLabel(selected.convivenzaId) }}</dd></div>
                            <div><dt>Comunità coinvolte</dt><dd>{{ selected.comunitaCoinvolte.join(', ') }}</dd></div>
                            <div><dt>Creazione</dt><dd>{{ selected.dataCreazione }}</dd></div>
                            <div><dt>Invio</dt><dd>{{ selected.dataInvio || 'Non inviata' }}</dd></div>
                            <div><dt>Ultima risposta</dt><dd>{{ selected.dataUltimaRisposta || 'Nessuna' }}</dd></div>
                            <div><dt>Mailbox mittente futura</dt><dd>{{ senderMailbox }}</dd></div>
                        </dl>

                        <section class="mail-preview">
                            <h3>Oggetto</h3>
                            <p>{{ selected.oggetto }}</p>
                            <h3>Messaggio</h3>
                            <pre>{{ selected.messaggio }}</pre>
                        </section>

                        <div class="actions">
                            <button pButton type="button" label="Invia richiesta" icon="pi pi-send" [disabled]="selected.stato !== 'Bozza'" (click)="inviaRichiesta()"></button>
                        </div>
                    </section>

                    <section class="conversation-card">
                        <div class="panel-title">
                            <strong>Conversazione</strong>
                            <span>{{ messaggi.length }} messaggi</span>
                        </div>

                        <div class="messages">
                            @for (messaggio of messaggi; track messaggio.id) {
                                <article class="message" [class.sent]="messaggio.tipo === 'Inviato'" [class.received]="messaggio.tipo === 'Ricevuto'">
                                    <div class="message-meta">
                                        <strong>{{ messaggio.tipo }}</strong>
                                        <span>{{ messaggio.dataMessaggio }}</span>
                                    </div>
                                    <dl>
                                        <div><dt>Da</dt><dd>{{ messaggio.mittente }}</dd></div>
                                        <div><dt>A</dt><dd>{{ messaggio.destinatario }}</dd></div>
                                    </dl>
                                    <h3>{{ messaggio.oggetto }}</h3>
                                    <p>{{ messaggio.corpo }}</p>
                                    <small>Graph messageId: {{ messaggio.messageIdGraph }}</small>
                                </article>
                            } @empty {
                                <div class="empty-state">Nessun messaggio collegato alla richiesta.</div>
                            }
                        </div>
                    </section>
                </main>
            </div>

            <section class="tech-note">
                <h2>Contratti backend futuri</h2>
                <p>L'invio reale tramite Microsoft Graph sarà collegato al backend. Nessun client secret è presente nel frontend.</p>
                <div>
                    @for (endpoint of apiContracts; track endpoint) {
                        <code>{{ endpoint }}</code>
                    }
                </div>
                <small>Regex risposte: {{ regexDocumentata.source }}</small>
            </section>
        </section>
    `,
    styles: [
        `
            .richieste-page { display: grid; gap: 1.25rem; }
            .page-head { display: flex; justify-content: space-between; gap: 1rem; align-items: center; }
            .page-head h1 { margin: 0 0 .35rem; font-size: 2rem; color: #111827; }
            .page-head p { margin: 0; color: #64748b; }
            .page-head button { min-height: 44px; }
            .action-message,
            .privacy-note,
            .request-form-card,
            .list-panel,
            .detail-card,
            .conversation-card,
            .tech-note {
                background: #fff;
                border: 1px solid #e5e7eb;
                border-radius: 14px;
                box-shadow: 0 10px 26px rgba(15, 23, 42, .06);
            }
            .action-message,
            .privacy-note {
                display: flex;
                gap: .75rem;
                align-items: flex-start;
                padding: .85rem 1rem;
                color: #475569;
            }
            .privacy-note strong { color: #17335f; white-space: nowrap; }
            .request-form-card,
            .detail-card,
            .conversation-card,
            .tech-note { padding: 1rem; }
            .form-head,
            .detail-head,
            .panel-title {
                display: flex;
                justify-content: space-between;
                gap: 1rem;
                align-items: flex-start;
                margin-bottom: 1rem;
            }
            .form-head span,
            .code {
                color: #315f8f;
                font-size: .82rem;
                font-weight: 850;
                letter-spacing: .02em;
            }
            .form-head h2,
            .detail-head h2 { margin: .2rem 0 0; color: #111827; font-size: 1.35rem; }
            .request-form {
                display: grid;
                grid-template-columns: repeat(3, minmax(0, 1fr));
                gap: .9rem;
            }
            .request-form label { display: block; margin-bottom: .35rem; color: #475569; font-weight: 800; }
            .request-form input,
            .request-form p-select,
            .request-form textarea { width: 100%; }
            .request-form small { display: block; margin-top: .3rem; color: #64748b; }
            .form-full,
            .request-form footer { grid-column: 1 / -1; }
            .request-form footer,
            .actions { display: flex; justify-content: flex-end; gap: .75rem; flex-wrap: wrap; }
            .workspace { display: grid; grid-template-columns: 24rem minmax(0, 1fr); gap: 1.25rem; align-items: start; }
            .list-panel { display: grid; gap: .75rem; padding: .75rem; max-height: calc(100vh - 12rem); overflow: auto; }
            .panel-title span { color: #64748b; font-size: .9rem; }
            .request-row {
                min-height: 132px;
                display: grid;
                gap: .4rem;
                padding: .9rem 1rem;
                border-radius: 12px;
                border: 1px solid #e5e7eb;
                background: #fafafa;
                color: #475569;
                text-align: left;
                cursor: pointer;
                line-height: 1.35;
            }
            .request-row strong { color: #111827; }
            .request-row.active { border-color: #315f8f; background: #eff6ff; }
            .row-bottom { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: .45rem; }
            .status-badge {
                display: inline-flex;
                width: fit-content;
                align-items: center;
                min-height: 1.75rem;
                padding: .22rem .6rem;
                border-radius: 999px;
                border: 1px solid transparent;
                font-size: .78rem;
                font-weight: 850;
            }
            .stato-bozza { background: #f1f5f9; color: #475569; border-color: #cbd5e1; }
            .stato-inviata { background: #dbeafe; color: #1d4ed8; border-color: #bfdbfe; }
            .stato-risposta { background: #e0e7ff; color: #3730a3; border-color: #c7d2fe; }
            .stato-disponibile { background: #dcfce7; color: #166534; border-color: #bbf7d0; }
            .stato-non-disponibile { background: #fee2e2; color: #991b1b; border-color: #fecaca; }
            .stato-preventivo { background: #ffedd5; color: #9a3412; border-color: #fed7aa; }
            .stato-confermata { background: #bbf7d0; color: #14532d; border-color: #86efac; }
            .stato-annullata { background: #e5e7eb; color: #374151; border-color: #9ca3af; }
            .detail-panel { display: grid; gap: 1rem; }
            .detail-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: .75rem; margin: 0; }
            .detail-grid div { padding: .8rem; border: 1px solid #e5e7eb; border-radius: 12px; background: #fbfbf8; }
            .detail-grid dt { color: #64748b; font-size: .8rem; }
            .detail-grid dd { margin: .25rem 0 0; color: #111827; font-weight: 800; overflow-wrap: anywhere; }
            .mail-preview { margin-top: 1rem; display: grid; gap: .5rem; }
            .mail-preview h3 { margin: .5rem 0 0; color: #111827; font-size: 1rem; }
            .mail-preview p,
            .mail-preview pre {
                margin: 0;
                padding: .85rem;
                border-radius: 12px;
                background: #f8fafc;
                color: #334155;
                border: 1px solid #e5e7eb;
                white-space: pre-wrap;
                font-family: inherit;
                line-height: 1.5;
            }
            .messages { display: grid; gap: .85rem; }
            .message {
                max-width: 78%;
                padding: .9rem;
                border-radius: 14px;
                border: 1px solid #e5e7eb;
                background: #f8fafc;
                color: #334155;
            }
            .message.sent { justify-self: end; background: #eff6ff; border-color: #bfdbfe; }
            .message.received { justify-self: start; background: #fff7ed; border-color: #fed7aa; }
            .message-meta,
            .message dl {
                display: flex;
                justify-content: space-between;
                flex-wrap: wrap;
                gap: .4rem .75rem;
            }
            .message dl { margin: .6rem 0; }
            .message dt { color: #64748b; font-size: .78rem; }
            .message dd { margin: 0; font-weight: 800; overflow-wrap: anywhere; }
            .message h3 { margin: .5rem 0; font-size: 1rem; color: #111827; }
            .message p { margin: 0; white-space: pre-wrap; line-height: 1.5; }
            .message small { display: block; margin-top: .6rem; color: #64748b; overflow-wrap: anywhere; }
            .empty-state { padding: 1rem; border: 1px dashed #cbd5e1; border-radius: 12px; color: #64748b; text-align: center; }
            .tech-note { display: grid; gap: .75rem; }
            .tech-note h2,
            .tech-note p { margin: 0; }
            .tech-note div { display: flex; flex-wrap: wrap; gap: .45rem; }
            .tech-note code { padding: .35rem .55rem; border-radius: 8px; background: #f1f5f9; color: #334155; }
            @media (max-width: 1100px) {
                .workspace,
                .request-form,
                .detail-grid { grid-template-columns: 1fr; }
                .list-panel { max-height: none; }
            }
            @media (max-width: 767px) {
                .page-head,
                .privacy-note,
                .form-head,
                .detail-head,
                .panel-title,
                .request-form footer,
                .actions { flex-direction: column; align-items: stretch; }
                .page-head button,
                .request-form footer button,
                .actions button { width: 100%; min-height: 44px; }
                .message { max-width: 100%; }
            }
        `
    ]
})
export class RichiesteStrutture {
    private readonly service = inject(RichiesteStruttureService);

    readonly senderMailbox = GRAPH_SENDER_MAILBOX_PLACEHOLDER;
    readonly apiContracts = RICHIESTE_STRUTTURE_API_CONTRACTS;
    readonly regexDocumentata = codiceRichiestaRegexDocumentata;
    readonly convivenzeOptions = this.service.getConvivenzeOptions();
    readonly struttureOptions = this.service.getStruttureOptions();

    richieste = this.service.getRichieste();
    selected: RichiestaStruttura = this.richieste[0];
    messaggi: MessaggioRichiestaStruttura[] = this.service.getMessaggi(this.selected.id);
    formVisibile = false;
    messaggioUtente = '';
    comunitaCoinvolteTesto = '3ª Comunità';
    form = this.creaFormVuoto();

    toggleForm() {
        this.formVisibile = !this.formVisibile;
        if (this.formVisibile) {
            this.form = this.creaFormVuoto();
            this.comunitaCoinvolteTesto = '3ª Comunità';
            this.aggiornaBozza();
        }
    }

    select(richiesta: RichiestaStruttura) {
        this.selected = richiesta;
        this.messaggi = this.service.getMessaggi(richiesta.id);
    }

    creaRichiesta() {
        if (!this.form.convivenzaId || !this.form.strutturaId) {
            return;
        }

        const payload: CreaRichiestaStrutturaPayload = {
            convivenzaId: this.form.convivenzaId,
            strutturaId: this.form.strutturaId,
            comunitaCoinvolte: this.parseComunitaCoinvolte(),
            oggetto: this.form.oggetto,
            messaggio: this.form.messaggio
        };

        const richiesta = this.service.creaRichiesta(payload);
        this.refresh(richiesta.id);
        this.formVisibile = false;
        this.messaggioUtente = 'Bozza richiesta struttura creata.';
    }

    inviaRichiesta() {
        const aggiornata = this.service.inviaRichiesta(this.selected.id);
        if (!aggiornata) {
            return;
        }

        this.refresh(aggiornata.id);
        this.messaggioUtente = 'Richiesta segnata come inviata. L’invio reale tramite Microsoft Graph sarà collegato al backend.';
    }

    aggiornaBozza() {
        const codice = generaCodiceRichiesta(2026, this.richieste.length + 1);
        const convivenza = this.form.convivenzaId ? this.getConvivenzaLabel(this.form.convivenzaId) : '';
        this.form.oggetto = creaOggettoRichiesta(codice);
        this.form.messaggio = this.service.creaMessaggioBase(convivenza, this.parseComunitaCoinvolte());
    }

    getConvivenzaLabel(id: number): string {
        return this.service.getConvivenzaLabel(id);
    }

    getStrutturaLabel(id: number): string {
        return this.service.getStrutturaLabel(id);
    }

    getStatoClass(stato: StatoRichiestaStruttura): string {
        switch (stato) {
            case 'Inviata':
                return 'stato-inviata';
            case 'RispostaRicevuta':
                return 'stato-risposta';
            case 'Disponibile':
                return 'stato-disponibile';
            case 'NonDisponibile':
                return 'stato-non-disponibile';
            case 'PreventivoRicevuto':
                return 'stato-preventivo';
            case 'Confermata':
                return 'stato-confermata';
            case 'Annullata':
                return 'stato-annullata';
            default:
                return 'stato-bozza';
        }
    }

    private refresh(selectedId: number) {
        this.richieste = this.service.getRichieste();
        this.selected = this.service.getRichiestaById(selectedId) ?? this.richieste[0];
        this.messaggi = this.service.getMessaggi(this.selected.id);
    }

    private creaFormVuoto() {
        const convivenzaId = this.convivenzeOptions[0]?.id ?? null;
        const strutturaId = this.struttureOptions[0]?.id ?? null;
        const codice = generaCodiceRichiesta(2026, this.richieste.length + 1);

        return {
            convivenzaId,
            strutturaId,
            oggetto: creaOggettoRichiesta(codice),
            messaggio: this.service.creaMessaggioBase(this.service.getConvivenzaLabel(convivenzaId ?? 0), this.parseComunitaCoinvolte())
        };
    }

    private parseComunitaCoinvolte(): string[] {
        return this.comunitaCoinvolteTesto
            .split(',')
            .map((comunita) => comunita.trim())
            .filter(Boolean);
    }
}
