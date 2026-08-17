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
    EQUIPE_CATECHISTI_UNITA_PILOTA,
    MEMBRI_COMUNITA_PILOTA,
    UNITA_MEMBRI_COMUNITA_PILOTA,
    ConsensoPrivacyPilota,
    EquipeCatechistiUnita,
    MembroComunitaPilota,
    UnitaMembroComunita,
    normalizeCarismaComunitario,
    RuoloComunitaPilota,
    RuoloOperativoComunita,
    TipoUnitaEquipeCatechisti,
    TipoUnitaMembroComunita
} from '../data/comunita-pilota.mock';
import { DEMO_COMUNITA, DEMO_MEMBRI } from '../../demo/demo.mock';
import { getCurrentCommunity } from '../data/community-selection.storage';
import { NUMERI_COMUNITA, PARROCCHIE_MOCK } from '../data/anagrafica-ecclesiale.mock';
import { Carisma, getPermessiByCarismi, normalizeCarismaForPermissions } from '../data/permessi-carisma.mock';
import { PRIVACY_CONFIG } from '../data/privacy-config.mock';
import { PRIVACY_CONSENTS_DRAFT, PRIVACY_POLICY_DRAFT_DATA_ITEMS, PRIVACY_POLICY_DRAFT_PARAGRAPHS, PRIVACY_POLICY_DRAFT_TITLE } from '../privacy/privacy-policy-draft';
import { UnitaCensimentoComunita, leggiUnitaCensimento } from '../censimento-comunita/censimento-comunita.storage';
import { canPerformAction, getUserAccessContext } from '../data/access-policy.mock';
import {
    CommunityMemberMock,
    addManualCommunityMember,
    inviteCommunityMember,
    readCommunityMembers,
    resendInvite
} from '../data/community-members.mock';

type StatoMembro = MembroComunitaPilota['statoMembro'];
type AccessoApp = MembroComunitaPilota['accessoApp'];
type MembroForm = Pick<MembroComunitaPilota, 'nome' | 'cognome' | 'ruolo' | 'telefono' | 'indirizzo' | 'email' | 'accessoApp' | 'statoMembro' | 'consensoPrivacyStato' | 'moduloPrivacyInviato' | 'moduloPrivacyRicevuto' | 'note'>;
type CensimentoFratelloMode = 'censisci' | 'invita' | null;
type PermessoOperativoRichiedibile = 'Collaboratore convivenze' | 'Collaboratore segreteria' | 'Supporto privacy/moduli' | 'Supporto anagrafica';
type StatoRichiestaPermesso = 'In attesa approvazione responsabile' | 'Approvata' | 'Rifiutata';

interface FratelloQuickForm {
    nome: string;
    cognome: string;
    email: string;
    telefono: string;
    dataNascita: string;
    ruoloComunitario: MembroComunitaPilota['ruolo'];
    note: string;
}

interface RichiestaPermessoOperativo {
    id: string;
    personaId: string;
    nome: string;
    cognome: string;
    comunita: string;
    permessoRichiesto: PermessoOperativoRichiedibile;
    motivazione: string;
    stato: StatoRichiestaPermesso;
    dataRichiesta: string;
    dataEsito?: string;
}

