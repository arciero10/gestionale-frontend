import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { GRAPH_SENDER_MAILBOX_PLACEHOLDER, RICHIESTE_STRUTTURE_API_CONTRACTS, codiceRichiestaRegexDocumentata } from './graph-email.placeholder';
import { RichiesteStruttureService } from './richieste-strutture.service';
import { getCurrentCommunity } from '../data/community-selection.storage';
import { AuthService } from '@/auth/auth.service';
import {
    CreaRichiestaStrutturaPayload,
    EsitoRispostaStruttura,
    MessaggioRichiestaStruttura,
    RichiestaStruttura,
    StatoRichiestaStruttura,
    creaOggettoCompleto,
    formatDateIt
} from './richieste-strutture.models';

@Component({
    selector: 'app-richieste-strutture',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, SelectModule, TagModule, TextareaModule],
    template: `
        <section class="richieste-page">
            @if (richiestaIdFlusso) {
                <div class="flusso-breadcrumb">
                    <button pButton type="button" icon="pi pi-arrow-left" label="Torna all'elenco" severity="secondary" outlined (click)="tornaElenco()"></button>
                    <span>Richiesta creata — rivedi i dettagli e invia quando sei pronto.</span>
                </div>
            }

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

            @if (isNuovaRoute || formVisibile) {
                <section class="request-form-card">
                    <div class="form-head">
                        <div>
                            <span>Nuova richiesta</span>
                            <h2>{{ oggettoCompleto }}</h2>
                        </div>
                        <p-tag value="Mock front-end" severity="warn" />
                    </div>

                    <form class="request-form" #richiestaForm="ngForm">
                        <div class="form-full structure-summary">
                            <span>Struttura</span>
                            @if (strutturaBloccata) {
                                <strong>{{ strutturaSelezionataLabel }}</strong>
                                <small>{{ strutturaSelezionata?.indirizzo || 'Indirizzo da completare' }} · {{ strutturaSelezionata?.email || 'Email struttura mancante' }}</small>
                                @if (!strutturaSelezionata?.email) {
                                    <em>Email struttura mancante: la bozza può essere preparata, ma il contatto va completato prima dell'invio reale.</em>
                                }
                            } @else {
                                <p-select
                                    inputId="struttura"
                                    name="struttura"
                                    appendTo="body"
                                    panelStyleClass="modal-dropdown-panel"
                                    [options]="struttureOptions"
                                    optionLabel="label"
                                    optionValue="id"
                                    [(ngModel)]="form.strutturaId"
                                    required
                                ></p-select>
                            }
                        </div>

                        <div>
                            <label for="convivenza">Convivenza</label>
                            <p-select
                                inputId="convivenza"
                                name="convivenza"
                                appendTo="body"
                                panelStyleClass="modal-dropdown-panel"
                                [options]="convivenzeOptions"
                                optionLabel="label"
                                optionValue="id"
                                [(ngModel)]="form.convivenzaId"
                                (onChange)="aggiornaCorpoDaSelezioni()"
                                required
                            ></p-select>
                            <small>{{ getConvivenzaDescrizione(form.convivenzaId) }}</small>
                        </div>

                        <div class="form-full riepilogo-interno">
                            <div class="riepilogo-header">
                                <i class="pi pi-eye-slash"></i>
                                <span>Riepilogo interno – non incluso nell'email</span>
                            </div>
                            <div class="organizer-summary">
                                <div><span>Richiedente / organizzatore</span><strong>{{ getConvivenzaOrganizzatore(form.convivenzaId) }}</strong></div>
                                <div><span>Equipe organizzatrice</span><strong>{{ getConvivenzaEquipe(form.convivenzaId) || 'Non prevista' }}</strong></div>
                                <div><span>Comunità destinataria</span><strong>{{ getConvivenzaComunitaDestinataria(form.convivenzaId) }}</strong></div>
                            </div>
                        </div>

                        <div>
                            <label for="comunitaCoinvolte">Comunità coinvolte</label>
                            <input id="comunitaCoinvolte" name="comunitaCoinvolte" pInputText [(ngModel)]="comunitaCoinvolteTesto" (ngModelChange)="aggiornaCorpoDaSelezioni()" required />
                        </div>

                        <div>
                            <label>Codice richiesta</label>
                            <span class="locked-code">[{{ form.codiceRichiesta }}]</span>
                        </div>

                        <div class="form-full subject-row">
                            <label for="oggettoPersonalizzato">Oggetto email</label>
                            <div>
                                <span class="locked-code">[{{ form.codiceRichiesta }}]</span>
                                <input id="oggettoPersonalizzato" name="oggettoPersonalizzato" pInputText [(ngModel)]="form.oggettoPersonalizzato" required />
                            </div>
                            <small>Anteprima oggetto completo: {{ oggettoCompleto }}</small>
                        </div>

                        <div class="form-full">
                            <label for="corpoEmail">Corpo email</label>
                            <textarea id="corpoEmail" name="corpoEmail" pTextarea rows="13" [(ngModel)]="form.corpoEmail" (ngModelChange)="corpoModificato = true" required></textarea>
                        </div>

                        <footer>
                            <button pButton type="button" label="Annulla" severity="secondary" outlined (click)="annullaNuovaRichiesta()"></button>
                            <button pButton type="button" label="Salva bozza" icon="pi pi-save" [disabled]="richiestaForm.invalid" (click)="salvaBozza()"></button>
                            <button pButton type="button" label="Invia richiesta" icon="pi pi-send" [disabled]="richiestaForm.invalid" (click)="inviaNuovaRichiesta()"></button>
                        </footer>
                    </form>
                </section>
            } @else {
                <div class="workspace">
                    <aside class="list-panel">
                        <div class="panel-title">
                            <strong>Richieste strutture</strong>
                            <span>{{ senderMailbox }}</span>
                        </div>

                        <nav class="sezioni-tabs">
                            <button type="button" class="tab-btn" [class.active]="sezioneAttiva === 'Bozze'" (click)="impostaSezione('Bozze')">
                                <span>Bozze</span>
                                <span class="tab-count">{{ bozze.length }}</span>
                            </button>
                            <button type="button" class="tab-btn" [class.active]="sezioneAttiva === 'Inviate'" (click)="impostaSezione('Inviate')">
                                <span>Inviate</span>
                                <span class="tab-count">{{ inviate.length }}</span>
                            </button>
                            <button type="button" class="tab-btn" [class.active]="sezioneAttiva === 'Ricevute'" (click)="impostaSezione('Ricevute')">
                                <span>Ricevute</span>
                                <span class="tab-count">{{ ricevute.length }}</span>
                            </button>
                        </nav>

                        @if (richiesteFiltrate.length === 0) {
                            <div class="empty-tab">Nessuna richiesta in questa sezione.</div>
                        } @else {
                            @for (richiesta of richiesteFiltrate; track richiesta.id) {
                                <button type="button" class="request-row" [class.active]="selected.id === richiesta.id" (click)="select(richiesta)">
                                    <span class="code">{{ richiesta.codiceRichiesta }}</span>
                                    <strong>{{ getStrutturaLabel(richiesta.strutturaId) }}</strong>
                                    <span>{{ getConvivenzaLabel(richiesta.convivenzaId) }}</span>
                                    <span>{{ richiesta.comunitaCoinvolte.join(', ') }}</span>
                                    <span class="row-bottom">
                                        <span class="status-badge" [ngClass]="getStatoClass(richiesta.stato)">{{ richiesta.stato }}</span>
                                        <small>{{ formatDateIt(selectedDate(richiesta.dataUltimaRisposta)) || 'Nessuna risposta' }}</small>
                                    </span>
                                </button>
                            }
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
                                <div><dt>Organizzata da</dt><dd>{{ selected.soggettoOrganizzatore || getConvivenzaOrganizzatore(selected.convivenzaId) }}</dd></div>
                                <div><dt>Equipe organizzatrice</dt><dd>{{ selected.equipeOrganizzatriceNome || 'Non prevista' }}</dd></div>
                                <div><dt>Comunità destinataria</dt><dd>{{ selected.comunitaDestinatariaNome || getConvivenzaComunitaDestinataria(selected.convivenzaId) }}</dd></div>
                                <div><dt>Comunità coinvolte</dt><dd>{{ selected.comunitaCoinvolte.join(', ') }}</dd></div>
                                <div><dt>Creazione</dt><dd>{{ formatDateIt(selected.dataCreazione) }}</dd></div>
                                <div><dt>Invio</dt><dd>{{ formatDateIt(selected.dataInvio) || 'Non inviata' }}</dd></div>
                                <div><dt>Ultima risposta</dt><dd>{{ formatDateIt(selected.dataUltimaRisposta) || 'Nessuna' }}</dd></div>
                                @if (selected.esitoRisposta) {
                                    <div><dt>Esito risposta</dt><dd><span class="status-badge" [ngClass]="getEsitoClass(selected.esitoRisposta)">{{ selected.esitoRisposta }}</span></dd></div>
                                }
                                <div><dt>Mailbox mittente futura</dt><dd>{{ senderMailbox }}</dd></div>
                            </dl>

                            <section class="mail-preview">
                                <h3>Oggetto completo</h3>

                                @if (modificaSelezionata) {
                                    <input pInputText [(ngModel)]="selected.oggettoCompleto" />
                                } @else {
                                    <p>{{ selected.oggettoCompleto }}</p>
                                }

                                <h3>Corpo email</h3>

                                @if (modificaSelezionata) {
                                    <textarea pTextarea rows="16" [(ngModel)]="selected.corpoEmail"></textarea>
                                } @else {
                                    <pre>{{ selected.corpoEmail }}</pre>
                                }
                            </section>

                            <div class="actions">
                                <button
                                    pButton
                                    type="button"
                                    label="Modifica"
                                    icon="pi pi-pencil"
                                    severity="secondary"
                                    outlined
                                    [disabled]="selected.stato !== 'Bozza'"
                                    (click)="modificaRichiestaSelezionata()"
                                ></button>

                                <button
                                    pButton
                                    type="button"
                                    label="Invia richiesta"
                                    icon="pi pi-send"
                                    [disabled]="selected.stato !== 'Bozza'"
                                    (click)="inviaRichiesta()"
                                ></button>

                                <button
                                    pButton
                                    type="button"
                                    label="Conferma disponibilità struttura"
                                    icon="pi pi-qrcode"
                                    severity="success"
                                    [disabled]="selected.stato === 'Confermata' || selected.stato === 'Annullata'"
                                    (click)="confermaDisponibilitaStruttura()"
                                ></button>

                                @if (selected.checkInAccess) {
                                    <button pButton type="button" label="Apri check-in" icon="pi pi-external-link" severity="secondary" outlined (click)="apriCheckIn()"></button>
                                }
                            </div>
                        </section>

                        <section class="conversation-card">
                            <div class="panel-title">
                                <strong>Conversazione</strong>
                                <span>{{ messaggi.length }} messaggi</span>
                            </div>

                            <div class="messages">
                                @if (messaggi.length === 0) {
                                    @if (selected.stato === 'Bozza') {
                                        <div class="empty-state"><i class="pi pi-file-edit"></i> Bozza in preparazione — nessun messaggio ancora inviato.</div>
                                    } @else {
                                        <div class="empty-state">Nessun messaggio collegato alla richiesta.</div>
                                    }
                                } @else {
                                    @if (risposteStruttura.length) {
                                        <div class="thread-label"><i class="pi pi-reply"></i> Risposte della struttura</div>
                                        @for (messaggio of risposteStruttura; track messaggio.id) {
                                            <article class="message received">
                                                <div class="message-meta">
                                                    <strong>Risposta struttura</strong>
                                                    <span>{{ formatDateIt(messaggio.dataMessaggio) }}</span>
                                                </div>
                                                <dl>
                                                    <div><dt>Da</dt><dd>{{ messaggio.mittente }}</dd></div>
                                                    <div><dt>A</dt><dd>{{ messaggio.destinatario }}</dd></div>
                                                </dl>
                                                <h3>{{ messaggio.oggetto }}</h3>
                                                <p>{{ messaggio.corpo }}</p>
                                                <small>Graph messageId: {{ messaggio.messageIdGraph }}</small>
                                            </article>
                                        }
                                    } @else {
                                        <div class="empty-responses"><i class="pi pi-clock"></i><span>Nessuna risposta ricevuta dalla struttura.</span></div>
                                    }
                                    @if (richiestaInviata.length) {
                                        <div class="thread-label thread-label-sent"><i class="pi pi-send"></i> Richiesta inviata</div>
                                        @for (messaggio of richiestaInviata; track messaggio.id) {
                                            <article class="message sent">
                                                <div class="message-meta">
                                                    <strong>Richiesta inviata</strong>
                                                    <span>{{ formatDateIt(messaggio.dataMessaggio) }}</span>
                                                </div>
                                                <dl>
                                                    <div><dt>Da</dt><dd>{{ messaggio.mittente }}</dd></div>
                                                    <div><dt>A</dt><dd>{{ messaggio.destinatario }}</dd></div>
                                                </dl>
                                                <h3>{{ messaggio.oggetto }}</h3>
                                                <p>{{ messaggio.corpo }}</p>
                                                <small>Graph messageId: {{ messaggio.messageIdGraph }}</small>
                                            </article>
                                        }
                                    }
                                }
                            </div>
                        </section>
                    </main>
                </div>
            }

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
            .richieste-page {
                display: grid;
                gap: 1.25rem;
                color: #0f172a;
            }
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
                background: rgba(255, 255, 255, .95);
                backdrop-filter: blur(6px);
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
            .structure-summary {
                display: grid;
                gap: .35rem;
                padding: .85rem;
                border: 1px solid #e5e7eb;
                border-radius: 12px;
                background: rgba(251, 251, 248, .96);
            }
            .structure-summary span { color: #64748b; font-weight: 800; font-size: .85rem; }
            .structure-summary strong { color: #111827; font-size: 1.05rem; }
            .structure-summary em { color: #9a3412; font-style: normal; font-weight: 800; }
            .organizer-summary { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: .75rem; }
            .organizer-summary div { padding: .75rem; border: 1px solid #e5e7eb; border-radius: 12px; background: #f8fafc; }
            .organizer-summary span { display: block; color: #64748b; font-size: .8rem; font-weight: 800; }
            .organizer-summary strong { display: block; margin-top: .25rem; color: #111827; }
            .locked-code {
                display: inline-flex;
                align-items: center;
                min-height: 42px;
                width: fit-content;
                padding: .45rem .7rem;
                border-radius: 10px;
                background: #e0e7ff;
                color: #3730a3;
                font-weight: 900;
                white-space: nowrap;
            }
            .subject-row > div {
                display: grid;
                grid-template-columns: auto minmax(0, 1fr);
                gap: .75rem;
                align-items: center;
            }
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
                background: rgba(250, 250, 250, .96);
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
            .detail-grid div { padding: .8rem; border: 1px solid #e5e7eb; border-radius: 12px; background: rgba(251, 251, 248, .96); }
            .detail-grid dt { color: #64748b; font-size: .8rem; }
            .detail-grid dd { margin: .25rem 0 0; color: #111827; font-weight: 800; overflow-wrap: anywhere; }
            .mail-preview { margin-top: 1rem; display: grid; gap: .5rem; }
            .mail-preview h3 { margin: .5rem 0 0; color: #111827; font-size: 1rem; }
            .mail-preview input,
            .mail-preview textarea {
                width: 100%;
                padding: .85rem;
                border-radius: 12px;
                background: #ffffff;
                color: #111827;
                border: 1px solid #cbd5e1;
                font-family: inherit;
                line-height: 1.5;
            }
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
            .thread-label {
                display: flex;
                align-items: center;
                gap: .45rem;
                padding: .45rem .1rem;
                color: #9a3412;
                font-size: .78rem;
                font-weight: 800;
                text-transform: uppercase;
                letter-spacing: .04em;
                border-bottom: 1px solid #fed7aa;
                margin-bottom: .25rem;
            }
            .thread-label-sent { color: #1d4ed8; border-bottom-color: #bfdbfe; margin-top: .75rem; }
            .empty-responses {
                display: flex;
                align-items: center;
                gap: .5rem;
                padding: .65rem .85rem;
                border-radius: 10px;
                background: #f8fafc;
                border: 1px dashed #cbd5e1;
                color: #64748b;
                font-size: .88rem;
            }
            .tech-note { display: grid; gap: .75rem; }
            .tech-note h2,
            .tech-note p { margin: 0; }
            .tech-note div { display: flex; flex-wrap: wrap; gap: .45rem; }
            .tech-note code { padding: .35rem .55rem; border-radius: 8px; background: #f1f5f9; color: #334155; }
            .riepilogo-interno {
                padding: .85rem;
                border: 1px solid #fed7aa;
                border-radius: 12px;
                background: #fff7ed;
            }
            .riepilogo-header {
                display: flex;
                align-items: center;
                gap: .5rem;
                margin-bottom: .75rem;
                color: #9a3412;
                font-size: .82rem;
                font-weight: 800;
            }
            .flusso-breadcrumb {
                display: flex;
                align-items: center;
                gap: 1rem;
                flex-wrap: wrap;
                padding: .25rem 0;
                color: #0f172a;
            }
            .flusso-breadcrumb span { color: #0f172a; font-size: .9rem; font-weight: 700; }
            .sezioni-tabs {
                display: grid;
                grid-template-columns: repeat(3, minmax(0, 1fr));
                gap: .3rem;
                padding: .3rem;
                background: #f1f5f9;
                border-radius: 10px;
            }
            .tab-btn {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: .2rem;
                padding: .55rem .4rem;
                border-radius: 8px;
                border: none;
                background: transparent;
                color: #64748b;
                cursor: pointer;
                font-size: .82rem;
                font-weight: 700;
                transition: background 120ms, color 120ms;
                line-height: 1.2;
            }
            .tab-btn:hover { background: #e2e8f0; }
            .tab-btn.active { background: #fff; color: #17335f; box-shadow: 0 1px 4px rgba(15,23,42,.1); }
            .tab-count {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                min-width: 1.4rem;
                height: 1.4rem;
                padding: 0 .3rem;
                border-radius: 999px;
                background: #e2e8f0;
                color: #475569;
                font-size: .72rem;
                font-weight: 800;
            }
            .tab-btn.active .tab-count { background: #dbeafe; color: #1d4ed8; }
            .empty-tab {
                padding: 1rem;
                text-align: center;
                color: #94a3b8;
                font-size: .88rem;
                border: 1px dashed #e2e8f0;
                border-radius: 10px;
            }
            @media (max-width: 1100px) {
                .workspace,
                .organizer-summary,
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
                .subject-row > div { grid-template-columns: 1fr; }
            }
        `
    ]
})
export class RichiesteStrutture implements OnInit {
    private readonly service = inject(RichiesteStruttureService);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly authService = inject(AuthService);
    private readonly currentCommunity = getCurrentCommunity();

