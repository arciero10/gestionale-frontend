import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import {
    COMUNITA_PILOTA,
    EQUIPE_CATECHISTI_UNITA_PILOTA,
    MEMBRI_COMUNITA_PILOTA,
    ConsensoPrivacyPilota,
    EquipeCatechistiUnita,
    MembroComunitaPilota,
    RuoloComunitaPilota,
    RuoloOperativoComunita,
    TipoUnitaEquipeCatechisti,
    TipoUnitaMembroComunita
} from '../data/comunita-pilota.mock';
import { DEMO_COMUNITA, DEMO_MEMBRI } from '../../demo/demo.mock';
import { PRIVACY_CONSENTS_DRAFT, PRIVACY_POLICY_DRAFT_DATA_ITEMS, PRIVACY_POLICY_DRAFT_PARAGRAPHS, PRIVACY_POLICY_DRAFT_TITLE } from '../privacy/privacy-policy-draft';

type StatoMembro = MembroComunitaPilota['statoMembro'];
type AccessoApp = MembroComunitaPilota['accessoApp'];
type MembroForm = Pick<MembroComunitaPilota, 'nome' | 'cognome' | 'ruolo' | 'telefono' | 'email' | 'accessoApp' | 'statoMembro' | 'consensoPrivacyStato' | 'moduloPrivacyInviato' | 'moduloPrivacyRicevuto' | 'note'>;