const RICHIESTE_PERMESSI_OPERATIVI_KEY = 'richieste-permessi-operativi';
const PUBLIC_INVITE_BASE_URL = 'https://test.eventidicomunita.it';

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
                <div class="heading-actions">
                    @if (!isDemo) {
                        @if (canCensireComunita) {
                            <a pButton routerLink="/gestionale-cn/censimento-comunita" icon="pi pi-list-check" label="Censisci comunità" severity="secondary" outlined></a>
                        }
                        <a class="preview-link" routerLink="/gestionale-cn/onboarding-comunita-preview">Anteprima primo accesso utente</a>
                    }
                    @if (canAddMember) {
                        <button pButton type="button" [icon]="formVisibile ? 'pi pi-times' : 'pi pi-user-plus'" [label]="formVisibile ? 'Annulla' : 'Aggiungi membro'" (click)="toggleForm()"></button>
                    }
                </div>
            </header>

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
                    @if (equipeCatechisti.length) {
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
                                @if (canEditMembers) {
                                    <div class="unit-actions">
                                        <button pButton type="button" label="Modifica contatti" icon="pi pi-address-book" severity="secondary" outlined (click)="apriModificaContattiEquipe(unita)"></button>
                                        <button pButton type="button" label="Modifica unità" icon="pi pi-pencil" severity="info" outlined (click)="apriModificaUnitaEquipe(unita)"></button>
                                    </div>
                                }
                            </article>
                            }
                        </div>
                    } @else {
                        <div class="empty-community-state">
                            <span>Equipe dei catechisti da associare.</span>
                            @if (canEditMembers) {
                                <button pButton type="button" label="Associa equipe catechisti" icon="pi pi-users" (click)="apriAssociaEquipe()"></button>
                            }
                        </div>
                    }
                </section>

            }

            @if (messaggio) {
                <section class="action-message">
                    <i class="pi pi-info-circle"></i>
                    <span>{{ messaggio }}</span>
                </section>
            }

            @if (!isDemo && canAddMember) {
                <section class="controls-card">
                    <div class="search-box">
                        <strong>Censimento fratelli</strong>
                        <small>Il responsabile inserisce i dati base; ogni fratello completa personalmente privacy e consensi.</small>
                    </div>
                    <a pButton routerLink="/gestionale-cn/membri-comunita" label="Gestisci censimento fratelli" icon="pi pi-users"></a>
                    <button pButton type="button" label="Censisci fratello" icon="pi pi-user-plus" severity="secondary" outlined (click)="apriCensimentoFratello()"></button>
                    <button pButton type="button" label="Invita fratello" icon="pi pi-send" severity="secondary" outlined (click)="apriInvitoFratello()"></button>
                    <button pButton type="button" label="Invio massivo inviti" icon="pi pi-send" severity="success" outlined (click)="inviaInvitiMassiviFratelli()"></button>
                    <button pButton type="button" label="Copia link invito demo" icon="pi pi-copy" severity="secondary" text (click)="copiaLinkInvitoDemo()"></button>
                </section>

                <section class="action-message">
                    <i class="pi pi-shield"></i>
                    <span>Il responsabile può inserire i dati base, ma ogni fratello deve completare personalmente privacy e consensi.</span>
                </section>
            }

            @if (quickMode) {
                <section class="card p-6">
                    <h2 class="form-title">{{ quickMode === 'censisci' ? 'Censisci fratello' : 'Invita fratello' }}</h2>
                    <form class="member-form" #quickBrotherForm="ngForm" (ngSubmit)="salvaFlussoFratelloRapido()">
                        <div>
                            <label for="quickNome">Nome</label>
                            <input id="quickNome" name="quickNome" pInputText [(ngModel)]="quickBrother.nome" required />
                        </div>
                        <div>
                            <label for="quickCognome">Cognome</label>
                            <input id="quickCognome" name="quickCognome" pInputText [(ngModel)]="quickBrother.cognome" required />
                        </div>
                        <div>
                            <label for="quickEmail">Email</label>
                            <input id="quickEmail" name="quickEmail" pInputText type="email" [(ngModel)]="quickBrother.email" required />
                        </div>
                        <div>
                            <label for="quickTelefono">Telefono</label>
                            <input id="quickTelefono" name="quickTelefono" pInputText [(ngModel)]="quickBrother.telefono" />
                        </div>
                        @if (quickMode === 'censisci') {
                            <div>
                                <label for="quickDataNascita">Data nascita</label>
                                <input id="quickDataNascita" name="quickDataNascita" pInputText type="date" [(ngModel)]="quickBrother.dataNascita" />
                            </div>
                            <div>
                                <label for="quickRuolo">Carisma / ruolo comunitario</label>
                                <p-select inputId="quickRuolo" name="quickRuolo" appendTo="body" panelStyleClass="modal-dropdown-panel" [options]="carismiForm" optionLabel="label" optionValue="value" [(ngModel)]="quickBrother.ruoloComunitario"></p-select>
                            </div>
                            <div class="form-notes">
                                <label for="quickNote">Note</label>
                                <textarea id="quickNote" name="quickNote" pTextarea rows="3" [(ngModel)]="quickBrother.note"></textarea>
                            </div>
                        }
                        <p class="form-helper">{{ quickMode === 'censisci' ? 'Il profilo sarà salvato come da completare e la privacy come mancante.' : 'Verrà generato un link mock per /registrazione-fratello?token=...' }}</p>
                        <div class="form-actions">
                            <button pButton type="button" label="Annulla" severity="secondary" outlined (click)="chiudiFlussoFratelloRapido()"></button>
                            <button pButton type="submit" icon="pi pi-check" [label]="quickMode === 'censisci' ? 'Salva censimento' : 'Genera invito'" [disabled]="quickBrotherForm.invalid"></button>
                        </div>
                    </form>
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
                                <div>
                                    <label for="indirizzoFamiglia">Indirizzo famiglia</label>
                                    <input id="indirizzoFamiglia" name="indirizzoFamiglia" pInputText [(ngModel)]="nuovoMembroMinimo.indirizzo" />
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
                                <div>
                                    <label for="indirizzoSingolo">Indirizzo</label>
                                    <input id="indirizzoSingolo" name="indirizzoSingolo" pInputText [(ngModel)]="nuovoMembroMinimo.indirizzo" />
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
                            <label for="ruolo">Carisma</label>
                            <p-select inputId="ruolo" name="ruolo" appendTo="body" panelStyleClass="modal-dropdown-panel" [options]="carismiForm" optionLabel="label" optionValue="value" [(ngModel)]="form.ruolo"></p-select>
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
                            <label for="indirizzo">Indirizzo</label>
                            <input id="indirizzo" name="indirizzo" pInputText [(ngModel)]="form.indirizzo" />
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
                    <label for="filtroRuolo">Filtra carisma</label>
                    <p-select inputId="filtroRuolo" appendTo="body" panelStyleClass="modal-dropdown-panel" [options]="carismiFiltro" optionLabel="label" optionValue="value" [(ngModel)]="ruoloFiltro" [showClear]="true" placeholder="Tutti i carismi"></p-select>
                </div>
                @if (canManagePrivacy) {
                    <button pButton type="button" icon="pi pi-send" label="Invia moduli privacy mancanti" severity="success" outlined (click)="apriInvioPrivacyMassivo()"></button>
                }
                <div class="totals">
                    <strong>{{ membriFiltrati.length }}</strong>
                    <span>membri visualizzati su {{ membri.length }}</span>
                    @if (!isDemo) {
                        <small>Equipe dei catechisti: {{ equipeCatechisti.length }}</small>
                    }
                </div>
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
                            <th>Carisma</th>
                            <th>Telefono</th>
                            <th>Indirizzo</th>
                            <th>Email</th>
                            <th>Accesso app</th>
                            <th>Privacy</th>
                            <th>Stato</th>
                            @if (canEditMembers || canManagePrivacy) {
                                <th class="text-right">Azioni</th>
                            }
                        </tr>
                    </ng-template>
                    <ng-template #body let-membro>
                        <tr>
                            <td>{{ membro.nome }}</td>
                            <td>{{ membro.cognome }}</td>
                            <td>
                                @if (displayCarisma(membro) !== '—') {
                                    <span class="role-badge" [ngClass]="getRuoloClass(membro.ruolo)">{{ displayCarisma(membro) }}</span>
                                } @else {
                                    <span class="muted-dash">—</span>
                                }
                            </td>
                            <td class="multiline-cell">{{ displayContact(membro.telefono) }}</td>
                            <td>{{ displayContact(membro.indirizzo) }}</td>
                            <td>{{ displayContact(membro.email) }}</td>
                            <td><p-tag [value]="membro.accessoApp" [severity]="getAccessoSeverity(membro.accessoApp)" /></td>
                            <td><span class="privacy-badge" [ngClass]="getPrivacyClass(membro.consensoPrivacyStato)">{{ membro.consensoPrivacyStato }}</span></td>
                            <td><p-tag [value]="membro.statoMembro" [severity]="getStatoSeverity(membro.statoMembro)" /></td>
                            @if (canEditMembers || canManagePrivacy) {
                                <td>
                                    <div class="row-actions">
                                        @if (canEditMembers) {
                                            <button pButton type="button" label="Modifica carisma" icon="pi pi-user-edit" severity="info" text (click)="apriModificaRuolo(membro)"></button>
                                            <button pButton type="button" label="Modifica contatti" icon="pi pi-address-book" severity="secondary" text (click)="apriModificaContattiMembro(membro)"></button>
                                            <button pButton type="button" icon="pi pi-trash" severity="danger" text ariaLabel="Elimina" (click)="eliminaMembro(membro.id)"></button>
                                        }
                                        @if (canManagePrivacy) {
                                            @if (isDaInvitare(membro)) {
                                                <button pButton type="button" label="Invia invito" icon="pi pi-send" severity="success" text (click)="inviaInvitoFratello(membro)"></button>
                                                <button pButton type="button" label="Copia link" icon="pi pi-copy" severity="secondary" text (click)="copiaLinkInvitoFratello(membro)"></button>
                                                <button pButton type="button" label="WhatsApp" icon="pi pi-whatsapp" severity="secondary" text (click)="apriWhatsappInvitoFratello(membro)"></button>
                                                <button pButton type="button" label="Dettaglio" icon="pi pi-eye" severity="secondary" text (click)="apriDettaglioFratello(membro)"></button>
                                            }
                                            <button pButton type="button" label="Modifica privacy" icon="pi pi-shield" severity="secondary" text (click)="apriModificaPrivacy(membro)"></button>
                                            <button pButton type="button" label="Anteprima modulo" icon="pi pi-eye" severity="secondary" text (click)="apriAnteprimaPrivacy(membro)"></button>
                                            <button pButton type="button" label="Invia modulo privacy" icon="pi pi-send" severity="success" text (click)="apriInvioPrivacy(membro)"></button>
                                        }
                                    </div>
                                </td>
                            }
                        </tr>
                    </ng-template>
                    <ng-template #emptymessage>
                        <tr>
                            <td [attr.colspan]="canEditMembers || canManagePrivacy ? 10 : 9">Nessun membro trovato con i filtri attuali.</td>
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
                                @if (displayCarisma(membro) !== '—') {
                                    <span class="role-badge" [ngClass]="getRuoloClass(membro.ruolo)">{{ displayCarisma(membro) }}</span>
                                }
                            </div>
                            <p-tag [value]="membro.statoMembro" [severity]="getStatoSeverity(membro.statoMembro)" />
                        </div>
                        <dl>
                            <div><dt>Telefono</dt><dd class="multiline-cell">{{ displayContact(membro.telefono) }}</dd></div>
                            <div><dt>Indirizzo</dt><dd>{{ displayContact(membro.indirizzo) }}</dd></div>
                            <div><dt>Email</dt><dd>{{ displayContact(membro.email) }}</dd></div>
                            <div><dt>Accesso app</dt><dd>{{ membro.accessoApp }}</dd></div>
                            <div><dt>Privacy</dt><dd><span class="privacy-badge" [ngClass]="getPrivacyClass(membro.consensoPrivacyStato)">{{ membro.consensoPrivacyStato }}</span></dd></div>
                            <div><dt>Modulo inviato</dt><dd>{{ membro.moduloPrivacyInviato ? 'SÃ¬' : 'No' }}</dd></div>
                            <div><dt>Modulo ricevuto</dt><dd>{{ membro.moduloPrivacyRicevuto ? 'SÃ¬' : 'No' }}</dd></div>
                        </dl>
                        @if (canEditMembers || canManagePrivacy) {
                            <div class="card-actions">
                                @if (canEditMembers) {
                                    <button pButton type="button" icon="pi pi-user-edit" label="Modifica carisma" severity="info" outlined (click)="apriModificaRuolo(membro)"></button>
                                    <button pButton type="button" icon="pi pi-address-book" label="Contatti" severity="secondary" outlined (click)="apriModificaContattiMembro(membro)"></button>
                                }
                                @if (canManagePrivacy) {
                                    @if (isDaInvitare(membro)) {
                                        <button pButton type="button" icon="pi pi-send" label="Invia invito" severity="success" outlined (click)="inviaInvitoFratello(membro)"></button>
                                        <button pButton type="button" icon="pi pi-copy" label="Copia link" severity="secondary" outlined (click)="copiaLinkInvitoFratello(membro)"></button>
                                        <button pButton type="button" icon="pi pi-whatsapp" label="WhatsApp" severity="secondary" outlined (click)="apriWhatsappInvitoFratello(membro)"></button>
                                        <button pButton type="button" icon="pi pi-eye" label="Dettaglio" severity="secondary" outlined (click)="apriDettaglioFratello(membro)"></button>
                                    }
                                    <button pButton type="button" icon="pi pi-shield" label="Privacy" severity="secondary" outlined (click)="apriModificaPrivacy(membro)"></button>
                                    <button pButton type="button" icon="pi pi-eye" label="Anteprima" severity="secondary" outlined (click)="apriAnteprimaPrivacy(membro)"></button>
                                    <button pButton type="button" icon="pi pi-send" label="Invia modulo" severity="success" outlined (click)="apriInvioPrivacy(membro)"></button>
                                }
                            </div>
                        }
                    </article>
                }
            </section>

            @if (ruoloModalMembro) {
                <div class="modal-backdrop" role="presentation" (click)="chiudiModali()">
                    <section class="app-modal" role="dialog" aria-modal="true" aria-label="Modifica carisma" (click)="$event.stopPropagation()">
                        <header>
                            <span>Modifica carisma</span>
                            <h2>{{ ruoloModalMembro.nomeCompleto }}</h2>
                        </header>
                        <p>Carisma attuale: <strong>{{ displayCarisma(ruoloModalMembro) }}</strong></p>
                        <label for="nuovoRuolo">Nuovo carisma</label>
                        <p-select inputId="nuovoRuolo" appendTo="body" panelStyleClass="modal-dropdown-panel" [options]="carismiForm" optionLabel="label" optionValue="value" [(ngModel)]="nuovoRuolo"></p-select>
                        <footer>
                            <button pButton type="button" label="Annulla" severity="secondary" outlined (click)="chiudiModali()"></button>
                            <button pButton type="button" label="Salva carisma" icon="pi pi-check" (click)="salvaRuolo()"></button>
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

            @if (associaEquipeAperta) {
                <div class="modal-backdrop" role="presentation" (click)="chiudiModali()">
                    <section class="app-modal app-modal-wide" role="dialog" aria-modal="true" aria-label="Associa equipe catechisti" (click)="$event.stopPropagation()">
                        <header>
                            <span>Equipe dei catechisti</span>
                            <h2>Associa equipe catechisti</h2>
                        </header>
                        <div class="modal-grid">
                            <div>
                                <label for="parrocchiaCatechista">Parrocchia di riferimento</label>
                                <p-select inputId="parrocchiaCatechista" appendTo="body" panelStyleClass="modal-dropdown-panel" [options]="parrocchieOptions" optionLabel="nome" optionValue="id" [(ngModel)]="parrocchiaEquipeId"></p-select>
                            </div>
                            <div>
                                <label for="numeroComunitaCatechista">Numero comunità</label>
                                <p-select inputId="numeroComunitaCatechista" appendTo="body" panelStyleClass="modal-dropdown-panel" [options]="numeriComunitaOptions" [(ngModel)]="numeroComunitaEquipe"></p-select>
                            </div>
                            <div>
                                <label for="nomeCatechista">Nome</label>
                                <input id="nomeCatechista" pInputText [(ngModel)]="nomeCatechistaEquipe" />
                            </div>
                            <div>
                                <label for="cognomeCatechista">Cognome</label>
                                <input id="cognomeCatechista" pInputText [(ngModel)]="cognomeCatechistaEquipe" />
                            </div>
                            <div>
                                <label for="emailCatechista">Email</label>
                                <input id="emailCatechista" pInputText type="email" [(ngModel)]="emailCatechistaEquipe" />
                            </div>
                            <div>
                                <label for="telefonoCatechista">Numero di telefono</label>
                                <input id="telefonoCatechista" pInputText [(ngModel)]="telefonoCatechistaEquipe" />
                            </div>
                        </div>
                        <p class="privacy-warning">I catechisti restano nello specchietto “Equipe dei catechisti” e non entrano nella tabella membri della comunità.</p>
                        <footer>
                            <button pButton type="button" label="Annulla" severity="secondary" outlined (click)="chiudiModali()"></button>
                            <button pButton type="button" label="Salva equipe" icon="pi pi-check" (click)="salvaAssociazioneEquipe()"></button>
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
                        <section class="privacy-owner">
                            <strong>Titolare del trattamento: {{ privacyConfig.titolareBreve }}</strong>
                            <span>Email privacy: {{ privacyConfig.emailPrivacy }}</span>
                            <a routerLink="/gestionale-cn/privacy">Leggi informativa privacy completa</a>
                        </section>
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
                        <section class="privacy-owner">
                            <strong>Titolare del trattamento: {{ privacyConfig.titolareBreve }}</strong>
                            <span>Email privacy: {{ privacyConfig.emailPrivacy }}</span>
                            <a routerLink="/gestionale-cn/privacy">Leggi informativa privacy completa</a>
                        </section>
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
                        <section class="privacy-owner">
                            <strong>Titolare del trattamento: {{ privacyConfig.titolareBreve }}</strong>
                            <span>Email privacy: {{ privacyConfig.emailPrivacy }}</span>
                            <a routerLink="/gestionale-cn/privacy">Leggi informativa privacy completa</a>
                        </section>
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

            .heading-actions {
                display: flex;
                flex-wrap: wrap;
                justify-content: flex-end;
                gap: 0.65rem;
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

            .empty-community-state {
                display: grid;
                gap: 0.75rem;
                justify-items: center;
                margin-top: 1rem;
                padding: 1rem;
                border: 1px dashed #cbd5e1;
                border-radius: 12px;
                color: #64748b;
                background: rgba(248, 250, 252, 0.72);
                font-weight: 800;
                text-align: center;
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

            .operative-permissions-card {
                margin-bottom: 1rem;
                padding: 1rem;
            }

            .permission-request-form {
                display: grid;
                grid-template-columns: minmax(14rem, 0.8fr) minmax(16rem, 1fr) auto;
                gap: 1rem;
                align-items: end;
            }

            .permission-requests-list {
                display: grid;
                gap: 0.75rem;
            }

            .permission-requests-list article {
                display: flex;
                justify-content: space-between;
                gap: 1rem;
                padding: 0.85rem;
                border-radius: 0.9rem;
                background: #f8fafc;
                border: 1px solid #e2e8f0;
            }

            .permission-requests-list span,
            .permission-requests-list small,
            .empty-copy {
                color: #475569;
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
            .role-presbitero { background-color: #000000 !important; color: #ffffff !important; border-color: #000000; }
            .role-catechista { background: #fef9c3; color: #854d0e; border-color: #fde68a; }
            .role-didascalo-a { background: #e0e7ff; color: #3730a3; border-color: #c7d2fe; }
            .muted-dash { color: #94a3b8; font-weight: 800; }
            .multiline-cell { white-space: pre-line; line-height: 1.35; }
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

            .modal-grid {
                display: grid;
                grid-template-columns: repeat(2, minmax(0, 1fr));
                gap: 0.85rem;
            }

            .modal-grid div {
                display: grid;
                gap: 0.35rem;
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

            .privacy-owner {
                display: grid;
                gap: 0.25rem;
                padding: 0.75rem;
                border: 1px solid #e5e7eb;
                border-radius: 12px;
                background: #f8fafc;
                color: #334155;
            }

            .privacy-owner strong {
                color: #0f3558;
            }

            .privacy-owner a {
                color: #0f3558;
                font-weight: 800;
                text-decoration: none;
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
                .catechisti-grid,
                .permission-request-form {
                    grid-template-columns: 1fr;
                }

                .modal-grid {
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
    private readonly currentCommunity = getCurrentCommunity();
    readonly userAccessContext = getUserAccessContext();
    readonly canAddMember = canPerformAction('aggiungi-membro', this.userAccessContext);
    readonly canEditMembers = canPerformAction('modifica-membro', this.userAccessContext);
    readonly canManagePrivacy = canPerformAction('gestione-privacy', this.userAccessContext);
    readonly canCensireComunita = canPerformAction('censimento-comunita', this.userAccessContext);

    ruoliOperativi: RuoloOperativoComunita[] = ['Responsabile', 'Corresponsabile', 'Catechista', 'Cantore', 'Presbitero', 'Diacono', 'Lettore', 'Ostiario', 'Didascalo/a'];
    carismiForm = [{ label: 'Nessun carisma', value: '' as MembroComunitaPilota['ruolo'] }, ...this.ruoliOperativi.map((value) => ({ label: value, value }))];
    carismiFiltro = this.ruoliOperativi.map((value) => ({ label: value, value }));
    ruoliFiltro: RuoloOperativoComunita[] = this.ruoliOperativi;
    permessiOperativiRichiedibili: PermessoOperativoRichiedibile[] = ['Collaboratore convivenze', 'Collaboratore segreteria', 'Supporto privacy/moduli', 'Supporto anagrafica'];
    statiMembro: StatoMembro[] = ['Da invitare', 'Invitato', 'Da completare', 'Attivo', 'Non attivo'];
    accessiApp: AccessoApp[] = ['Da invitare', 'Invito inviato', 'Invitato', 'Da completare', 'Attivo', 'Non attivo'];
    statiPrivacy: ConsensoPrivacyPilota[] = ['Da inviare', 'Da completare', 'Inviato', 'Parziale', 'Raccolto', 'Revocato'];
    tipiUnitaEquipe: TipoUnitaEquipeCatechisti[] = ['Coppia', 'Fratello singolo', 'Sorella singola'];
    tipiInserimentoMembro: TipoUnitaMembroComunita[] = ['Coppia', 'Fratello singolo', 'Sorella singola'];
    parrocchieOptions = PARROCCHIE_MOCK;
    numeriComunitaOptions = NUMERI_COMUNITA;

    ricerca = '';
    ruoloFiltro: RuoloOperativoComunita | null = null;
    formVisibile = false;
    membroInModifica: MembroComunitaPilota | null = null;
    tipoInserimentoMembro: TipoUnitaMembroComunita = 'Fratello singolo';
    nuovoMembroMinimo = this.creaNuovoMembroMinimo();
    quickMode: CensimentoFratelloMode = null;
    quickBrother: FratelloQuickForm = this.creaQuickBrotherForm();
    messaggio = '';
    permessoRichiesto: PermessoOperativoRichiedibile = 'Collaboratore convivenze';
    motivazionePermesso = '';
    richiestePermessi: RichiestaPermessoOperativo[] = this.leggiRichiestePermessi();

    ruoloModalMembro: MembroComunitaPilota | null = null;
    nuovoRuolo: MembroComunitaPilota['ruolo'] = '';
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
    associaEquipeAperta = false;
    tipoUnitaEquipe: TipoUnitaEquipeCatechisti = 'Coppia';
    nomeVisualizzatoEquipe = '';
    telefonoEquipe = '';
    emailEquipe = '';
    capoEquipeUnita = false;
    noteEquipe = '';
    telefonoContatto = '';
    emailContatto = '';
    parrocchiaEquipeId = PARROCCHIE_MOCK[0]?.id ?? 1;
    numeroComunitaEquipe = 1;
    nomeCatechistaEquipe = '';
    cognomeCatechistaEquipe = '';
    emailCatechistaEquipe = '';
    telefonoCatechistaEquipe = '';
    policyTitle = PRIVACY_POLICY_DRAFT_TITLE;
    policyParagraphs = PRIVACY_POLICY_DRAFT_PARAGRAPHS;
    policyDataItems = PRIVACY_POLICY_DRAFT_DATA_ITEMS;
    policyConsents = PRIVACY_CONSENTS_DRAFT;
    privacyConfig = PRIVACY_CONFIG;

    equipeCatechisti: EquipeCatechistiUnita[] = this.isDemo ? [] : this.leggiEquipeCatechisti();
    membri: MembroComunitaPilota[] = this.isDemo ? this.creaMembriDemo() : this.creaMembriGestionali();
    private prossimoId = this.membri.length + 1;
    form: MembroForm = this.creaFormVuoto();

    get isDemo() {
        const url = this.router.url.split('?')[0].split('#')[0];
        return this.route.snapshot.data['demo'] === true || url === '/demo' || url.startsWith('/demo/');
    }

    get nomeComunita() {
        return this.isDemo ? DEMO_COMUNITA.nome : this.currentCommunity.nomeComunita;
    }

    get parrocchiaComunita() {
        return this.isDemo ? DEMO_COMUNITA.parrocchia : this.currentCommunity.parrocchiaNome;
    }

    get settoreComunita() {
        return this.isDemo ? DEMO_COMUNITA.settore.replace(/^Settore\s+/i, '') : this.currentCommunity.settoreNome.replace(/^Settore\s+/i, '');
    }

    get diocesiComunita() {
        return this.isDemo ? DEMO_COMUNITA.diocesi : this.currentCommunity.diocesiNome;
    }

    get puoGestireRichiestePermessi() {
        return this.currentUserPermessi().includes('APPROVE_REQUESTS');
    }

    get richiestePermessiInAttesa() {
        return this.richiestePermessi.filter((richiesta) => richiesta.stato === 'In attesa approvazione responsabile' && richiesta.comunita === this.nomeComunita);
    }

    get membriFiltrati() {
        const query = this.ricerca.trim().toLowerCase();
        return this.membri.filter((membro) => {
            const matchQuery = !query || membro.nome.toLowerCase().includes(query) || membro.cognome.toLowerCase().includes(query) || membro.nomeCompleto.toLowerCase().includes(query);
            const matchRuolo = !this.ruoloFiltro || membro.ruolo === this.ruoloFiltro;
            return matchQuery && matchRuolo;
        }).sort((a, b) => this.compareMembri(a, b));
    }

    get conteggiRuolo() {
        return this.ruoliFiltro.map((ruolo) => ({
            ruolo,
            totale: this.membri.filter((membro) => membro.ruolo === ruolo).length
        }));
    }

    get membriDaInviare() {
        return this.membri.filter((membro) => membro.consensoPrivacyStato === 'Da inviare' || membro.consensoPrivacyStato === 'Da completare' || membro.consensoPrivacyStato === 'Parziale');
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

    apriAssociaEquipe() {
        this.associaEquipeAperta = true;
    }

    salvaAssociazioneEquipe() {
        const nome = this.nomeCatechistaEquipe.trim();
        const cognome = this.cognomeCatechistaEquipe.trim();

        if (!nome || !cognome) {
            this.messaggio = 'Inserisci nome e cognome del catechista';
            return;
        }

        const parrocchia = PARROCCHIE_MOCK.find((item) => item.id === this.parrocchiaEquipeId);
        const nuovaUnita: EquipeCatechistiUnita = {
            id: this.equipeCatechisti.length ? Math.max(...this.equipeCatechisti.map((unita) => unita.id)) + 1 : 1,
            tipoUnita: 'Fratello singolo',
            nomeVisualizzato: `${nome} ${cognome}`,
            membri: [
                {
                    id: 1,
                    nome,
                    cognome,
                    genere: 'Fratello',
                    telefono: this.telefonoCatechistaEquipe.trim(),
                    email: this.emailCatechistaEquipe.trim(),
                    capoEquipe: false
                }
            ],
            capoEquipe: false,
            telefono: this.telefonoCatechistaEquipe.trim(),
            email: this.emailCatechistaEquipe.trim(),
            note: `${this.numeroComunitaEquipe}ª Comunità - ${parrocchia?.nome ?? 'Parrocchia da verificare'}`
        };

        this.equipeCatechisti = [...this.equipeCatechisti, nuovaUnita];
        this.salvaEquipeCatechisti();
        this.messaggio = 'Equipe catechisti associata';
        this.chiudiModali();
    }

    toggleForm() {
        if (this.formVisibile) {
            this.annullaForm();
            return;
        }
        this.formVisibile = true;
    }

    apriCensimentoFratello() {
        this.quickMode = 'censisci';
        this.quickBrother = this.creaQuickBrotherForm();
        this.formVisibile = false;
    }

    apriInvitoFratello() {
        this.quickMode = 'invita';
        this.quickBrother = this.creaQuickBrotherForm();
        this.formVisibile = false;
    }

    chiudiFlussoFratelloRapido() {
        this.quickMode = null;
        this.quickBrother = this.creaQuickBrotherForm();
    }

    salvaFlussoFratelloRapido() {
        const payload = {
            nome: this.quickBrother.nome.trim(),
            cognome: this.quickBrother.cognome.trim(),
            email: this.quickBrother.email.trim(),
            telefono: this.quickBrother.telefono.trim(),
            dataNascita: this.quickBrother.dataNascita,
            ruoloComunitario: this.quickBrother.ruoloComunitario,
            note: this.quickBrother.note.trim()
        };

        if (!payload.nome || !payload.cognome || !payload.email) {
            this.messaggio = 'Compila nome, cognome ed email prima di continuare.';
            return;
        }

        const member = this.quickMode === 'invita' ? inviteCommunityMember(payload) : addManualCommunityMember(payload);
        this.upsertMembroVisualeDaCommunityMember(member);
        this.messaggio =
            this.quickMode === 'invita'
                ? `Invito simulato inviato. Link: ${this.publicInviteUrl(member)}`
                : 'Fratello censito in modalità mock. Privacy e consensi restano da completare personalmente.';
        this.chiudiFlussoFratelloRapido();
    }

    inviaInvitoFratello(membro: MembroComunitaPilota) {
        const member = this.ensureInviteMember(membro);
        this.aggiornaRigaInvitata(membro);
        this.messaggio = `Invito simulato inviato. Link: ${this.publicInviteUrl(member)}`;
    }

    copiaLinkInvitoFratello(membro: MembroComunitaPilota) {
        const member = this.ensureInviteMember(membro);
        navigator.clipboard?.writeText(this.publicInviteUrl(member));
        this.aggiornaRigaInvitata(membro);
        this.messaggio = 'Link invito copiato.';
    }

    apriWhatsappInvitoFratello(membro: MembroComunitaPilota) {
        const member = this.ensureInviteMember(membro);
        const link = this.publicInviteUrl(member);
        const text = encodeURIComponent(`Sei stato invitato dal responsabile della tua comunità a completare la tua scheda personale e i consensi privacy: ${link}`);
        this.aggiornaRigaInvitata(membro);
        window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer');
    }

    apriDettaglioFratello(membro: MembroComunitaPilota) {
        this.modificaMembro(membro);
    }

    inviaInvitiMassiviFratelli() {
        const candidati = this.membri.filter((membro) => membro.email.trim() && this.isDaInvitare(membro));
        const senzaEmail = this.membri.filter((membro) => !membro.email.trim() && this.isDaInvitare(membro)).length;
        const giaCompletati = this.membri.filter((membro) => membro.accessoApp === 'Attivo' || membro.consensoPrivacyStato === 'Raccolto').length;

        candidati.forEach((membro) => this.ensureInviteMember(membro));
        const ids = new Set(candidati.map((membro) => membro.id));
        this.membri = this.membri.map((membro) => (ids.has(membro.id) ? this.rigaInvitata(membro) : membro));
        this.messaggio = `Invio massivo mock: ${candidati.length} inviti simulati inviati, ${senzaEmail} fratelli senza email, ${giaCompletati} già completati.`;
    }

    copiaLinkInvitoDemo() {
        const link = `${PUBLIC_INVITE_BASE_URL}/registrazione-fratello?token=demo`;
        navigator.clipboard?.writeText(link);
        this.messaggio = `Link invito demo copiato: ${link}`;
    }

    isDaInvitare(membro: MembroComunitaPilota) {
        return membro.accessoApp === 'Da invitare' || membro.consensoPrivacyStato === 'Da inviare' || membro.consensoPrivacyStato === 'Da completare';
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
            indirizzo: this.form.indirizzo.trim(),
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
            ruolo: this.ruoliOperativi.includes(membro.ruolo as RuoloOperativoComunita) ? membro.ruolo : '',
            telefono: membro.telefono,
            indirizzo: membro.indirizzo,
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
        this.nuovoRuolo = this.ruoliOperativi.includes(membro.ruolo as RuoloOperativoComunita) ? (membro.ruolo as RuoloOperativoComunita) : '';
    }

    salvaRuolo() {
        if (!this.ruoloModalMembro) {
            return;
        }
        this.membri = this.membri.map((membro) => (membro.id === this.ruoloModalMembro?.id ? { ...membro, ruolo: normalizeCarismaComunitario(this.nuovoRuolo) } : membro));
        this.messaggio = 'Carisma aggiornato';
        this.chiudiModali();
    }

    inviaRichiestaPermesso() {
        const profile = this.leggiProfiloOnboarding();
        const richiesta: RichiestaPermessoOperativo = {
            id: `permesso-${Date.now()}`,
            personaId: profile?.['mockUserId'] ?? 'mock-current-user',
            nome: profile?.['nome'] ?? 'Utente',
            cognome: profile?.['cognome'] ?? 'corrente',
            comunita: this.nomeComunita,
            permessoRichiesto: this.permessoRichiesto,
            motivazione: this.motivazionePermesso.trim(),
            stato: 'In attesa approvazione responsabile',
            dataRichiesta: new Date().toISOString()
        };

        this.richiestePermessi = [...this.richiestePermessi, richiesta];
        this.salvaRichiestePermessi();
        this.motivazionePermesso = '';
        this.messaggio = 'La richiesta è stata inviata al responsabile della comunità.';
    }

    approvaRichiestaPermesso(richiesta: RichiestaPermessoOperativo) {
        this.aggiornaStatoRichiestaPermesso(richiesta.id, 'Approvata');
        this.aggiungiPermessoOperativoAlProfilo(richiesta.permessoRichiesto);
        this.messaggio = `Permesso approvato: ${richiesta.permessoRichiesto}`;
    }

    rifiutaRichiestaPermesso(richiesta: RichiestaPermessoOperativo) {
        this.aggiornaStatoRichiestaPermesso(richiesta.id, 'Rifiutata');
        this.messaggio = `Richiesta rifiutata: ${richiesta.permessoRichiesto}`;
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
            this.salvaEquipeCatechisti();
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
        this.salvaEquipeCatechisti();
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

    private ensureInviteMember(membro: MembroComunitaPilota): CommunityMemberMock {
        const existing = this.findCommunityMemberForMembro(membro);
        const member = existing
            ? resendInvite(existing)
            : inviteCommunityMember({
                  nome: membro.nome,
                  cognome: membro.cognome,
                  email: membro.email,
                  telefono: membro.telefono,
                  ruoloComunitario: membro.ruolo,
                  note: membro.note
              });

        this.upsertMembroVisualeDaCommunityMember(member);
        return member;
    }

    private findCommunityMemberForMembro(membro: MembroComunitaPilota): CommunityMemberMock | null {
        const email = membro.email.trim().toLowerCase();
        const nome = membro.nome.trim().toLowerCase();
        const cognome = membro.cognome.trim().toLowerCase();
        return (
            readCommunityMembers().find((member) => {
                const sameEmail = email && member.email.trim().toLowerCase() === email;
                const sameName = member.nome.trim().toLowerCase() === nome && member.cognome.trim().toLowerCase() === cognome;
                return sameEmail || sameName;
            }) ?? null
        );
    }

    private publicInviteUrl(member: CommunityMemberMock) {
        const token = member.token || 'demo';
        return `${PUBLIC_INVITE_BASE_URL}/registrazione-fratello?token=${encodeURIComponent(token)}`;
    }

    private aggiornaRigaInvitata(membro: MembroComunitaPilota) {
        this.membri = this.membri.map((item) => (item.id === membro.id ? this.rigaInvitata(item) : item));
    }

    private rigaInvitata(membro: MembroComunitaPilota): MembroComunitaPilota {
        return {
            ...membro,
            accessoApp: 'Invito inviato',
            statoMembro: membro.statoMembro === 'Non attivo' ? membro.statoMembro : 'Invitato',
            consensoPrivacyStato: membro.consensoPrivacyStato === 'Raccolto' ? membro.consensoPrivacyStato : 'Da completare',
            moduloPrivacyInviato: true,
            dataInvioModuloPrivacy: this.oggiIso()
        };
    }

    private upsertMembroVisualeDaCommunityMember(member: CommunityMemberMock) {
        const mapped = this.creaMembroDaCommunityMember(member, this.prossimoId++);
        const email = mapped.email.trim().toLowerCase();
        const index = this.membri.findIndex((item) => (email && item.email.trim().toLowerCase() === email) || (item.nome === mapped.nome && item.cognome === mapped.cognome));

        if (index >= 0) {
            this.membri = this.membri.map((item, itemIndex) => (itemIndex === index ? { ...item, ...mapped, id: item.id } : item));
            return;
        }

        this.membri = [...this.membri, mapped];
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
        this.associaEquipeAperta = false;
        this.nomeCatechistaEquipe = '';
        this.cognomeCatechistaEquipe = '';
        this.emailCatechistaEquipe = '';
        this.telefonoCatechistaEquipe = '';
    }

    annullaForm() {
        this.form = this.creaFormVuoto();
        this.tipoInserimentoMembro = 'Fratello singolo';
        this.nuovoMembroMinimo = this.creaNuovoMembroMinimo();
        this.membroInModifica = null;
        this.formVisibile = false;
    }

    getRuoloClass(ruolo: RuoloComunitaPilota) {
        return `role-${ruolo.toLowerCase().replace(/\s*\/\s*/g, '-').replace(/\s+/g, '-')}`;
    }

    getAccessoSeverity(accesso: AccessoApp) {
        switch (accesso) {
            case 'Attivo':
                return 'success';
            case 'Invito inviato':
            case 'Invitato':
                return 'info';
            case 'Da completare':
                return 'warn';
            case 'Non attivo':
                return 'danger';
            default:
                return 'secondary';
        }
    }

    getStatoSeverity(stato: StatoMembro) {
        switch (stato) {
            case 'Attivo':
                return 'success';
            case 'Invitato':
                return 'info';
            case 'Da completare':
                return 'warn';
            case 'Non attivo':
                return 'danger';
            default:
                return 'secondary';
        }
    }

    getPrivacySeverity(stato: ConsensoPrivacyPilota) {
        switch (stato) {
            case 'Raccolto':
                return 'success';
            case 'Inviato':
                return 'info';
            case 'Da inviare':
            case 'Da completare':
            case 'Parziale':
                return 'warn';
            case 'Revocato':
                return 'danger';
            default:
                return 'secondary';
        }
    }

    getPrivacyClass(stato: ConsensoPrivacyPilota) {
        return `privacy-${stato.toLowerCase().replace(/\s+/g, '-')}`;
    }

    displayCarisma(membro: MembroComunitaPilota) {
        return membro.ruolo || '—';
    }

    displayContact(value: string) {
        return value?.trim() || 'Da inserire';
    }

    private compareMembri(a: MembroComunitaPilota, b: MembroComunitaPilota) {
        const priority = this.prioritaCarisma(a.ruolo) - this.prioritaCarisma(b.ruolo);
        if (priority !== 0) {
            return priority;
        }

        return `${a.cognome} ${a.nome}`.localeCompare(`${b.cognome} ${b.nome}`, 'it-IT', { sensitivity: 'base' });
    }

    private prioritaCarisma(carisma: MembroComunitaPilota['ruolo']) {
        const priorita: Partial<Record<MembroComunitaPilota['ruolo'], number>> = {
            Presbitero: 1,
            Responsabile: 2,
            Corresponsabile: 3,
            Ostiario: 4
        };

        return priorita[carisma] ?? 5;
    }

    private leggiRichiestePermessi(): RichiestaPermessoOperativo[] {
        const raw = localStorage.getItem(RICHIESTE_PERMESSI_OPERATIVI_KEY);
        if (!raw) {
            return [];
        }

        try {
            return JSON.parse(raw) as RichiestaPermessoOperativo[];
        } catch {
            return [];
        }
    }

    private salvaRichiestePermessi() {
        localStorage.setItem(RICHIESTE_PERMESSI_OPERATIVI_KEY, JSON.stringify(this.richiestePermessi));
    }

    private aggiornaStatoRichiestaPermesso(id: string, stato: StatoRichiestaPermesso) {
        this.richiestePermessi = this.richiestePermessi.map((richiesta) =>
            richiesta.id === id ? { ...richiesta, stato, dataEsito: new Date().toISOString() } : richiesta
        );
        this.salvaRichiestePermessi();
    }

    private aggiungiPermessoOperativoAlProfilo(permesso: PermessoOperativoRichiedibile) {
        const profile = this.leggiProfiloOnboarding() ?? {};
        const permessiOperativi = Array.isArray(profile['permessiOperativi']) ? profile['permessiOperativi'] : [];
        const ambitiOperativi = Array.isArray(profile['ambitiOperativi']) ? profile['ambitiOperativi'] : [];
        const updated = {
            ...profile,
            permessiOperativi: [...new Set([...permessiOperativi, permesso])],
            ambitiOperativi: [...new Set([...ambitiOperativi, permesso])]
        };

        localStorage.setItem('onboardingUserProfile', JSON.stringify(updated));
    }

    private leggiProfiloOnboarding(): Record<string, any> | null {
        const raw = localStorage.getItem('onboardingUserProfile');
        if (!raw) {
            return null;
        }

        try {
            return JSON.parse(raw) as Record<string, any>;
        } catch {
            return null;
        }
    }

    private currentUserCarisma(): MembroComunitaPilota['ruolo'] {
        const profile = this.leggiProfiloOnboarding();
        const onboardingCarisma = this.mapOnboardingCarisma(profile?.['ruoloComunitario']);
        return onboardingCarisma || (this.currentCommunity.isPilot ? 'Responsabile' : '');
    }

    private currentUserPermessi() {
        const profile = this.leggiProfiloOnboarding();
        const carismi = new Set<Carisma>();

        if (Array.isArray(profile?.['carismi'])) {
            profile?.['carismi'].forEach((carisma: string) => carismi.add(normalizeCarismaForPermissions(carisma)));
        } else {
            carismi.add(normalizeCarismaForPermissions(profile?.['ruoloComunitario']));
        }

        if (profile?.['isCatechista'] === true) {
            carismi.add('catechista');
        }

        if (!profile && this.currentCommunity.isPilot) {
            carismi.add('responsabile');
        }

        return getPermessiByCarismi(Array.from(carismi));
    }

    private mapOnboardingCarisma(value: unknown): MembroComunitaPilota['ruolo'] {
        const map: Record<string, MembroComunitaPilota['ruolo']> = {
            responsabile: 'Responsabile',
            corresponsabile: 'Corresponsabile',
            catechista: 'Catechista',
            cantore: 'Cantore',
            presbitero: 'Presbitero',
            diacono: 'Diacono',
            lettore: 'Lettore',
            ostiario: 'Ostiario',
            didascalo: 'Didascalo/a'
        };

        return typeof value === 'string' ? map[value] ?? '' : '';
    }

    private salvaCensimentoMinimo() {
        const email = this.nuovoMembroMinimo.emailRiferimento.trim();
        const noteCensimento = this.tipoInserimentoMembro === 'Coppia'
            ? 'Censimento minimo di coppia: i consensi privacy restano individuali.'
            : 'Censimento minimo: anagrafica e consensi da completare tramite modulo personale.';

        const nuoviMembri =
            this.tipoInserimentoMembro === 'Coppia'
                ? [this.creaMembroCoppiaMinimo(email, noteCensimento)]
                : [this.creaMembroMinimo(this.nuovoMembroMinimo.nome, this.nuovoMembroMinimo.cognome, email, noteCensimento, this.nuovoMembroMinimo.indirizzo)];

        this.membri = [...this.membri, ...nuoviMembri];
        this.messaggio = this.tipoInserimentoMembro === 'Coppia' ? 'Coppia censita in modalità mock' : 'Membro censito in modalità mock';
        this.annullaForm();
    }

    private creaMembroMinimo(nome: string, cognome: string, email: string, note: string, indirizzo = ''): MembroComunitaPilota {
        const nomePulito = nome.trim();
        const cognomePulito = cognome.trim();
        return {
            id: this.prossimoId++,
            nome: nomePulito,
            cognome: cognomePulito,
            nomeCompleto: `${nomePulito} ${cognomePulito}`.trim(),
            ruolo: '',
            accessoApp: 'Da invitare',
            statoMembro: 'Attivo',
            consensoPrivacyStato: 'Da inviare',
            moduloPrivacyInviato: false,
            moduloPrivacyRicevuto: false,
            dataInvioModuloPrivacy: '',
            telefono: '',
            indirizzo: indirizzo.trim(),
            email,
            note
        };
    }

    private creaMembroCoppiaMinimo(email: string, note: string): MembroComunitaPilota {
        const nomeMarito = this.nuovoMembroMinimo.nomeMarito.trim();
        const nomeMoglie = this.nuovoMembroMinimo.nomeMoglie.trim();
        const cognomeFamiglia = this.nuovoMembroMinimo.cognomeMarito.trim() || this.nuovoMembroMinimo.cognomeMoglie.trim();
        const nomeCoppia = [nomeMarito, nomeMoglie].filter(Boolean).join(' e ') || 'Famiglia';
        const nomeCompleto = cognomeFamiglia ? `${nomeCoppia} ${cognomeFamiglia}`.trim() : nomeCoppia;

        return {
            id: this.prossimoId++,
            nome: nomeCoppia,
            cognome: cognomeFamiglia,
            nomeCompleto,
            ruolo: '',
            accessoApp: 'Da invitare',
            statoMembro: 'Attivo',
            consensoPrivacyStato: 'Da inviare',
            moduloPrivacyInviato: false,
            moduloPrivacyRicevuto: false,
            dataInvioModuloPrivacy: '',
            telefono: '',
            indirizzo: this.nuovoMembroMinimo.indirizzo.trim(),
            email,
            note: `${note} Componenti: ${nomeCompleto}`
        };
    }

    private creaMembriGestionali(): MembroComunitaPilota[] {
        const base = this.currentCommunity.isPilot ? UNITA_MEMBRI_COMUNITA_PILOTA.map((unita) => this.creaMembroDaUnitaPilota(unita)) : [];
        const censiti = leggiUnitaCensimento().flatMap((unita) => this.creaMembriDaUnitaCensimento(unita));
        const fratelliMock = readCommunityMembers().map((member, index) => this.creaMembroDaCommunityMember(member, base.length + censiti.length + index + 1));
        const chiaviEsistenti = new Set(base.map((membro) => this.memberKey(membro)));
        const nuoviCensiti = censiti.filter((membro) => !chiaviEsistenti.has(this.memberKey(membro)));
        nuoviCensiti.forEach((membro) => chiaviEsistenti.add(this.memberKey(membro)));
        const nuoviMock = fratelliMock.filter((membro) => !chiaviEsistenti.has(this.memberKey(membro)));
        return [...base, ...nuoviCensiti.map((membro, index) => ({ ...membro, id: base.length + index + 1 })), ...nuoviMock];
    }

    private creaMembroDaCommunityMember(member: CommunityMemberMock, id: number): MembroComunitaPilota {
        const nomeCompleto = `${member.nome} ${member.cognome}`.trim();
        return {
            id,
            nome: member.nome,
            cognome: member.cognome,
            nomeCompleto,
            ruolo: normalizeCarismaComunitario(member.ruoloComunitario),
            accessoApp: this.mapAccessoDaCommunityMember(member),
            statoMembro: this.mapStatoDaCommunityMember(member),
            consensoPrivacyStato: this.mapPrivacyDaCommunityMember(member),
            moduloPrivacyInviato: member.statoInvito === 'INVIATO',
            moduloPrivacyRicevuto: member.statoPrivacy === 'COMPLETATA',
            dataInvioModuloPrivacy: member.invitedAt ? member.invitedAt.slice(0, 10) : '',
            telefono: member.telefono || '',
            indirizzo: member.indirizzo || '',
            email: member.email || '',
            note: member.note || 'Scheda mock censimento fratelli'
        };
    }

    private mapAccessoDaCommunityMember(member: CommunityMemberMock): AccessoApp {
        if (member.statoProfilo === 'COMPLETATO') return 'Attivo';
        if (member.statoInvito === 'INVIATO') return 'Invito inviato';
        if (member.statoProfilo === 'ARCHIVIATO') return 'Non attivo';
        return 'Da invitare';
    }

    private mapStatoDaCommunityMember(member: CommunityMemberMock): StatoMembro {
        if (member.statoProfilo === 'COMPLETATO') return 'Attivo';
        if (member.statoInvito === 'INVIATO') return 'Invitato';
        if (member.statoProfilo === 'ARCHIVIATO') return 'Non attivo';
        return 'Da completare';
    }

    private mapPrivacyDaCommunityMember(member: CommunityMemberMock): ConsensoPrivacyPilota {
        switch (member.statoPrivacy) {
            case 'COMPLETATA':
                return 'Raccolto';
            case 'INVIATA':
                return 'Inviato';
            case 'PARZIALE':
                return 'Parziale';
            case 'REVOCATA':
                return 'Revocato';
            default:
                return 'Da completare';
        }
    }

    private memberKey(membro: MembroComunitaPilota) {
        return `${membro.nome.toLowerCase()}|${membro.cognome.toLowerCase()}|${membro.email.toLowerCase()}`;
    }

    private creaMembroDaUnitaPilota(unita: UnitaMembroComunita): MembroComunitaPilota {
        const membriCompleti = unita.membri
            .map((membroUnita) => MEMBRI_COMUNITA_PILOTA.find((membro) => membro.id === membroUnita.membroId))
            .filter((membro): membro is MembroComunitaPilota => !!membro);

        if (unita.tipoUnita !== 'Coppia') {
            const membro = membriCompleti[0];
            return {
                ...(membro ?? this.creaMembroMinimo(unita.nomeVisualizzato, '', unita.emailRiferimento, unita.note)),
                id: unita.id,
                ruolo: membro?.ruolo ?? '',
                indirizzo: membro?.indirizzo ?? ''
            };
        }

        const telefoni = membriCompleti
            .filter((membro) => membro.telefono.trim())
            .map((membro) => `${membro.telefono.trim()} (${membro.nome})`);
        const emails = membriCompleti.map((membro) => membro.email.trim()).filter(Boolean);
        const carismi = [...new Set(membriCompleti.map((membro) => this.displayCarisma(membro)).filter((carisma) => carisma !== '—'))];
        const primo = membriCompleti[0];
        const nomeCoppia = membriCompleti.map((membro) => membro.nome.trim()).filter(Boolean).join(' e ') || unita.nomeVisualizzato;
        const cognomeFamiglia = primo?.cognome ?? '';

        return {
            id: unita.id,
            nome: nomeCoppia,
            cognome: cognomeFamiglia,
            nomeCompleto: cognomeFamiglia ? `${nomeCoppia} ${cognomeFamiglia}`.trim() : nomeCoppia,
            ruolo: carismi.length === 1 ? (carismi[0] as MembroComunitaPilota['ruolo']) : '',
            accessoApp: primo?.accessoApp ?? 'Da invitare',
            statoMembro: primo?.statoMembro ?? 'Attivo',
            consensoPrivacyStato: primo?.consensoPrivacyStato ?? 'Da inviare',
            moduloPrivacyInviato: membriCompleti.some((membro) => membro.moduloPrivacyInviato),
            moduloPrivacyRicevuto: membriCompleti.every((membro) => membro.moduloPrivacyRicevuto),
            dataInvioModuloPrivacy: primo?.dataInvioModuloPrivacy ?? '',
            telefono: telefoni.join('\n'),
            indirizzo: membriCompleti.find((membro) => membro.indirizzo.trim())?.indirizzo ?? '',
            email: unita.emailRiferimento || emails[0] || '',
            note: unita.note
        };
    }

    private creaMembriDaUnitaCensimento(unita: UnitaCensimentoComunita): MembroComunitaPilota[] {
        if (unita.tipoUnita === 'Coppia') {
            return [this.creaMembroCoppiaDaUnitaCensimento(unita)];
        }

        return unita.persone.map((persona, index) => ({
            id: index + 1,
            nome: persona.nome,
            cognome: persona.cognome,
            nomeCompleto: `${persona.nome} ${persona.cognome}`.trim(),
            ruolo: '',
            accessoApp: unita.statoInvito === 'Invito inviato' || unita.statoInvito === 'Inviato' ? 'Invito inviato' : 'Da invitare',
            statoMembro: 'Attivo',
            consensoPrivacyStato: unita.statoConsensi === 'Raccolto' ? 'Raccolto' : 'Da completare',
            moduloPrivacyInviato: unita.statoInvito === 'Invito inviato' || unita.statoInvito === 'Inviato',
            moduloPrivacyRicevuto: unita.statoConsensi === 'Raccolto',
            dataInvioModuloPrivacy: '',
            telefono: persona.telefono || unita.telefonoRiferimento,
            indirizzo: '',
            email: persona.email || unita.emailRiferimento,
            note: `Unità censimento: ${unita.nomeVisualizzato}`
        }));
    }

    private creaMembroCoppiaDaUnitaCensimento(unita: UnitaCensimentoComunita): MembroComunitaPilota {
        const persone = unita.persone.map((persona) => ({
            nome: persona.nome.trim(),
            cognome: persona.cognome.trim(),
            email: persona.email.trim(),
            telefono: persona.telefono.trim()
        }));
        const componenti = persone.map((persona) => `${persona.nome} ${persona.cognome}`.trim()).filter(Boolean);
        const cognomi = [...new Set(unita.persone.map((persona) => persona.cognome.trim()).filter(Boolean))];
        const emails = [...new Set(persone.map((persona) => persona.email).filter(Boolean))];
        const telefoniConNome = persone
            .filter((persona) => persona.telefono)
            .map((persona) => `${persona.telefono}${persona.nome ? ` (${persona.nome})` : ''}`);
        const nomeCoppia = persone.map((persona) => persona.nome).filter(Boolean).join(' e ') || unita.nomeVisualizzato || 'Famiglia';
        const cognomeFamiglia = persone[0]?.cognome || cognomi[0] || '';
        const nomeCompleto = cognomeFamiglia ? `${nomeCoppia} ${cognomeFamiglia}`.trim() : nomeCoppia;

        return {
            id: unita.id,
            nome: nomeCoppia,
            cognome: cognomeFamiglia || 'Coppia',
            nomeCompleto,
            ruolo: '',
            accessoApp: unita.statoInvito === 'Invito inviato' || unita.statoInvito === 'Inviato' ? 'Invito inviato' : 'Da invitare',
            statoMembro: 'Attivo',
            consensoPrivacyStato: unita.statoConsensi === 'Raccolto' ? 'Raccolto' : 'Da completare',
            moduloPrivacyInviato: unita.statoInvito === 'Invito inviato' || unita.statoInvito === 'Inviato',
            moduloPrivacyRicevuto: unita.statoConsensi === 'Raccolto',
            dataInvioModuloPrivacy: '',
            telefono: telefoniConNome.join('\n') || unita.telefonoRiferimento,
            indirizzo: '',
            email: emails[0] || unita.emailRiferimento,
            note: `Unità censimento coppia: ${unita.nomeVisualizzato}. Componenti: ${componenti.join(', ')}`
        };
    }

    private leggiEquipeCatechisti(): EquipeCatechistiUnita[] {
        const salvata = this.leggiEquipeCatechistiSalvata();
        if (salvata.length) {
            return salvata;
        }

        return this.currentCommunity.isPilot ? EQUIPE_CATECHISTI_UNITA_PILOTA.map((unita) => ({ ...unita, membri: unita.membri.map((membro) => ({ ...membro })) })) : [];
    }

    private leggiEquipeCatechistiSalvata(): EquipeCatechistiUnita[] {
        const raw = localStorage.getItem(this.equipeStorageKey());
        if (!raw) {
            return [];
        }

        try {
            return JSON.parse(raw) as EquipeCatechistiUnita[];
        } catch {
            return [];
        }
    }

    private salvaEquipeCatechisti() {
        localStorage.setItem(this.equipeStorageKey(), JSON.stringify(this.equipeCatechisti));
    }

    private equipeStorageKey() {
        return `eventiComunita.equipeCatechisti.${this.currentCommunity.numeroComunita}.${this.currentCommunity.parrocchiaId ?? 'manuale'}`;
    }

    private creaMembriDemo(): MembroComunitaPilota[] {
        return DEMO_MEMBRI.map((membro, index) => ({
            id: index + 1,
            nome: membro.nome,
            cognome: membro.cognome,
            nomeCompleto: `${membro.nome} ${membro.cognome}`,
            ruolo: membro.ruolo as MembroComunitaPilota['ruolo'],
            accessoApp: membro.accessoApp as AccessoApp,
            statoMembro: membro.stato as StatoMembro,
            consensoPrivacyStato: membro.privacy as ConsensoPrivacyPilota,
            moduloPrivacyInviato: membro.privacy === 'Raccolto',
            moduloPrivacyRicevuto: membro.privacy === 'Raccolto',
            dataInvioModuloPrivacy: '',
            telefono: '',
            indirizzo: '',
            email: '',
            note: 'Dato dimostrativo'
        }));
    }

    private creaFormVuoto(): MembroForm {
        return {
            nome: '',
            cognome: '',
            ruolo: '',
            telefono: '',
            indirizzo: '',
            email: '',
            accessoApp: 'Da invitare',
            statoMembro: 'Attivo',
            consensoPrivacyStato: 'Da inviare',
            moduloPrivacyInviato: false,
            moduloPrivacyRicevuto: false,
            note: ''
        };
    }

    private creaQuickBrotherForm(): FratelloQuickForm {
        return {
            nome: '',
            cognome: '',
            email: '',
            telefono: '',
            dataNascita: '',
            ruoloComunitario: '',
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
            emailRiferimento: '',
            indirizzo: ''
        };
    }

    private oggiIso() {
        return new Date().toISOString().slice(0, 10);
    }
}