    readonly senderMailbox = GRAPH_SENDER_MAILBOX_PLACEHOLDER;
    readonly apiContracts = RICHIESTE_STRUTTURE_API_CONTRACTS;
    readonly regexDocumentata = codiceRichiestaRegexDocumentata;
    readonly convivenzeOptions = this.service.getConvivenzeOptions();
    readonly struttureOptions = this.service.getStruttureOptions();
    readonly formatDateIt = formatDateIt;

    richieste = this.service.getRichieste();
    selected: RichiestaStruttura = this.richieste[0];
    messaggi: MessaggioRichiestaStruttura[] = this.service.getMessaggi(this.selected.id);
    formVisibile = false;
    richiestaIdFlusso: number | null = null;
    messaggioUtente = '';
    comunitaCoinvolteTesto = `${this.currentCommunity.nomeComunita} ${this.currentCommunity.parrocchiaNome}`;
    strutturaBloccata = false;
    corpoModificato = false;
    modificaSelezionata = false;
    form = this.creaFormVuoto();
    sezioneAttiva: 'Bozze' | 'Inviate' | 'Ricevute' = this.computeDefaultSection();

    get bozze(): RichiestaStruttura[] {
        return this.richieste.filter((r) => r.stato === 'Bozza');
    }

    get inviate(): RichiestaStruttura[] {
        return this.richieste.filter((r) => r.stato === 'Inviata');
    }

