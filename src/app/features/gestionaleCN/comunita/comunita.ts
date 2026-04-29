import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import {
    CATECHISTI_COMUNITA_PILOTA,
    COMUNITA_PILOTA,
    MEMBRI_COMUNITA_PILOTA,
    CatechistaComunita,
    ConsensoPrivacyPilota,
    MembroComunitaPilota,
    RuoloComunitaPilota,
    RuoloOperativoComunita
} from '../data/comunita-pilota.mock';
import { DEMO_COMUNITA, DEMO_MEMBRI } from '../../demo/demo.mock';
import { PRIVACY_CONSENTS_DRAFT, PRIVACY_POLICY_DRAFT_DATA_ITEMS, PRIVACY_POLICY_DRAFT_PARAGRAPHS, PRIVACY_POLICY_DRAFT_TITLE } from '../privacy/privacy-policy-draft';
import { TAPPE_CAMMINO, TappaCammino } from '../data/tappe-cammino.mock';

type StatoMembro = MembroComunitaPilota['statoMembro'];
type AccessoApp = MembroComunitaPilota['accessoApp'];
type MembroForm = Pick<MembroComunitaPilota, 'nome' | 'cognome' | 'ruolo' | 'accessoApp' | 'statoMembro' | 'consensoPrivacyStato' | 'moduloPrivacyInviato' | 'moduloPrivacyRicevuto' | 'note'>;