@Component({
    selector: 'app-comunita',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink, ButtonModule, InputTextModule, SelectModule, TableModule, TagModule, TextareaModule],
    template: `
        <div class="community-page">
            <header class="page-heading">
                <div>
                    <h1>La tua ComunitÃ </h1>
                    <p>Anagrafica comunitÃ  e gestione iniziale dei consensi.</p>
                </div>
                <button pButton type="button" [icon]="formVisibile ? 'pi pi-times' : 'pi pi-user-plus'" [label]="formVisibile ? 'Annulla' : 'Aggiungi membro'" (click)="toggleForm()"></button>
            </header>

            <section class="identity-card">
                <div>
                    <span>ComunitÃ  associata</span>
                    <h2>{{ nomeComunita }}</h2>
                    <p>{{ parrocchiaComunita }}</p>
                </div>
                <div class="identity-meta">
                    <small>{{ isDemo ? 'I dati mostrati sono dimostrativi.' : 'Questi dati sono visibili solo nellâ€™ambiente autenticato.' }}</small>
                    @if (!isDemo) {
                        <a class="preview-link" routerLink="/gestionale-cn/onboarding-comunita-preview">Anteprima primo accesso utente</a>
                    }
                </div>
            </section>

            @if (!isDemo) {
                <section class="catechisti-card">
                    <div class="section-title">
                        <div>
                            <span>Riferimenti collegati</span>
                            <h2>Equipe dei catechisti</h2>
                            <p>Specchietto separato: non sono inclusi nei conteggi dei membri operativi.</p>
                            @if (!haCapoEquipe) {
                                <small>Capo equipe non ancora indicato</small>
                            }
                        </div>
                        <strong>{{ equipeCatechisti.length }}</strong>
                    </div>
                    <div class="catechisti-grid">
                        @for (unita of equipeCatechisti; track unita.id) {
                            <article>
                                <strong>{{ unita.nomeVisualizzato }}</strong>
                                @if (unita.capoEquipe) {
                                    <div class="unit-badges">
                                        <span class="role-badge role-responsabile">Capo equipe</span>
                                    </div>
                                }
                                <dl class="contact-list">
                                    <div><dt>Telefono</dt><dd>{{ displayContact(unita.telefono) }}</dd></div>
                                    <div><dt>Email</dt><dd>{{ displayContact(unita.email) }}</dd></div>
                                </dl>
                                <div class="unit-actions">
                                    <button pButton type="button" label="Modifica contatti" icon="pi pi-address-book" severity="secondary" outlined (click)="apriModificaContattiEquipe(unita)"></button>
                                    <button pButton type="button" label="Modifica unità" icon="pi pi-pencil" severity="info" outlined (click)="apriModificaUnitaEquipe(unita)"></button>
                                </div>
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
                        @if (!membroInModifica) {
                            <div>
                                <label for="tipoInserimentoMembro">Tipo inserimento</label>
                                <p-select inputId="tipoInserimentoMembro" name="tipoInserimentoMembro" appendTo="body" panelStyleClass="modal-dropdown-panel" [options]="tipiInserimentoMembro" [(ngModel)]="tipoInserimentoMembro" required></p-select>
                            </div>
                            @if (tipoInserimentoMembro === 'Coppia') {
                                <div>
                                    <label for="nomeMarito">Nome marito</label>
                                    <input id="nomeMarito" name="nomeMarito" pInputText [(ngModel)]="nuovoMembroMinimo.nomeMarito" required />
                                </div>
                                <div>
                                    <label for="cognomeMarito">Cognome marito</label>
                                    <input id="cognomeMarito" name="cognomeMarito" pInputText [(ngModel)]="nuovoMembroMinimo.cognomeMarito" required />
                                </div>
                                <div>
                                    <label for="nomeMoglie">Nome moglie</label>
                                    <input id="nomeMoglie" name="nomeMoglie" pInputText [(ngModel)]="nuovoMembroMinimo.nomeMoglie" required />
                                </div>
                                <div>
                                    <label for="cognomeMoglie">Cognome moglie</label>
                                    <input id="cognomeMoglie" name="cognomeMoglie" pInputText [(ngModel)]="nuovoMembroMinimo.cognomeMoglie" required />
                                </div>
                                <div>
                                    <label for="emailRiferimentoCoppia">Email di riferimento coppia</label>
                                    <input id="emailRiferimentoCoppia" name="emailRiferimentoCoppia" pInputText type="email" [(ngModel)]="nuovoMembroMinimo.emailRiferimento" />
                                </div>
                            } @else {
                                <div>
                                    <label for="nomeMinimo">Nome</label>
                                    <input id="nomeMinimo" name="nomeMinimo" pInputText [(ngModel)]="nuovoMembroMinimo.nome" required />
                                </div>
                                <div>
                                    <label for="cognomeMinimo">Cognome</label>
                                    <input id="cognomeMinimo" name="cognomeMinimo" pInputText [(ngModel)]="nuovoMembroMinimo.cognome" required />
                                </div>
                                <div>
                                    <label for="emailRiferimentoSingolo">Email</label>
                                    <input id="emailRiferimentoSingolo" name="emailRiferimentoSingolo" pInputText type="email" [(ngModel)]="nuovoMembroMinimo.emailRiferimento" />
                                </div>
                            }
                            <p class="form-helper">Censimento minimo: il completamento di anagrafica e consensi resta individuale e avverrà tramite modulo personale.</p>
                        } @else {
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
                            <p-select inputId="ruolo" name="ruolo" appendTo="body" panelStyleClass="modal-dropdown-panel" [options]="ruoliForm" [(ngModel)]="form.ruolo" required></p-select>
                        </div>
                        <div>
                            <label for="telefono">Telefono</label>
                            <input id="telefono" name="telefono" pInputText [(ngModel)]="form.telefono" />
                        </div>
                        <div>
                            <label for="email">Email</label>
                            <input id="email" name="email" pInputText type="email" [(ngModel)]="form.email" />
                        </div>
                        <div>
                            <label for="accessoApp">Accesso app</label>
                            <p-select inputId="accessoApp" name="accessoApp" appendTo="body" panelStyleClass="modal-dropdown-panel" [options]="accessiApp" [(ngModel)]="form.accessoApp"></p-select>
                        </div>
                        <div>
                            <label for="statoMembro">Stato</label>
                            <p-select inputId="statoMembro" name="statoMembro" appendTo="body" panelStyleClass="modal-dropdown-panel" [options]="statiMembro" [(ngModel)]="form.statoMembro"></p-select>
                        </div>
                        <div>
                            <label for="consensoPrivacyStato">Privacy</label>
                            <p-select inputId="consensoPrivacyStato" name="consensoPrivacyStato" appendTo="body" panelStyleClass="modal-dropdown-panel" [options]="statiPrivacy" [(ngModel)]="form.consensoPrivacyStato"></p-select>
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
                        }
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
                    <p-select inputId="filtroRuolo" appendTo="body" panelStyleClass="modal-dropdown-panel" [options]="ruoliFiltro" [(ngModel)]="ruoloFiltro" [showClear]="true" placeholder="Tutti i ruoli"></p-select>
                </div>
                <button pButton type="button" icon="pi pi-send" label="Invia moduli privacy mancanti" severity="success" outlined (click)="apriInvioPrivacyMassivo()"></button>
                <div class="totals">
                    <strong>{{ membriFiltrati.length }}</strong>
                    <span>membri visualizzati su {{ membri.length }}</span>
                    @if (!isDemo) {
                        <small>Equipe dei catechisti: {{ equipeCatechisti.length }}</small>
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
                            <strong>Membri comunitÃ </strong>
                            <span>{{ membri.length }} membri totali</span>
                        </div>
                    </ng-template>
                    <ng-template #header>
                        <tr>
                            <th>Nome</th>
                            <th>Cognome</th>
                            <th>Ruolo</th>
                            <th>Telefono</th>
                            <th>Email</th>
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
                            <td>{{ displayContact(membro.telefono) }}</td>
                            <td>{{ displayContact(membro.email) }}</td>
                            <td><p-tag [value]="membro.accessoApp" [severity]="getAccessoSeverity(membro.accessoApp)" /></td>
                            <td><span class="privacy-badge" [ngClass]="getPrivacyClass(membro.consensoPrivacyStato)">{{ membro.consensoPrivacyStato }}</span></td>
                            <td><p-tag [value]="membro.statoMembro" [severity]="getStatoSeverity(membro.statoMembro)" /></td>
                            <td>
                                <div class="row-actions">
                                    <button pButton type="button" label="Modifica ruolo" icon="pi pi-user-edit" severity="info" text (click)="apriModificaRuolo(membro)"></button>
                                    <button pButton type="button" label="Modifica contatti" icon="pi pi-address-book" severity="secondary" text (click)="apriModificaContattiMembro(membro)"></button>
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
                            <td colspan="9">Nessun membro trovato con i filtri attuali.</td>
                        </tr>
                    </ng-template>
                </p-table>
            </section>

            <section class="member-cards" aria-label="Membri comunitÃ ">
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
                            <div><dt>Telefono</dt><dd>{{ displayContact(membro.telefono) }}</dd></div>
                            <div><dt>Email</dt><dd>{{ displayContact(membro.email) }}</dd></div>
                            <div><dt>Accesso app</dt><dd>{{ membro.accessoApp }}</dd></div>
                            <div><dt>Privacy</dt><dd><span class="privacy-badge" [ngClass]="getPrivacyClass(membro.consensoPrivacyStato)">{{ membro.consensoPrivacyStato }}</span></dd></div>
                            <div><dt>Modulo inviato</dt><dd>{{ membro.moduloPrivacyInviato ? 'SÃ¬' : 'No' }}</dd></div>
                            <div><dt>Modulo ricevuto</dt><dd>{{ membro.moduloPrivacyRicevuto ? 'SÃ¬' : 'No' }}</dd></div>
                        </dl>
                        <div class="card-actions">
                            <button pButton type="button" icon="pi pi-user-edit" label="Modifica ruolo" severity="info" outlined (click)="apriModificaRuolo(membro)"></button>
                            <button pButton type="button" icon="pi pi-address-book" label="Contatti" severity="secondary" outlined (click)="apriModificaContattiMembro(membro)"></button>
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
                        <p-select inputId="nuovoRuolo" appendTo="body" panelStyleClass="modal-dropdown-panel" [options]="ruoliOperativi" [(ngModel)]="nuovoRuolo"></p-select>
                        <footer>
                            <button pButton type="button" label="Annulla" severity="secondary" outlined (click)="chiudiModali()"></button>
                            <button pButton type="button" label="Salva ruolo" icon="pi pi-check" (click)="salvaRuolo()"></button>
                        </footer>
                    </section>
                </div>
            }

            @if (contattiModalMembro || contattiModalCatechista) {
                <div class="modal-backdrop" role="presentation" (click)="chiudiModali()">
                    <section class="app-modal" role="dialog" aria-modal="true" aria-label="Modifica contatti" (click)="$event.stopPropagation()">
                        <header>
                            <span>Modifica contatti</span>
                            <h2>{{ contattiNome }}</h2>
                        </header>
                        <p class="privacy-warning">I contatti personali sono visibili solo agli utenti autorizzati del gestionale.</p>
                        <label for="telefonoContatto">Telefono</label>
                        <input id="telefonoContatto" pInputText [(ngModel)]="telefonoContatto" />
                        <label for="emailContatto">Email</label>
                        <input id="emailContatto" pInputText type="email" [(ngModel)]="emailContatto" />
                        <footer>
                            <button pButton type="button" label="Annulla" severity="secondary" outlined (click)="chiudiModali()"></button>
                            <button pButton type="button" label="Salva contatti" icon="pi pi-check" (click)="salvaContatti()"></button>
                        </footer>
                    </section>
                </div>
            }

            @if (unitaEquipeModal) {
                <div class="modal-backdrop" role="presentation" (click)="chiudiModali()">
                    <section class="app-modal app-modal-wide" role="dialog" aria-modal="true" aria-label="Modifica unità equipe" (click)="$event.stopPropagation()">
                        <header>
                            <span>Equipe dei catechisti</span>
                            <h2>Modifica unità</h2>
                        </header>
                        <label for="tipoUnitaEquipe">Tipo unità</label>
                        <p-select inputId="tipoUnitaEquipe" appendTo="body" panelStyleClass="modal-dropdown-panel" [options]="tipiUnitaEquipe" [(ngModel)]="tipoUnitaEquipe"></p-select>
                        <label for="nomeVisualizzatoEquipe">Nome visualizzato</label>
                        <input id="nomeVisualizzatoEquipe" pInputText [(ngModel)]="nomeVisualizzatoEquipe" />
                        <label for="telefonoEquipe">Telefono di riferimento</label>
                        <input id="telefonoEquipe" pInputText [(ngModel)]="telefonoEquipe" />
                        <label for="emailEquipe">Email di riferimento</label>
                        <input id="emailEquipe" pInputText type="email" [(ngModel)]="emailEquipe" />
                        <label class="check-row">
                            <input type="checkbox" [(ngModel)]="capoEquipeUnita" />
                            Capo equipe
                        </label>
                        <label for="noteEquipe">Note</label>
                        <textarea id="noteEquipe" pTextarea rows="3" [(ngModel)]="noteEquipe"></textarea>
                        <footer>
                            <button pButton type="button" label="Annulla" severity="secondary" outlined (click)="chiudiModali()"></button>
                            <button pButton type="button" label="Salva unità" icon="pi pi-check" (click)="salvaUnitaEquipe()"></button>
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
                        <p-select inputId="nuovaPrivacy" appendTo="body" panelStyleClass="modal-dropdown-panel" [options]="statiPrivacy" [(ngModel)]="nuovaPrivacy"></p-select>
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

            @if (privacyInvioAperto) {
                <div class="modal-backdrop" role="presentation" (click)="chiudiModali()">
                    <section class="app-modal app-modal-wide" role="dialog" aria-modal="true" aria-label="Invia modulo privacy" (click)="$event.stopPropagation()">
                        <header>
                            <span>Invio modulo privacy</span>
                            <h2>{{ invioMassivo ? 'Moduli privacy mancanti' : privacyInvioMembro?.nomeCompleto }}</h2>
                        </header>
                        <p>Il fratello riceverÃ  un link personale per completare i propri dati e consensi. Lâ€™invio reale sarÃ  collegato al backend email in una fase successiva.</p>
                        @if (!invioMassivo && privacyInvioMembro) {
                            <div class="email-preview">
                                <strong>Destinatario</strong>
                                <span>{{ privacyInvioMembro.email || 'Email mancante' }}</span>
                            </div>
                        }
                        @if (invioMassivo) {
                            <div class="email-preview">
                                <strong>{{ membriSelezionatiInvio.length }} moduli selezionati</strong>
                                <span>Con email: {{ membriConEmailSelezionati.length }} Â· Senza email: {{ membriSenzaEmailSelezionati.length }} Â· Esclusi: {{ membriEsclusiInvio.length }}</span>
                            </div>
                        }
                        <div class="mock-email">
                            <strong>Oggetto</strong>
                            <p>Modulo privacy â€“ Gestionale ComunitÃ </p>
                            <strong>Testo email mock</strong>
                            <p>Pace. Ti inviamo il link personale per leggere lâ€™informativa privacy e completare i consensi necessari alla gestione della comunitÃ  e delle convivenze.</p>
                            @if (!invioMassivo && privacyInvioMembro) {
                                <strong>Link personale mock</strong>
                                <code>{{ linkPrivacy(privacyInvioMembro) }}</code>
                            }
                        </div>
                        <p class="privacy-warning">Bozza ambiente test. Lâ€™invio email reale sarÃ  collegato al backend in una fase successiva.</p>
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

            .unit-badges,
            .unit-actions {
                display: flex;
                flex-wrap: wrap;
                gap: 0.45rem;
            }

            .unit-members {
                margin: 0;
                padding-left: 1.1rem;
                color: #334155;
                line-height: 1.45;
            }

            .unit-actions button {
                min-height: 40px;
            }

            .contact-list {
                display: grid;
                gap: 0.35rem;
                margin: 0;
            }

            .contact-list div {
                display: grid;
                gap: 0.1rem;
            }

            .contact-list dt {
                color: #64748b;
                font-size: 0.75rem;
                font-weight: 800;
            }

            .contact-list dd {
                margin: 0;
                color: #111827;
                font-weight: 700;
                overflow-wrap: anywhere;
            }

            .preview-link {
                color: #17335f;
                font-size: 0.85rem;
                font-weight: 800;
                text-decoration: none;
            }

            .preview-link:hover {
                text-decoration: underline;
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
            .form-helper,
            .form-actions {
                grid-column: 1 / -1;
            }

            .form-helper {
                margin: 0;
                color: #64748b;
                line-height: 1.45;
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
                overflow: visible;
            }

            :host ::ng-deep .modal-dropdown-panel {
                z-index: 12000 !important;
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
    tipiUnitaEquipe: TipoUnitaEquipeCatechisti[] = ['Coppia', 'Fratello singolo', 'Sorella singola'];
    tipiInserimentoMembro: TipoUnitaMembroComunita[] = ['Coppia', 'Fratello singolo', 'Sorella singola'];

    ricerca = '';
    ruoloFiltro: Exclude<RuoloComunitaPilota, 'Catechista'> | null = null;
    formVisibile = false;
    membroInModifica: MembroComunitaPilota | null = null;
    tipoInserimentoMembro: TipoUnitaMembroComunita = 'Fratello singolo';
    nuovoMembroMinimo = this.creaNuovoMembroMinimo();
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
    contattiModalMembro: MembroComunitaPilota | null = null;
    contattiModalCatechista: EquipeCatechistiUnita | null = null;
    unitaEquipeModal: EquipeCatechistiUnita | null = null;
    tipoUnitaEquipe: TipoUnitaEquipeCatechisti = 'Coppia';
    nomeVisualizzatoEquipe = '';
    telefonoEquipe = '';
    emailEquipe = '';
    capoEquipeUnita = false;
    noteEquipe = '';
    telefonoContatto = '';
    emailContatto = '';
    policyTitle = PRIVACY_POLICY_DRAFT_TITLE;
    policyParagraphs = PRIVACY_POLICY_DRAFT_PARAGRAPHS;
    policyDataItems = PRIVACY_POLICY_DRAFT_DATA_ITEMS;
    policyConsents = PRIVACY_CONSENTS_DRAFT;

    equipeCatechisti: EquipeCatechistiUnita[] = this.isDemo ? [] : EQUIPE_CATECHISTI_UNITA_PILOTA.map((unita) => ({ ...unita, membri: unita.membri.map((membro) => ({ ...membro })) }));
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

    get contattiNome() {
        if (this.contattiModalMembro) {
            return this.contattiModalMembro.nomeCompleto;
        }

        if (this.contattiModalCatechista) {
            return this.contattiModalCatechista.nomeVisualizzato;
        }

        return '';
    }

    get haCapoEquipe() {
        return this.equipeCatechisti.some((unita) => unita.capoEquipe);
    }

    toggleForm() {
        if (this.formVisibile) {
            this.annullaForm();
            return;
        }
        this.formVisibile = true;
    }

    salvaMembro() {
        if (!this.membroInModifica) {
            this.salvaCensimentoMinimo();
            return;
        }

        const membro = {
            ...this.form,
            nome: this.form.nome.trim(),
            cognome: this.form.cognome.trim(),
            nomeCompleto: `${this.form.nome.trim()} ${this.form.cognome.trim()}`.trim(),
            telefono: this.form.telefono.trim(),
            email: this.form.email.trim(),
            dataInvioModuloPrivacy: this.form.consensoPrivacyStato === 'Inviato' ? this.oggiIso() : '',
            note: this.form.note.trim()
        };

        this.membri = this.membri.map((item) => (item.id === this.membroInModifica?.id ? { ...membro, id: item.id } : item));
        this.annullaForm();
    }

    modificaMembro(membro: MembroComunitaPilota) {
        this.membroInModifica = membro;
        this.form = {
            nome: membro.nome,
            cognome: membro.cognome,
            ruolo: membro.ruolo === 'Presbitero' ? 'Fratello' : membro.ruolo,
            telefono: membro.telefono,
            email: membro.email,
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

    apriModificaContattiMembro(membro: MembroComunitaPilota) {
        this.contattiModalMembro = membro;
        this.contattiModalCatechista = null;
        this.telefonoContatto = membro.telefono;
        this.emailContatto = membro.email;
    }

    apriModificaContattiEquipe(unita: EquipeCatechistiUnita) {
        this.contattiModalCatechista = unita;
        this.contattiModalMembro = null;
        this.telefonoContatto = unita.telefono;
        this.emailContatto = unita.email;
    }

    apriModificaUnitaEquipe(unita: EquipeCatechistiUnita) {
        this.unitaEquipeModal = unita;
        this.tipoUnitaEquipe = unita.tipoUnita;
        this.nomeVisualizzatoEquipe = unita.nomeVisualizzato;
        this.telefonoEquipe = unita.telefono;
        this.emailEquipe = unita.email;
        this.capoEquipeUnita = unita.capoEquipe;
        this.noteEquipe = unita.note;
    }

    salvaContatti() {
        const telefono = this.telefonoContatto.trim();
        const email = this.emailContatto.trim();

        if (this.contattiModalMembro) {
            this.membri = this.membri.map((membro) => (membro.id === this.contattiModalMembro?.id ? { ...membro, telefono, email } : membro));
        }

        if (this.contattiModalCatechista) {
            this.equipeCatechisti = this.equipeCatechisti.map((unita) => (unita.id === this.contattiModalCatechista?.id ? { ...unita, telefono, email } : unita));
        }

        this.messaggio = 'Contatti aggiornati';
        this.chiudiModali();
    }

    salvaUnitaEquipe() {
        if (!this.unitaEquipeModal) {
            return;
        }

        this.equipeCatechisti = this.equipeCatechisti.map((unita) =>
            unita.id === this.unitaEquipeModal?.id
                ? {
                      ...unita,
                      tipoUnita: this.tipoUnitaEquipe,
                      nomeVisualizzato: this.nomeVisualizzatoEquipe.trim() || unita.nomeVisualizzato,
                      telefono: this.telefonoEquipe.trim(),
                      email: this.emailEquipe.trim(),
                      capoEquipe: this.capoEquipeUnita,
                      note: this.noteEquipe.trim()
                  }
                : this.capoEquipeUnita
                  ? { ...unita, capoEquipe: false }
                  : unita
        );
        this.messaggio = 'Unità equipe aggiornata';
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
        this.messaggio = 'Link modulo privacy copiato in modalitÃ  mock';
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
        this.contattiModalMembro = null;
        this.contattiModalCatechista = null;
        this.telefonoContatto = '';
        this.emailContatto = '';
        this.unitaEquipeModal = null;
        this.nomeVisualizzatoEquipe = '';
        this.telefonoEquipe = '';
        this.emailEquipe = '';
        this.capoEquipeUnita = false;
        this.noteEquipe = '';
    }

    annullaForm() {
        this.form = this.creaFormVuoto();
        this.tipoInserimentoMembro = 'Fratello singolo';
        this.nuovoMembroMinimo = this.creaNuovoMembroMinimo();
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

    displayContact(value: string) {
        return value?.trim() || 'Da inserire';
    }

    private salvaCensimentoMinimo() {
        const email = this.nuovoMembroMinimo.emailRiferimento.trim();
        const noteCensimento = this.tipoInserimentoMembro === 'Coppia'
            ? 'Censimento minimo di coppia: i consensi privacy restano individuali.'
            : 'Censimento minimo: anagrafica e consensi da completare tramite modulo personale.';

        const nuoviMembri =
            this.tipoInserimentoMembro === 'Coppia'
                ? [
                      this.creaMembroMinimo(this.nuovoMembroMinimo.nomeMarito, this.nuovoMembroMinimo.cognomeMarito, email, noteCensimento),
                      this.creaMembroMinimo(this.nuovoMembroMinimo.nomeMoglie, this.nuovoMembroMinimo.cognomeMoglie, email, noteCensimento)
                  ]
                : [this.creaMembroMinimo(this.nuovoMembroMinimo.nome, this.nuovoMembroMinimo.cognome, email, noteCensimento)];

        this.membri = [...this.membri, ...nuoviMembri];
        this.messaggio = this.tipoInserimentoMembro === 'Coppia' ? 'Coppia censita in modalità mock' : 'Membro censito in modalità mock';
        this.annullaForm();
    }

    private creaMembroMinimo(nome: string, cognome: string, email: string, note: string): MembroComunitaPilota {
        const nomePulito = nome.trim();
        const cognomePulito = cognome.trim();
        return {
            id: this.prossimoId++,
            nome: nomePulito,
            cognome: cognomePulito,
            nomeCompleto: `${nomePulito} ${cognomePulito}`.trim(),
            ruolo: 'Fratello',
            accessoApp: 'Nessuno',
            statoMembro: 'Attivo',
            consensoPrivacyStato: 'Da inviare',
            moduloPrivacyInviato: false,
            moduloPrivacyRicevuto: false,
            dataInvioModuloPrivacy: '',
            telefono: '',
            email,
            note
        };
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
            telefono: '',
            email: '',
            note: 'Dato dimostrativo'
        }));
    }

    private creaFormVuoto(): MembroForm {
        return {
            nome: '',
            cognome: '',
            ruolo: 'Fratello',
            telefono: '',
            email: '',
            accessoApp: 'Nessuno',
            statoMembro: 'Attivo',
            consensoPrivacyStato: 'Da inviare',
            moduloPrivacyInviato: false,
            moduloPrivacyRicevuto: false,
            note: ''
        };
    }

    private creaNuovoMembroMinimo() {
        return {
            nome: '',
            cognome: '',
            nomeMarito: '',
            cognomeMarito: '',
            nomeMoglie: '',
            cognomeMoglie: '',
            emailRiferimento: ''
        };
    }

    private oggiIso() {
        return new Date().toISOString().slice(0, 10);
    }
}