    get ricevute(): RichiestaStruttura[] {
        return this.richieste.filter((r) => r.stato === 'Risposta ricevuta' || r.stato === 'Confermata' || r.stato === 'Annullata');
    }

    get richiesteFiltrate(): RichiestaStruttura[] {
        switch (this.sezioneAttiva) {
            case 'Bozze':
                return this.bozze;
            case 'Inviate':
                return this.inviate;
            case 'Ricevute':
                return this.ricevute;
        }
    }

    impostaSezione(sezione: 'Bozze' | 'Inviate' | 'Ricevute') {
        this.sezioneAttiva = sezione;
        if (!this.richiesteFiltrate.some((r) => r.id === this.selected.id) && this.richiesteFiltrate.length > 0) {
            this.select(this.richiesteFiltrate[0]);
        }
    }

    private computeDefaultSection(): 'Bozze' | 'Inviate' | 'Ricevute' {
        if (this.richieste.some((r) => r.stato === 'Risposta ricevuta')) return 'Ricevute';
        if (this.richieste.some((r) => r.stato === 'Bozza')) return 'Bozze';
        return 'Inviate';
    }

    private statoToSezione(stato: StatoRichiestaStruttura): 'Bozze' | 'Inviate' | 'Ricevute' {
        if (stato === 'Bozza') return 'Bozze';
        if (stato === 'Inviata') return 'Inviate';
        return 'Ricevute';
    }