@Component({
    selector: 'app-comunita',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, SelectModule, TableModule, TagModule, TextareaModule],
    template: `
        <div class="community-page">
            <header class="page-heading">
                <div>
                    <h1>La tua Comunità</h1>
                    <p>Anagrafica comunità e gestione iniziale dei consensi.</p>
                </div>
                <button pButton type="button" [icon]="formVisibile ? 'pi pi-times' : 'pi pi-user-plus'" [label]="formVisibile ? 'Annulla' : 'Aggiungi membro'" (click)="toggleForm()"></button>
            </header>

            <section class="identity-card">
                <div>
                    <span>Comunità associata</span>
                    <h2>{{ nomeComunita }}</h2>
                    <p>{{ parrocchiaComunita }}</p>
                </div>
                <div class="identity-meta">
                    <span class="tappa-badge">Tappa del Cammino: {{ tappaCammino }}</span>
                    <strong>Settore {{ settoreComunita }}</strong>
                    <strong>{{ diocesiComunita }}</strong>
                    <small>{{ isDemo ? 'I dati mostrati sono dimostrativi.' : 'Questi dati sono visibili solo nell’ambiente autenticato.' }}</small>
                    @if (!isDemo) {
                        <button pButton type="button" label="Modifica tappa" icon="pi pi-flag" severity="secondary" outlined (click)="apriModificaTappa()"></button>
                    }
                </div>
            </section>

            @if (!isDemo) {
                <section class="catechisti-card">
                    <div class="section-title">
                        <div>
                            <span>Catechisti accompagnatori</span>
                            <h2>Catechisti della comunità</h2>
                            <p>Riferimenti super partes: non sono inclusi nei conteggi dei membri operativi.</p>
                        </div>
                        <strong>{{ catechisti.length }}</strong>
                    </div>
                    <div class="catechisti-grid">
                        @for (catechista of catechisti; track catechista.id) {
                            <article>
                                <strong>{{ catechista.nome }} {{ catechista.cognome }}</strong>
                                <span class="role-badge role-catechista">{{ catechista.ruolo }}</span>
                                <small>{{ catechista.note }}</small>
                            </article>
                        }
                    </div>
                </section>
            }

            @if (messaggio) {
                <section class="action-message">
                    <i class="pi pi-info-circle"></i>
                    <span>{{ messaggio }}</span>
                </section>
            }

            @if (formVisibile) {
                <section class="card p-6">
                    <h2 class="form-title">{{ membroInModifica ? 'Modifica membro' : 'Aggiungi membro' }}</h2>
                    <form class="member-form" #membroForm="ngForm" (ngSubmit)="salvaMembro()">
                        <div>
                            <label for="nome">Nome</label>
                            <input id="nome" name="nome" pInputText [(ngModel)]="form.nome" required />
                        </div>
                        <div>
                            <label for="cognome">Cognome</label>
                            <input id="cognome" name="cognome" pInputText [(ngModel)]="form.cognome" required />
                        </div>
                        <div>
                            <label for="ruolo">Ruolo</label>
                            <p-select inputId="ruolo" name="ruolo" appendTo="body" [options]="ruoliForm" [(ngModel)]="form.ruolo" required></p-select>
                        </div>
                        <div>
                            <label for="accessoApp">Accesso app</label>
                            <p-select inputId="accessoApp" name="accessoApp" appendTo="body" [options]="accessiApp" [(ngModel)]="form.accessoApp"></p-select>
                        </div>
                        <div>
                            <label for="statoMembro">Stato</label>
                            <p-select inputId="statoMembro" name="statoMembro" appendTo="body" [options]="statiMembro" [(ngModel)]="form.statoMembro"></p-select>
                        </div>
                        <div>
                            <label for="consensoPrivacyStato">Privacy</label>
                            <p-select inputId="consensoPrivacyStato" name="consensoPrivacyStato" appendTo="body" [options]="statiPrivacy" [(ngModel)]="form.consensoPrivacyStato"></p-select>
                        </div>
                        <label class="check-row">
                            <input type="checkbox" name="moduloPrivacyInviato" [(ngModel)]="form.moduloPrivacyInviato" />
                            Modulo privacy inviato
                        </label>
                        <label class="check-row">
                            <input type="checkbox" name="moduloPrivacyRicevuto" [(ngModel)]="form.moduloPrivacyRicevuto" />
                            Modulo privacy ricevuto
                        </label>
                        <div class="form-notes">
                            <label for="note">Note</label>
                            <textarea id="note" name="note" pTextarea rows="3" [(ngModel)]="form.note"></textarea>
                        </div>
                        <div class="form-actions">
                            <button pButton type="button" label="Annulla" severity="secondary" outlined (click)="annullaForm()"></button>
                            <button pButton type="submit" icon="pi pi-check" [label]="membroInModifica ? 'Salva modifiche' : 'Salva membro'" [disabled]="membroForm.invalid"></button>
                        </div>
                    </form>
                </section>
            }

            <section class="controls-card">
                <div class="search-box">
                    <label for="ricerca">Cerca membro</label>
                    <input id="ricerca" pInputText type="search" placeholder="Nome o cognome" [(ngModel)]="ricerca" />
                </div>
                <div class="search-box">
                    <label for="filtroRuolo">Filtra ruolo</label>
                    <p-select inputId="filtroRuolo" appendTo="body" [options]="ruoliFiltro" [(ngModel)]="ruoloFiltro" [showClear]="true" placeholder="Tutti i ruoli"></p-select>
                </div>
                <button pButton type="button" icon="pi pi-send" label="Invia moduli privacy mancanti" severity="success" outlined (click)="apriInvioPrivacyMassivo()"></button>
                <div class="totals">
                    <strong>{{ membriFiltrati.length }}</strong>
                    <span>membri visualizzati su {{ membri.length }}</span>
                    @if (!isDemo) {
                        <small>Catechisti accompagnatori: {{ catechisti.length }}</small>
                    }
                </div>
            </section>

            <section class="role-summary" aria-label="Conteggio per ruolo">
                @for (item of conteggiRuolo; track item.ruolo) {
                    <article>
                        <span>{{ item.ruolo }}</span>
                        <strong>{{ item.totale }}</strong>
                    </article>
                }
            </section>

            <section class="card member-table">
                <p-table [value]="membriFiltrati" dataKey="id" responsiveLayout="scroll" [paginator]="membriFiltrati.length > 12" [rows]="12">
                    <ng-template #caption>
                        <div class="table-caption">
                            <strong>Membri comunità</strong>
                            <span>{{ membri.length }} membri totali</span>
                        </div>
                    </ng-template>
                    <ng-template #header>
                        <tr>
                            <th>Nome</th>
                            <th>Cognome</th>
                            <th>Ruolo</th>
                            <th>Accesso app</th>
                            <th>Privacy</th>
                            <th>Stato</th>
                            <th class="text-right">Azioni</th>
                        </tr>
                    </ng-template>
                    <ng-template #body let-membro>
                        <tr>
                            <td>{{ membro.nome }}</td>
                            <td>{{ membro.cognome }}</td>
                            <td><span class="role-badge" [ngClass]="getRuoloClass(membro.ruolo)">{{ membro.ruolo }}</span></td>
                            <td><p-tag [value]="membro.accessoApp" [severity]="getAccessoSeverity(membro.accessoApp)" /></td>
                            <td><span class="privacy-badge" [ngClass]="getPrivacyClass(membro.consensoPrivacyStato)">{{ membro.consensoPrivacyStato }}</span></td>
                            <td><p-tag [value]="membro.statoMembro" [severity]="getStatoSeverity(membro.statoMembro)" /></td>
                            <td>
                                <div class="row-actions">
                                    <button pButton type="button" label="Modifica ruolo" icon="pi pi-user-edit" severity="info" text (click)="apriModificaRuolo(membro)"></button>
                                    <button pButton type="button" label="Modifica privacy" icon="pi pi-shield" severity="secondary" text (click)="apriModificaPrivacy(membro)"></button>
                                    <button pButton type="button" label="Anteprima modulo" icon="pi pi-eye" severity="secondary" text (click)="apriAnteprimaPrivacy(membro)"></button>
                                    <button pButton type="button" label="Invia modulo privacy" icon="pi pi-send" severity="success" text (click)="apriInvioPrivacy(membro)"></button>
                                    <button pButton type="button" icon="pi pi-trash" severity="danger" text ariaLabel="Elimina" (click)="eliminaMembro(membro.id)"></button>
                                </div>
                            </td>
                        </tr>
                    </ng-template>
                    <ng-template #emptymessage>
                        <tr>
                            <td colspan="7">Nessun membro trovato con i filtri attuali.</td>
                        </tr>
                    </ng-template>
                </p-table>
            </section>

            <section class="member-cards" aria-label="Membri comunità">
                @for (membro of membriFiltrati; track membro.id) {
                    <article class="member-card">
                        <div class="member-card-head">
                            <div>
                                <strong>{{ membro.nomeCompleto }}</strong>
                                <span class="role-badge" [ngClass]="getRuoloClass(membro.ruolo)">{{ membro.ruolo }}</span>
                            </div>
                            <p-tag [value]="membro.statoMembro" [severity]="getStatoSeverity(membro.statoMembro)" />
                        </div>
                        <dl>
                            <div><dt>Accesso app</dt><dd>{{ membro.accessoApp }}</dd></div>
                            <div><dt>Privacy</dt><dd><span class="privacy-badge" [ngClass]="getPrivacyClass(membro.consensoPrivacyStato)">{{ membro.consensoPrivacyStato }}</span></dd></div>
                            <div><dt>Modulo inviato</dt><dd>{{ membro.moduloPrivacyInviato ? 'Sì' : 'No' }}</dd></div>
                            <div><dt>Modulo ricevuto</dt><dd>{{ membro.moduloPrivacyRicevuto ? 'Sì' : 'No' }}</dd></div>
                        </dl>
                        <div class="card-actions">
                            <button pButton type="button" icon="pi pi-user-edit" label="Modifica ruolo" severity="info" outlined (click)="apriModificaRuolo(membro)"></button>
                            <button pButton type="button" icon="pi pi-shield" label="Privacy" severity="secondary" outlined (click)="apriModificaPrivacy(membro)"></button>
                            <button pButton type="button" icon="pi pi-eye" label="Anteprima" severity="secondary" outlined (click)="apriAnteprimaPrivacy(membro)"></button>
                            <button pButton type="button" icon="pi pi-send" label="Invia modulo" severity="success" outlined (click)="apriInvioPrivacy(membro)"></button>
                        </div>
                    </article>
                }
            </section>

            @if (ruoloModalMembro) {
                <div class="modal-backdrop" role="presentation" (click)="chiudiModali()">
                    <section class="app-modal" role="dialog" aria-modal="true" aria-label="Modifica ruolo" (click)="$event.stopPropagation()">
                        <header>
                            <span>Modifica ruolo</span>
                            <h2>{{ ruoloModalMembro.nomeCompleto }}</h2>
                        </header>
                        <p>Ruolo attuale: <strong>{{ ruoloModalMembro.ruolo }}</strong></p>
                        <label for="nuovoRuolo">Nuovo ruolo</label>
                        <p-select inputId="nuovoRuolo" appendTo="body" [options]="ruoliOperativi" [(ngModel)]="nuovoRuolo"></p-select>
                        <footer>
                            <button pButton type="button" label="Annulla" severity="secondary" outlined (click)="chiudiModali()"></button>
                            <button pButton type="button" label="Salva ruolo" icon="pi pi-check" (click)="salvaRuolo()"></button>
                        </footer>
                    </section>
                </div>
            }

            @if (privacyModalMembro) {
                <div class="modal-backdrop" role="presentation" (click)="chiudiModali()">
                    <section class="app-modal" role="dialog" aria-modal="true" aria-label="Modifica privacy" (click)="$event.stopPropagation()">
                        <header>
                            <span>Modifica privacy</span>
                            <h2>{{ privacyModalMembro.nomeCompleto }}</h2>
                        </header>
                        <label for="nuovaPrivacy">Stato privacy</label>
                        <p-select inputId="nuovaPrivacy" appendTo="body" [options]="statiPrivacy" [(ngModel)]="nuovaPrivacy"></p-select>
                        <label class="check-row">
                            <input type="checkbox" [(ngModel)]="privacyModuloRicevuto" />
                            Modulo privacy ricevuto
                        </label>
                        <footer>
                            <button pButton type="button" label="Annulla" severity="secondary" outlined (click)="chiudiModali()"></button>
                            <button pButton type="button" label="Salva privacy" icon="pi pi-check" (click)="salvaPrivacy()"></button>
                        </footer>
                    </section>
                </div>
            }

            @if (tappaModalAperta) {
                <div class="modal-backdrop" role="presentation" (click)="chiudiModali()">
                    <section class="app-modal" role="dialog" aria-modal="true" aria-label="Modifica tappa del Cammino" (click)="$event.stopPropagation()">
                        <header>
                            <span>Modifica tappa</span>
                            <h2>{{ nomeComunita }}</h2>
                        </header>
                        <p>Tappa attuale: <strong>{{ tappaCammino }}</strong></p>
                        <label for="nuovaTappa">Nuova tappa</label>
                        <p-select inputId="nuovaTappa" appendTo="body" [options]="tappeCammino" [(ngModel)]="nuovaTappa"></p-select>
                        <footer>
                            <button pButton type="button" label="Annulla" severity="secondary" outlined (click)="chiudiModali()"></button>
                            <button pButton type="button" label="Salva tappa" icon="pi pi-check" (click)="salvaTappa()"></button>
                        </footer>
                    </section>
                </div>
            }

            @if (privacyInvioAperto) {
                <div class="modal-backdrop" role="presentation" (click)="chiudiModali()">
                    <section class="app-modal app-modal-wide" role="dialog" aria-modal="true" aria-label="Invia modulo privacy" (click)="$event.stopPropagation()">
                        <header>
                            <span>Invio modulo privacy</span>
                            <h2>{{ invioMassivo ? 'Moduli privacy mancanti' : privacyInvioMembro?.nomeCompleto }}</h2>
                        </header>
                        <p>Il fratello riceverà un link personale per completare i propri dati e consensi. L’invio reale sarà collegato al backend email in una fase successiva.</p>
                        @if (!invioMassivo && privacyInvioMembro) {
                            <div class="email-preview">
                                <strong>Destinatario</strong>
                                <span>{{ privacyInvioMembro.email || 'Email mancante' }}</span>
                            </div>
                        }
                        @if (invioMassivo) {
                            <div class="email-preview">
                                <strong>{{ membriSelezionatiInvio.length }} moduli selezionati</strong>
                                <span>Con email: {{ membriConEmailSelezionati.length }} · Senza email: {{ membriSenzaEmailSelezionati.length }} · Esclusi: {{ membriEsclusiInvio.length }}</span>
                            </div>
                        }
                        <div class="mock-email">
                            <strong>Oggetto</strong>
                            <p>Modulo privacy – Gestionale Comunità</p>
                            <strong>Testo email mock</strong>
                            <p>Pace. Ti inviamo il link personale per leggere l’informativa privacy e completare i consensi necessari alla gestione della comunità e delle convivenze.</p>
                            @if (!invioMassivo && privacyInvioMembro) {
                                <strong>Link personale mock</strong>
                                <code>{{ linkPrivacy(privacyInvioMembro) }}</code>
                            }
                        </div>
                        <p class="privacy-warning">Bozza ambiente test. L’invio email reale sarà collegato al backend in una fase successiva.</p>
                        <footer>
                            <button pButton type="button" label="Annulla" severity="secondary" outlined (click)="chiudiModali()"></button>
                            @if (!invioMassivo && privacyInvioMembro) {
                                <button pButton type="button" label="Copia link" icon="pi pi-copy" severity="secondary" outlined (click)="copiaLinkPrivacy(privacyInvioMembro)"></button>
                            }
                            <button pButton type="button" label="Conferma invio mock" icon="pi pi-send" (click)="confermaInvioPrivacy()"></button>
                        </footer>
                    </section>
                </div>
            }

            @if (anteprimaMembro) {
                <div class="modal-backdrop" role="presentation" (click)="chiudiModali()">
                    <section class="app-modal app-modal-wide policy-preview" role="dialog" aria-modal="true" aria-label="Anteprima modulo privacy" (click)="$event.stopPropagation()">
                        <header>
                            <span>Bozza ambiente test</span>
                            <h2>Anteprima modulo per {{ anteprimaMembro.nomeCompleto }}</h2>
                        </header>
                        <h3>{{ policyTitle }}</h3>
                        @for (paragraph of policyParagraphs; track paragraph) {
                            <p>{{ paragraph }}</p>
                        }
                        <h3>Dati trattati</h3>
                        <ul>
                            @for (item of policyDataItems; track item) {
                                <li>{{ item }}</li>
                            }
                        </ul>
                        <h3>Consensi richiesti</h3>
                        @for (consenso of policyConsents; track consenso.key) {
                            <div class="consent-preview">
                                <strong>{{ consenso.title }} <span *ngIf="consenso.required">obbligatorio</span></strong>
                                <p>{{ consenso.text }}</p>
                            </div>
                        }
                        <a class="privacy-link" [href]="linkPrivacy(anteprimaMembro)" target="_blank" rel="noopener">Apri pagina compilazione</a>
                        <footer>
                            <button pButton type="button" label="Chiudi" severity="secondary" outlined (click)="chiudiModali()"></button>
                        </footer>
                    </section>
                </div>
            }
        </div>
    `,
    styles: [
        `
            .community-page {
                display: grid;
                gap: 1.5rem;
            }

            .page-heading,
            .table-caption,
            .row-actions,
            .card-actions,
            .identity-card,
            .controls-card,
            .section-title {
                display: flex;
                gap: 1rem;
            }

            .page-heading,
            .table-caption,
            .section-title {
                justify-content: space-between;
                align-items: center;
            }

            .page-heading h1,
            .section-title h2 {
                margin: 0 0 0.35rem;
            }

            .page-heading p,
            .section-title p,
            .identity-card p,
            .identity-meta small {
                margin: 0;
                color: #64748b;
            }

            .identity-card,
            .controls-card,
            .role-summary article,
            .member-card,
            .action-message,
            .catechisti-card {
                padding: 1rem;
                border-radius: 14px;
                background: #fff;
                border: 1px solid #e5e7eb;
                box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
            }

            .identity-card,
            .catechisti-card {
                background: #fbfbf8;
            }

            .identity-card {
                justify-content: space-between;
                align-items: flex-start;
            }

            .identity-card span,
            .section-title span,
            .search-box label,
            .role-summary span,
            .member-card dt,
            .app-modal header span,
            .app-modal label {
                color: #64748b;
                font-size: 0.82rem;
                font-weight: 700;
            }

            .identity-card h2 {
                margin: 0.25rem 0;
                color: #111827;
                font-size: 1.45rem;
            }

            .identity-meta {
                display: grid;
                gap: 0.3rem;
                text-align: right;
            }

            .catechisti-grid {
                display: grid;
                grid-template-columns: repeat(4, minmax(0, 1fr));
                gap: 0.85rem;
                margin-top: 1rem;
            }

            .catechisti-grid article {
                display: grid;
                gap: 0.45rem;
                padding: 0.85rem;
                border-radius: 12px;
                background: #fff;
                border: 1px solid #e5e7eb;
            }

            .catechisti-grid small {
                color: #64748b;
            }

            .action-message {
                display: flex;
                align-items: center;
                gap: 0.65rem;
                color: #075985;
                background: #f0f9ff;
                border-color: #bae6fd;
                font-weight: 700;
            }

            .member-form {
                display: grid;
                grid-template-columns: repeat(3, minmax(0, 1fr));
                gap: 1rem;
            }

            .member-form div,
            .search-box,
            .app-modal {
                display: grid;
                gap: 0.45rem;
            }

            .member-form label {
                color: #1f2937;
                font-weight: 700;
            }

            .member-form input,
            .member-form textarea,
            .member-form p-select,
            .search-box input,
            .search-box p-select,
            .app-modal p-select {
                width: 100%;
            }

            .form-title {
                margin: 0 0 1rem;
                font-size: 1.25rem;
            }

            .form-notes,
            .form-actions {
                grid-column: 1 / -1;
            }

            .check-row {
                min-height: 44px;
                display: flex !important;
                align-items: center;
                gap: 0.55rem;
                color: #1f2937;
                font-weight: 700;
            }

            .form-actions,
            .app-modal footer {
                display: flex !important;
                justify-content: flex-end;
                gap: 0.65rem;
                grid-template-columns: none !important;
            }

            .controls-card {
                align-items: end;
                justify-content: space-between;
                flex-wrap: wrap;
            }

            .search-box {
                min-width: min(100%, 240px);
            }

            .totals {
                display: grid;
                gap: 0.15rem;
                text-align: right;
            }

            .totals strong {
                font-size: 1.6rem;
                color: #111827;
            }

            .totals span,
            .totals small {
                color: #64748b;
            }

            .role-summary {
                display: grid;
                grid-template-columns: repeat(6, minmax(0, 1fr));
                gap: 0.85rem;
            }

            .role-summary article {
                display: grid;
                gap: 0.2rem;
            }

            .role-summary strong {
                color: #111827;
                font-size: 1.35rem;
            }

            .role-badge {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: max-content;
                min-height: 1.7rem;
                padding: 0.2rem 0.6rem;
                border-radius: 999px;
                font-size: 0.78rem;
                font-weight: 800;
                border: 1px solid transparent;
            }

            .privacy-badge {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: max-content;
                min-height: 1.7rem;
                padding: 0.2rem 0.6rem;
                border-radius: 999px;
                font-size: 0.78rem;
                font-weight: 800;
                border: 1px solid transparent;
            }

            .role-responsabile { background: #dbeafe; color: #17335f; border-color: #bfdbfe; }
            .role-corresponsabile { background: #ede9fe; color: #4c1d95; border-color: #ddd6fe; }
            .role-cantore { background: #ccfbf1; color: #115e59; border-color: #99f6e4; }
            .role-ostiario { background: #fef3c7; color: #92400e; border-color: #fde68a; }
            .role-fratello { background: #e0f2fe; color: #475569; border-color: #bae6fd; }
            .role-presbitero { background: #fce7f3; color: #831843; border-color: #fbcfe8; }
            .role-catechista { background: #fef9c3; color: #854d0e; border-color: #fde68a; }
            .privacy-da-inviare { background: #e0f2fe; color: #475569; border-color: #bae6fd; }
            .privacy-inviato { background: #dbeafe; color: #1d4ed8; border-color: #bfdbfe; }
            .privacy-da-raccogliere { background: #fef3c7; color: #92400e; border-color: #fde68a; }
            .privacy-raccolto { background: #dcfce7; color: #166534; border-color: #bbf7d0; }
            .privacy-negato { background: #fee2e2; color: #991b1b; border-color: #fecaca; }
            .privacy-revocato { background: #ede9fe; color: #312e81; border-color: #c4b5fd; }

            .tappa-badge {
                display: inline-flex;
                width: fit-content;
                align-items: center;
                min-height: 1.9rem;
                padding: 0.25rem 0.65rem;
                border-radius: 999px;
                background: #eef2ff;
                color: #3730a3;
                border: 1px solid #c7d2fe;
                font-size: 0.82rem;
                font-weight: 800;
            }

            .row-actions {
                justify-content: flex-end;
                flex-wrap: wrap;
            }

            .member-cards {
                display: none;
            }

            .member-card-head {
                display: flex;
                justify-content: space-between;
                gap: 1rem;
                align-items: flex-start;
            }

            .member-card-head strong {
                display: block;
                margin-bottom: 0.45rem;
                font-size: 1.05rem;
            }

            .member-card dl {
                display: grid;
                gap: 0.75rem;
                margin: 1rem 0;
            }

            .member-card dd {
                margin: 0.2rem 0 0;
                color: #111827;
                font-weight: 700;
            }

            .modal-backdrop {
                position: fixed;
                inset: 0;
                z-index: 1100;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 1rem;
                background: rgba(15, 23, 42, 0.45);
            }

            .app-modal {
                width: min(100%, 430px);
                padding: 1.25rem;
                border-radius: 18px;
                background: #fff;
                box-shadow: 0 24px 70px rgba(15, 23, 42, 0.25);
            }

            .app-modal-wide {
                width: min(100%, 560px);
            }

            .app-modal h2,
            .app-modal p {
                margin: 0;
            }

            .email-preview,
            .mock-email {
                display: grid;
                gap: 0.25rem;
                padding: 0.85rem;
                border-radius: 12px;
                background: #f8fafc;
                border: 1px solid #e5e7eb;
                color: #475569;
            }

            .mock-email code,
            .privacy-link {
                overflow-wrap: anywhere;
            }

            .privacy-warning {
                padding: 0.75rem;
                border-radius: 12px;
                background: #fffbeb;
                color: #92400e;
                border: 1px solid #fde68a;
                font-weight: 700;
            }

            .policy-preview {
                max-height: 86vh;
                overflow: auto;
            }

            .policy-preview h3 {
                margin: 0.4rem 0 0;
            }

            .policy-preview ul {
                margin: 0;
                padding-left: 1.25rem;
                color: #475569;
            }

            .consent-preview {
                display: grid;
                gap: 0.25rem;
                padding: 0.7rem;
                border-radius: 12px;
                background: #f8fafc;
                border: 1px solid #e5e7eb;
            }

            .consent-preview span {
                color: #92400e;
                font-size: 0.78rem;
            }

            .privacy-link {
                display: inline-flex;
                width: fit-content;
                color: #17335f;
                font-weight: 800;
            }

            @media (max-width: 1024px) {
                .member-form {
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                }

                .role-summary,
                .catechisti-grid {
                    grid-template-columns: repeat(3, minmax(0, 1fr));
                }
            }

            @media (max-width: 767px) {
                :host {
                    display: block;
                    overflow-x: hidden;
                }

                .page-heading,
                .identity-card,
                .controls-card,
                .section-title {
                    flex-direction: column;
                    align-items: stretch;
                }

                .identity-meta,
                .totals {
                    text-align: left;
                }

                .member-form,
                .role-summary,
                .catechisti-grid {
                    grid-template-columns: 1fr;
                }

                .member-table {
                    display: none;
                }

                .member-cards {
                    display: grid;
                    gap: 1rem;
                }

                .card-actions,
                .app-modal footer {
                    flex-direction: column;
                }

                .card-actions button,
                .page-heading button,
                .form-actions button,
                .app-modal footer button {
                    width: 100%;
                    min-height: 44px;
                }
            }
        `
    ]
})
export class Comunita {
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);

    ruoliOperativi: RuoloOperativoComunita[] = ['Responsabile', 'Corresponsabile', 'Cantore', 'Ostiario', 'Fratello'];
    ruoliForm = this.ruoliOperativi;
    ruoliFiltro: Exclude<RuoloComunitaPilota, 'Catechista'>[] = ['Presbitero', ...this.ruoliOperativi];
    statiMembro: StatoMembro[] = ['Attivo', 'Temporaneamente assente', 'Da contattare'];
    accessiApp: AccessoApp[] = ['Nessuno', 'Invitato', 'Attivo', 'In attesa'];
    statiPrivacy: ConsensoPrivacyPilota[] = ['Da inviare', 'Inviato', 'Da raccogliere', 'Raccolto', 'Negato', 'Revocato'];
    tappeCammino = [...TAPPE_CAMMINO];

    ricerca = '';
    ruoloFiltro: Exclude<RuoloComunitaPilota, 'Catechista'> | null = null;
    formVisibile = false;
    membroInModifica: MembroComunitaPilota | null = null;
    messaggio = '';

    ruoloModalMembro: MembroComunitaPilota | null = null;
    nuovoRuolo: RuoloOperativoComunita = 'Fratello';
    privacyModalMembro: MembroComunitaPilota | null = null;
    nuovaPrivacy: ConsensoPrivacyPilota = 'Da inviare';
    privacyModuloRicevuto = false;
    privacyInvioAperto = false;
    privacyInvioMembro: MembroComunitaPilota | null = null;
    invioMassivo = false;
    anteprimaMembro: MembroComunitaPilota | null = null;
    tappaCammino: TappaCammino = (this.isDemo ? DEMO_COMUNITA.tappaCammino : COMUNITA_PILOTA.tappaCammino) as TappaCammino;
    nuovaTappa: TappaCammino = this.tappaCammino;
    tappaModalAperta = false;
    policyTitle = PRIVACY_POLICY_DRAFT_TITLE;
    policyParagraphs = PRIVACY_POLICY_DRAFT_PARAGRAPHS;
    policyDataItems = PRIVACY_POLICY_DRAFT_DATA_ITEMS;
    policyConsents = PRIVACY_CONSENTS_DRAFT;

    catechisti: CatechistaComunita[] = this.isDemo ? [] : CATECHISTI_COMUNITA_PILOTA.map((catechista) => ({ ...catechista }));
    membri: MembroComunitaPilota[] = this.isDemo ? this.creaMembriDemo() : MEMBRI_COMUNITA_PILOTA.map((membro) => ({ ...membro }));
    private prossimoId = this.membri.length + 1;
    form: MembroForm = this.creaFormVuoto();

    get isDemo() {
        const url = this.router.url.split('?')[0].split('#')[0];
        return this.route.snapshot.data['demo'] === true || url === '/demo' || url.startsWith('/demo/');
    }

    get nomeComunita() {
        return this.isDemo ? DEMO_COMUNITA.nome : COMUNITA_PILOTA.nomeVisualizzato;
    }

    get parrocchiaComunita() {
        return this.isDemo ? DEMO_COMUNITA.parrocchia : COMUNITA_PILOTA.parrocchia;
    }

    get settoreComunita() {
        return this.isDemo ? DEMO_COMUNITA.settore.replace(/^Settore\s+/i, '') : COMUNITA_PILOTA.settore;
    }

    get diocesiComunita() {
        return this.isDemo ? DEMO_COMUNITA.diocesi : COMUNITA_PILOTA.diocesi;
    }

    get membriFiltrati() {
        const query = this.ricerca.trim().toLowerCase();
        return this.membri.filter((membro) => {
            const matchQuery = !query || membro.nome.toLowerCase().includes(query) || membro.cognome.toLowerCase().includes(query) || membro.nomeCompleto.toLowerCase().includes(query);
            const matchRuolo = !this.ruoloFiltro || membro.ruolo === this.ruoloFiltro;
            return matchQuery && matchRuolo;
        });
    }

    get conteggiRuolo() {
        return this.ruoliFiltro.map((ruolo) => ({
            ruolo,
            totale: this.membri.filter((membro) => membro.ruolo === ruolo).length
        }));
    }

    get membriDaInviare() {
        return this.membri.filter((membro) => membro.consensoPrivacyStato === 'Da inviare' || membro.consensoPrivacyStato === 'Da raccogliere');
    }

    get membriSelezionatiInvio() {
        return this.membriDaInviare;
    }

    get membriConEmailSelezionati() {
        return this.membriSelezionatiInvio.filter((membro) => membro.email);
    }

    get membriSenzaEmailSelezionati() {
        return this.membriSelezionatiInvio.filter((membro) => !membro.email);
    }

    get membriEsclusiInvio() {
        return this.membri.filter((membro) => !this.membriSelezionatiInvio.some((selected) => selected.id === membro.id));
    }

    toggleForm() {
        if (this.formVisibile) {
            this.annullaForm();
            return;
        }
        this.formVisibile = true;
    }

    salvaMembro() {
        const membro = {
            ...this.form,
            nome: this.form.nome.trim(),
            cognome: this.form.cognome.trim(),
            nomeCompleto: `${this.form.nome.trim()} ${this.form.cognome.trim()}`.trim(),
            email: '',
            dataInvioModuloPrivacy: this.form.consensoPrivacyStato === 'Inviato' ? this.oggiIso() : '',
            note: this.form.note.trim()
        };

        if (this.membroInModifica) {
            this.membri = this.membri.map((item) => (item.id === this.membroInModifica?.id ? { ...membro, id: item.id } : item));
        } else {
            this.membri = [...this.membri, { ...membro, id: this.prossimoId++ }];
        }

        this.annullaForm();
    }

    modificaMembro(membro: MembroComunitaPilota) {
        this.membroInModifica = membro;
        this.form = {
            nome: membro.nome,
            cognome: membro.cognome,
            ruolo: membro.ruolo === 'Presbitero' ? 'Fratello' : membro.ruolo,
            accessoApp: membro.accessoApp,
            statoMembro: membro.statoMembro,
            consensoPrivacyStato: membro.consensoPrivacyStato,
            moduloPrivacyInviato: membro.moduloPrivacyInviato,
            moduloPrivacyRicevuto: membro.moduloPrivacyRicevuto,
            note: membro.note
        };
        this.formVisibile = true;
    }

    apriModificaRuolo(membro: MembroComunitaPilota) {
        this.ruoloModalMembro = membro;
        this.nuovoRuolo = membro.ruolo === 'Presbitero' ? 'Fratello' : membro.ruolo;
    }

    salvaRuolo() {
        if (!this.ruoloModalMembro) {
            return;
        }
        this.membri = this.membri.map((membro) => (membro.id === this.ruoloModalMembro?.id ? { ...membro, ruolo: this.nuovoRuolo } : membro));
        this.messaggio = 'Ruolo aggiornato';
        this.chiudiModali();
    }

    apriModificaPrivacy(membro: MembroComunitaPilota) {
        this.privacyModalMembro = membro;
        this.nuovaPrivacy = membro.consensoPrivacyStato;
        this.privacyModuloRicevuto = membro.moduloPrivacyRicevuto;
    }

    salvaPrivacy() {
        if (!this.privacyModalMembro) {
            return;
        }
        this.membri = this.membri.map((membro) =>
            membro.id === this.privacyModalMembro?.id
                ? {
                      ...membro,
                      consensoPrivacyStato: this.nuovaPrivacy,
                      moduloPrivacyRicevuto: this.privacyModuloRicevuto
                  }
                : membro
        );
        this.messaggio = 'Privacy aggiornata';
        this.chiudiModali();
    }

    apriModificaTappa() {
        this.nuovaTappa = this.tappaCammino;
        this.tappaModalAperta = true;
    }

    salvaTappa() {
        this.tappaCammino = this.nuovaTappa;
        this.messaggio = 'Tappa aggiornata';
        this.chiudiModali();
    }

    apriInvioPrivacy(membro: MembroComunitaPilota) {
        this.privacyInvioMembro = membro;
        this.invioMassivo = false;
        this.privacyInvioAperto = true;
    }

    apriInvioPrivacyMassivo() {
        this.privacyInvioMembro = null;
        this.invioMassivo = true;
        this.privacyInvioAperto = true;
    }

    apriAnteprimaPrivacy(membro: MembroComunitaPilota) {
        this.anteprimaMembro = membro;
    }

    confermaInvioPrivacy() {
        const dataInvioModuloPrivacy = this.oggiIso();
        const ids = this.invioMassivo ? this.membriSelezionatiInvio.map((membro) => membro.id) : this.privacyInvioMembro ? [this.privacyInvioMembro.id] : [];
        this.membri = this.membri.map((membro) =>
            ids.includes(membro.id)
                ? {
                      ...membro,
                      consensoPrivacyStato: 'Inviato',
                      moduloPrivacyInviato: true,
                      dataInvioModuloPrivacy
                  }
                : membro
        );
        this.messaggio = this.invioMassivo ? `Invio mock completato: ${ids.length} moduli segnati come inviati` : 'Modulo privacy segnato come inviato';
        this.chiudiModali();
    }

    copiaLinkPrivacy(membro: MembroComunitaPilota) {
        const link = this.linkPrivacy(membro);
        navigator.clipboard?.writeText(link);
        this.messaggio = 'Link modulo privacy copiato in modalità mock';
    }

    linkPrivacy(membro: MembroComunitaPilota) {
        return `${window.location.origin}/gestionale-cn/privacy/compila?membroId=${membro.id}`;
    }

    eliminaMembro(id: number) {
        this.membri = this.membri.filter((membro) => membro.id !== id);
        if (this.membroInModifica?.id === id) {
            this.annullaForm();
        }
    }

    chiudiModali() {
        this.ruoloModalMembro = null;
        this.privacyModalMembro = null;
        this.privacyInvioAperto = false;
        this.privacyInvioMembro = null;
        this.invioMassivo = false;
        this.anteprimaMembro = null;
        this.tappaModalAperta = false;
    }

    annullaForm() {
        this.form = this.creaFormVuoto();
        this.membroInModifica = null;
        this.formVisibile = false;
    }

    getRuoloClass(ruolo: RuoloComunitaPilota) {
        return `role-${ruolo.toLowerCase()}`;
    }

    getAccessoSeverity(accesso: AccessoApp) {
        switch (accesso) {
            case 'Attivo':
                return 'success';
            case 'Invitato':
                return 'info';
            case 'In attesa':
                return 'warn';
            default:
                return 'secondary';
        }
    }

    getStatoSeverity(stato: StatoMembro) {
        switch (stato) {
            case 'Attivo':
                return 'success';
            case 'Temporaneamente assente':
                return 'warn';
            default:
                return 'info';
        }
    }

    getPrivacySeverity(stato: ConsensoPrivacyPilota) {
        switch (stato) {
            case 'Raccolto':
                return 'success';
            case 'Inviato':
                return 'info';
            case 'Da inviare':
            case 'Da raccogliere':
                return 'warn';
            case 'Negato':
            case 'Revocato':
                return 'danger';
            default:
                return 'secondary';
        }
    }

    getPrivacyClass(stato: ConsensoPrivacyPilota) {
        return `privacy-${stato.toLowerCase().replace(/\s+/g, '-')}`;
    }

    private creaMembriDemo(): MembroComunitaPilota[] {
        return DEMO_MEMBRI.map((membro, index) => ({
            id: index + 1,
            nome: membro.nome,
            cognome: membro.cognome,
            nomeCompleto: `${membro.nome} ${membro.cognome}`,
            ruolo: membro.ruolo === 'Catechista' ? 'Fratello' : (membro.ruolo as MembroComunitaPilota['ruolo']),
            accessoApp: membro.accessoApp as AccessoApp,
            statoMembro: membro.stato as StatoMembro,
            consensoPrivacyStato: membro.privacy as ConsensoPrivacyPilota,
            moduloPrivacyInviato: membro.privacy === 'Raccolto',
            moduloPrivacyRicevuto: membro.privacy === 'Raccolto',
            dataInvioModuloPrivacy: '',
            email: '',
            note: 'Dato dimostrativo'
        }));
    }

    private creaFormVuoto(): MembroForm {
        return {
            nome: '',
            cognome: '',
            ruolo: 'Fratello',
            accessoApp: 'Nessuno',
            statoMembro: 'Attivo',
            consensoPrivacyStato: 'Da inviare',
            moduloPrivacyInviato: false,
            moduloPrivacyRicevuto: false,
            note: ''
        };
    }

    private oggiIso() {
        return new Date().toISOString().slice(0, 10);
    }
}