    get isNuovaRoute() {
        return this.router.url.split('?')[0].endsWith('/richieste-strutture/nuova');
    }

    get oggettoCompleto() {
        return creaOggettoCompleto(this.form.codiceRichiesta, this.form.oggettoPersonalizzato);
    }

    get strutturaSelezionata() {
        return this.service.getStrutturaById(this.form.strutturaId ?? 0);
    }

    get strutturaSelezionataLabel() {
        return this.strutturaSelezionata?.label ?? 'Struttura da verificare';
    }

    get risposteStruttura(): MessaggioRichiestaStruttura[] {
        return [...this.messaggi]
            .filter((m) => m.tipo === 'Ricevuto')
            .sort((a, b) => b.dataMessaggio.localeCompare(a.dataMessaggio));
    }

    get richiestaInviata(): MessaggioRichiestaStruttura[] {
        return this.messaggi.filter((m) => m.tipo === 'Inviato');
    }

    ngOnInit() {
        const richiestaIdParam = this.route.snapshot.queryParamMap.get('richiestaId');
        if (richiestaIdParam) {
            const richiestaId = Number(richiestaIdParam);
            this.richiestaIdFlusso = richiestaId;
            this.richieste = this.service.getRichieste();
            const trovata = this.service.getRichiestaById(richiestaId);
            if (trovata) {
                this.select(trovata);
                this.sezioneAttiva = this.statoToSezione(trovata.stato);
            }
            return;
        }

        const strutturaId = Number(this.route.snapshot.queryParamMap.get('strutturaId'));
        if (this.isNuovaRoute || strutturaId) {
            this.formVisibile = true;
            this.form = this.creaFormVuoto();
            if (strutturaId && this.service.getStrutturaById(strutturaId)) {
                this.form.strutturaId = strutturaId;
                this.strutturaBloccata = true;
            }
            this.corpoModificato = false;
            this.aggiornaCorpoDaSelezioni(true);
        }
    }

    apriNuovaRichiesta() {
        this.router.navigate(['/gestionale-cn/richieste-strutture/nuova']);
    }

    annullaNuovaRichiesta() {
        this.router.navigate(['/gestionale-cn/richieste-strutture']);
    }

    tornaElenco() {
        this.richiestaIdFlusso = null;
    }

    select(richiesta: RichiestaStruttura) {
        this.selected = richiesta;
        this.messaggi = this.service.getMessaggi(richiesta.id);
        this.modificaSelezionata = false;
    }

    modificaRichiestaSelezionata() {
        this.modificaSelezionata = true;

        setTimeout(() => {
            document.querySelector('.mail-preview')?.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }, 50);
    }

    salvaBozza() {
        const richiesta = this.creaRichiestaDaForm();
        this.refresh(richiesta.id);
        this.messaggioUtente = 'Bozza richiesta struttura creata.';
        this.router.navigate(['/gestionale-cn/richieste-strutture']);
    }

    inviaNuovaRichiesta() {
        const richiesta = this.creaRichiestaDaForm();
        const aggiornata = this.service.inviaRichiesta(richiesta.id);
        this.refresh(aggiornata?.id ?? richiesta.id);
        this.messaggioUtente = "Richiesta segnata come inviata. L'invio reale tramite Microsoft Graph sarà collegato al backend.";
        this.router.navigate(['/gestionale-cn/richieste-strutture']);
    }

    inviaRichiesta() {
        const aggiornata = this.service.inviaRichiesta(this.selected.id);
        if (!aggiornata) {
            return;
        }

        this.refresh(aggiornata.id);
        this.messaggioUtente = "Richiesta segnata come inviata. L'invio reale tramite Microsoft Graph sarà collegato al backend.";
        this.impostaSezione('Inviate');
    }

    confermaDisponibilitaStruttura() {
        const auth = this.authService.state();
        const userId = auth.email ?? auth.userId ?? 'mock-organizzatore';
        const aggiornata = this.service.confermaDisponibilitaStruttura(this.selected.id, userId);

        if (!aggiornata) {
            this.messaggioUtente = 'Impossibile confermare la struttura per questa richiesta.';
            return;
        }

        this.refresh(aggiornata.id);
        this.sezioneAttiva = this.statoToSezione(aggiornata.stato);
        this.messaggioUtente = 'Struttura confermata. QR check-in generato e inviato all’organizzatore.';
    }

    apriCheckIn() {
        const token = this.selected.checkInAccess?.token;
        if (!token) {
            this.messaggioUtente = 'Link check-in non ancora disponibile.';
            return;
        }

        this.router.navigate(['/gestionale-cn/check-in', this.selected.convivenzaId], { queryParams: { token } });
    }

    private nomeRichiedente(): string {
        const { firstName, lastName } = this.authService.state();
        if (firstName && lastName) return `${firstName} ${lastName}`;
        if (firstName) return firstName;
        return 'Da indicare';
    }

    aggiornaCorpoDaSelezioni(force = false) {
        if (this.corpoModificato && !force) {
            return;
        }

        const richiedente = {
            nome: this.nomeRichiedente(),
            ruolo: '',
            comunita: `${this.currentCommunity.nomeComunita} – ${this.currentCommunity.parrocchiaNome}`.trim()
        };
        this.form.corpoEmail = this.service.creaCorpoEmailBase(this.form.convivenzaId ?? 0, this.parseComunitaCoinvolte(), '', richiedente);
    }

    getConvivenzaLabel(id: number): string {
        return this.service.getConvivenzaLabel(id);
    }

    getConvivenzaDescrizione(id: number | null): string {
        return id ? this.service.getConvivenzaDescrizione(id) : '';
    }

    getConvivenzaOrganizzatore(id: number | null): string {
        return id ? this.service.getConvivenzaById(id)?.soggettoOrganizzatore ?? 'Comunità' : 'Comunità';
    }

    getConvivenzaEquipe(id: number | null): string {
        return id ? this.service.getConvivenzaById(id)?.equipeOrganizzatriceNome ?? '' : '';
    }

    getConvivenzaComunitaDestinataria(id: number | null): string {
        return id ? this.service.getConvivenzaById(id)?.comunitaDestinatariaNome ?? this.comunitaCoinvolteTesto : this.comunitaCoinvolteTesto;
    }

    getStrutturaLabel(id: number): string {
        return this.service.getStrutturaLabel(id);
    }

    selectedDate(date: string | null) {
        return date;
    }

    getStatoClass(stato: StatoRichiestaStruttura): string {
        switch (stato) {
            case 'Inviata':
                return 'stato-inviata';
            case 'Risposta ricevuta':
                return 'stato-risposta';
            case 'Confermata':
                return 'stato-confermata';
            case 'Annullata':
                return 'stato-annullata';
            default:
                return 'stato-bozza';
        }
    }

    getEsitoClass(esito: EsitoRispostaStruttura): string {
        switch (esito) {
            case 'Disponibile':
                return 'stato-disponibile';
            case 'Non disponibile':
                return 'stato-non-disponibile';
            case 'Preventivo ricevuto':
                return 'stato-preventivo';
            default:
                return 'stato-bozza';
        }
    }

    private creaRichiestaDaForm(): RichiestaStruttura {
        const payload: CreaRichiestaStrutturaPayload = {
            convivenzaId: this.form.convivenzaId ?? this.convivenzeOptions[0].id,
            strutturaId: this.form.strutturaId ?? this.struttureOptions[0].id,
            comunitaCoinvolte: this.parseComunitaCoinvolte(),
            codiceRichiesta: this.form.codiceRichiesta,
            oggettoPersonalizzato: this.form.oggettoPersonalizzato,
            corpoEmail: this.form.corpoEmail
        };

        return this.service.creaRichiesta(payload);
    }

    private refresh(selectedId: number) {
        this.richieste = this.service.getRichieste();
        this.selected = this.service.getRichiestaById(selectedId) ?? this.richieste[0];
        this.messaggi = this.service.getMessaggi(this.selected.id);
        this.formVisibile = false;
        this.strutturaBloccata = false;
        this.modificaSelezionata = false;
    }

    private creaFormVuoto() {
        const convivenzaId = this.convivenzeOptions[0]?.id ?? null;
        const strutturaId = this.struttureOptions[0]?.id ?? null;
        const codiceRichiesta = this.service.generaCodiceRichiesta();
        const richiedente = {
            nome: this.nomeRichiedente(),
            ruolo: '',
            comunita: `${this.currentCommunity.nomeComunita} – ${this.currentCommunity.parrocchiaNome}`.trim()
        };

        return {
            codiceRichiesta,
            convivenzaId,
            strutturaId,
            oggettoPersonalizzato: 'Richiesta disponibilità convivenza',
            corpoEmail: this.service.creaCorpoEmailBase(convivenzaId ?? 0, this.parseComunitaCoinvolte(), '', richiedente)
        };
    }

    private parseComunitaCoinvolte(): string[] {
        return this.comunitaCoinvolteTesto
            .split(',')
            .map((comunita) => comunita.trim())
            .filter(Boolean);
    }
}
