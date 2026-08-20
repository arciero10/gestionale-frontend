import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, inject, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import {
    POSTI_CONVIVENZA_MOCK,
    PostoConvivenza,
    ServiziPosto,
    StatoDisponibilitaPosto,
    StatoRelazione,
    TipoStrutturaMappa,
    TipologiaPosto
} from '../data/posti-convivenza.mock';
import { DEMO_POSTI } from '../../demo/demo.mock';
import { getCurrentCommunity } from '../data/community-selection.storage';
import { AuthService } from '@/auth/auth.service';
import { TIPI_CONVIVENZA_ANNUALE, TAPPE_UFFICIALI_CAMMINO } from '../data/tappe-cammino.mock';
import { canPerformAction, getUserAccessContext } from '../data/access-policy.mock';
import {
    CensimentoStrutturaMock,
    SAN_GAETANO_CENSIMENTO_LINK,
    SAN_GAETANO_CENSIMENTO_STORAGE_KEY,
    StatoSegnalazioneStruttura,
    StatoVerificaStruttura,
    StrutturaSegnalataMock,
    readStruttureSegnalate,
    writeStruttureSegnalate
} from '../../strutture/strutture-censimento.mock';
import {
    FotoStrutturaMock,
    ProfileStatus,
    StrutturaProfileMock,
    activePromo,
    fotoCopertina,
    normalizeStrutturaProfile,
    readProfileStatus,
    readStrutturaProfile
} from '../../strutture/struttura-profile.storage';
import { StructureAccreditationResponse, StructurePhotoResponse, StructureRequestCreateRequest, StruttureApiService } from '../../strutture/strutture-api.service';

type ServizioFiltro = keyof Pick<ServiziPosto, 'salaIncontri' | 'cucina' | 'parcheggio' | 'accessibilita' | 'spazioBambini'>;

interface ConvivenzaBozza {
    id: number;
    titolo: string;
    tipoConvivenza: string;
    comunitaDestinatariaNome: string;
    dataInizio: string;
    dataFine: string;
    stato: string;
    soggettoOrganizzatore: string;
    equipeOrganizzatriceNome: string;
    partecipantiPrevisti: number;
    note: string;
}

type PostoConCensimento = PostoConvivenza & {
    catalogoOrigine?: 'api' | 'locale' | 'demo';
    tipoDisplay?: string;
    censimento?: CensimentoStrutturaMock;
    segnalazione?: StrutturaSegnalataMock;
    statoCensimento?: CensimentoStrutturaMock['statoCensimento'];
    statoVerifica?: StatoVerificaStruttura;
    statoSegnalazione?: StatoSegnalazioneStruttura;
    pubblicata?: boolean;
    strutturaProfile?: StrutturaProfileMock;
    fotoCopertina?: string;
    promoAttive?: ReturnType<typeof activePromo>;
};

function formatPostiDateIt(value: string | Date | null | undefined): string {
    if (!value) return 'Da definire';
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return new Intl.DateTimeFormat('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
}

@Component({
    selector: 'app-posti-convivenza',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, SelectModule, TagModule],
    template: `
        <section class="posti-page">
            <section style="display:grid;gap:.35rem;padding:.35rem .15rem .1rem">
                <h1 style="margin:0;color:#0f172a;font-size:clamp(2rem,3vw,2.75rem);line-height:1.05">Posti di Convivenza</h1>
                <p style="margin:0;color:#475569;font-weight:700;font-size:1rem">Catalogo delle strutture approvate per convivenze, incontri e ritiri.</p>
            </section>

            <header style="position:relative;min-height:clamp(220px,30vw,340px);overflow:hidden;border-radius:22px;box-shadow:0 16px 36px rgba(15,23,42,.14)">
                <img src="assets/images/posti-convivenza/posti-convivenza-hero.jpg" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center center" />
                <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(15,23,42,0) 55%,rgba(15,23,42,.18) 100%)"></div>
            </header>

            @if (showSegnalaForm && canCreatePosto) {
                <section class="signal-card">
                    <div class="signal-head">
                        <span>Proposta struttura</span>
                        <h2>Nuovo posto</h2>
                        <p>La segnalazione resta interna: il link di censimento verrà inviato solo dall'admin piattaforma.</p>
                    </div>
                    <div class="signal-grid">
                        <label><span>Nome struttura</span><input pInputText [(ngModel)]="segnalazioneForm.nomeStruttura" /></label>
                        <label><span>Città</span><input pInputText [(ngModel)]="segnalazioneForm.citta" /></label>
                        <label class="signal-span-2"><span>Indirizzo</span><input pInputText [(ngModel)]="segnalazioneForm.indirizzo" /></label>
                        <label><span>Regione</span><input pInputText [(ngModel)]="segnalazioneForm.regione" /></label>
                        <label><span>Referente, se noto</span><input pInputText [(ngModel)]="segnalazioneForm.referente" /></label>
                        <label><span>Telefono, se noto</span><input pInputText [(ngModel)]="segnalazioneForm.telefono" /></label>
                        <label><span>Email, se nota</span><input pInputText type="email" [(ngModel)]="segnalazioneForm.email" /></label>
                        <label class="signal-span-2"><span>Note</span><textarea rows="3" [(ngModel)]="segnalazioneForm.note"></textarea></label>
                    </div>
                    @if (segnalazioneErrore) {
                        <div class="signal-error"><i class="pi pi-exclamation-triangle"></i>{{ segnalazioneErrore }}</div>
                    }
                    <footer>
                        <button pButton type="button" severity="secondary" outlined label="Annulla" (click)="toggleSegnalaForm(false)"></button>
                        <button pButton type="button" label="Salva segnalazione" icon="pi pi-save" (click)="salvaSegnalazione()"></button>
                    </footer>
                </section>
            }

            @if (convivenzaBozza) {
                <div class="convivenza-ctx-box">
                    <div class="ctx-info">
                        <i class="pi pi-calendar"></i>
                        <div>
                            <span class="ctx-label">Stai scegliendo un posto per:</span>
                            <strong>{{ convivenzaBozza.titolo }}</strong>
                            <span>{{ convivenzaBozza.comunitaDestinatariaNome }} · {{ formatDateIt(convivenzaBozza.dataInizio) }} – {{ formatDateIt(convivenzaBozza.dataFine) }}</span>
                        </div>
                    </div>
                    @if (postoPerRichiesta && canSendStructureRequest) {
                        <div class="ctx-cta">
                            <span><i class="pi pi-building"></i> <strong>{{ postoPerRichiesta.nome }}</strong> selezionato</span>
                            <button pButton type="button" label="Invia richiesta" icon="pi pi-send" (click)="apriModaleRichiesta(postoPerRichiesta)"></button>
                        </div>
                    }
                </div>
            }

            @if (pageRequestFeedbackMessage) {
                <section class="empty-state"
                    [style.border-color]="pageRequestFeedbackType === 'success' ? '#86efac' : '#fecaca'"
                    [style.background]="pageRequestFeedbackType === 'success' ? '#f0fdf4' : '#fef2f2'"
                    [style.color]="pageRequestFeedbackType === 'success' ? '#166534' : '#991b1b'">
                    <strong>{{ pageRequestFeedbackMessage }}</strong>
                </section>
            }

            @if (showFormConvivenza && canSendStructureRequest) {
                <section class="form-convivenza-inline">
                    <div class="fci-header">
                        <div class="fci-eyebrow"><i class="pi pi-send"></i> Invia richiesta alla struttura</div>
                        <p>Struttura selezionata: <strong>{{ postoPerRichiesta?.nome }}</strong></p>
                    </div>
                    <div class="fci-grid">
                        <div class="fci-field fci-col-span-2">
                            <label>Struttura selezionata</label>
                            <div class="fci-readonly">{{ postoPerRichiesta?.nome || 'Struttura da selezionare' }}</div>
                        </div>
                        <div class="fci-field">
                            <label>Nome referente</label>
                            <input pInputText [(ngModel)]="requestReferenteName" placeholder="Nome e cognome" />
                        </div>
                        <div class="fci-field">
                            <label>Email</label>
                            <input pInputText type="email" [(ngModel)]="requestEmail" placeholder="email@dominio.it" />
                        </div>
                        <div class="fci-field">
                            <label>Telefono</label>
                            <input pInputText [(ngModel)]="requestPhone" placeholder="Opzionale" />
                        </div>
                        <div class="fci-field">
                            <label>Città</label>
                            <input pInputText [(ngModel)]="requestCity" placeholder="Città" />
                        </div>
                        <div class="fci-field">
                            <label>Comunità</label>
                            <input pInputText [(ngModel)]="requestCommunityName" />
                        </div>
                        <div class="fci-field">
                            <label>Parrocchia</label>
                            <input pInputText [(ngModel)]="requestParishName" />
                        </div>
                        <div class="fci-field">
                            <label>Chi organizza</label>
                            <p-select appendTo="body" panelStyleClass="modal-dropdown-panel" [options]="chiOrganizzaOptions" [(ngModel)]="formChiOrganizza"></p-select>
                        </div>
                        @if (hasComunitaFiglie) {
                            <div class="fci-field">
                                <label>Comunità destinataria</label>
                                <p-select appendTo="body" panelStyleClass="modal-dropdown-panel" [options]="comunitaFiglieOptions" [(ngModel)]="formComunitaDestinataria" placeholder="Seleziona comunità..."></p-select>
                            </div>
                        } @else {
                            <div class="fci-field">
                                <label>Comunità destinataria</label>
                                <div class="fci-readonly">{{ comunitaNome }}</div>
                            </div>
                        }
                        <div class="fci-field fci-col-span-2">
                            <label>Tipo convivenza</label>
                            <p-select appendTo="body" panelStyleClass="modal-dropdown-panel" [options]="tipiConvivenzaForm" optionLabel="label" optionValue="value" optionDisabled="disabled" [(ngModel)]="formTipoConvivenza" placeholder="Seleziona tipo..."></p-select>
                        </div>
                        <div class="fci-field">
                            <label>Data inizio</label>
                            <input pInputText type="date" [(ngModel)]="formDataInizio" />
                        </div>
                        <div class="fci-field">
                            <label>Data fine</label>
                            <input pInputText type="date" [(ngModel)]="formDataFine" />
                        </div>
                        <div class="fci-field">
                            <label>Numero partecipanti</label>
                            <input pInputText type="number" min="1" [(ngModel)]="formPartecipanti" placeholder="Es. 35" />
                        </div>
                        <div class="fci-field">
                            <label>Adulti</label>
                            <input pInputText type="number" min="0" [(ngModel)]="requestAdults" placeholder="Opzionale" />
                        </div>
                        <div class="fci-field">
                            <label>Bambini</label>
                            <input pInputText type="number" min="0" [(ngModel)]="requestChildren" placeholder="Opzionale" />
                        </div>
                        <div class="fci-field fci-col-span-2">
                            <label>Note / esigenze particolari</label>
                            <textarea rows="3" style="width:100%;min-height:88px;resize:vertical;border:1px solid #d1d5db;border-radius:8px;padding:.62rem .75rem;color:#0f172a;font:inherit" [(ngModel)]="formNote" placeholder="Eventuali necessità specifiche..."></textarea>
                        </div>
                    </div>
                    @if (formValidationError) {
                        <div class="fci-error"><i class="pi pi-exclamation-triangle"></i> {{ formValidationError }}</div>
                    }
                    @if (requestFeedbackMessage) {
                        <div style="display:inline-flex;align-items:center;gap:.5rem;padding:.6rem .8rem;border-radius:10px;font-weight:800;font-size:.88rem"
                            [style.background]="requestFeedbackType === 'success' ? '#dcfce7' : '#fee2e2'"
                            [style.color]="requestFeedbackType === 'success' ? '#166534' : '#991b1b'">
                            <i class="pi" [class.pi-check-circle]="requestFeedbackType === 'success'" [class.pi-exclamation-triangle]="requestFeedbackType === 'error'"></i>
                            {{ requestFeedbackMessage }}
                        </div>
                    }
                    <div class="fci-actions">
                        <button pButton type="button" severity="secondary" outlined label="Annulla" (click)="chiudiFormConvivenza()"></button>
                        <button pButton type="button" label="Invia richiesta" icon="pi pi-send" [loading]="submittingStructureRequest" (click)="salvaFormConvivenzaEProcedi()"></button>
                    </div>
                </section>
            }

            <section class="stats">
                <div><span>Totale posti</span><strong>{{ posti.length }}</strong></div>
                <div><span>Filtrati</span><strong>{{ postiFiltrati().length }}</strong></div>
                <div><span>Approvate</span><strong>{{ approvedApiStructures.length }}</strong></div>
                <div><span>Da verificare</span><strong>{{ localFallbackStructures.length }}</strong></div>
                <div><span>Non disponibile</span><strong>{{ countByDisponibilita('Non disponibile') }}</strong></div>
            </section>

            @if (catalogoLoading) {
                <section class="empty-state">Caricamento catalogo strutture approvate...</section>
            } @else if (catalogoApiError) {
                <section class="empty-state">{{ catalogoApiError }}</section>
            }

            @if (!posti.length) {
                <section class="empty-state">
                    <h2>Nessuna struttura disponibile</h2>
                    <p>Non ci sono strutture approvate o posti locali da mostrare con i filtri correnti.</p>
                </section>
            }

            @if (struttureSegnalate.length) {
                <section class="reported-card">
                    <div class="reported-title">
                        <div>
                            <span>Proposte non operative</span>
                            <h2>Strutture segnalate dalla tua comunità</h2>
                        </div>
                        <strong>{{ struttureSegnalate.length }}</strong>
                    </div>
                    <div class="reported-grid">
                        @for (struttura of struttureSegnalate; track struttura.id) {
                            <article>
                                <div>
                                    <h3>{{ struttura.nomeStruttura }}</h3>
                                    <p>{{ struttura.indirizzo || 'Indirizzo da completare' }} · {{ struttura.citta || 'Città da completare' }}</p>
                                </div>
                                <dl>
                                    <div><dt>Referente</dt><dd>{{ displayValue(struttura.referente) }}</dd></div>
                                    <div><dt>Stato</dt><dd>{{ struttura.stato }}</dd></div>
                                    <div><dt>Data segnalazione</dt><dd>{{ formatDateIt(struttura.dataSegnalazione) }}</dd></div>
                                </dl>
                                <span class="local-badge census-check">Non operativa</span>
                            </article>
                        }
                    </div>
                </section>
            }

            <div class="map-layout">
                <aside class="sidebar-panel">
                    <section class="filters">
                        <input pInputText placeholder="Cerca nome, indirizzo, citta, email, referente" [(ngModel)]="filtroTesto" (ngModelChange)="aggiornaMappa()" />
                        <p-select appendTo="body" panelStyleClass="modal-dropdown-panel" [options]="zone" [(ngModel)]="filtroZona" placeholder="Zona" [showClear]="true" (onChange)="aggiornaMappa()"></p-select>
                        <p-select appendTo="body" panelStyleClass="modal-dropdown-panel" [options]="tipi" [(ngModel)]="filtroTipo" placeholder="Tipo" [showClear]="true" (onChange)="aggiornaMappa()"></p-select>
                        <input pInputText type="number" placeholder="Capienza minima" [(ngModel)]="filtroCapienza" (ngModelChange)="aggiornaMappa()" />
                        <p-select appendTo="body" panelStyleClass="modal-dropdown-panel" [options]="statiDisponibilita" [(ngModel)]="filtroDisponibilita" placeholder="Disponibilita" [showClear]="true" (onChange)="aggiornaMappa()"></p-select>
                        <div class="service-filter">
                            @for (servizio of serviziFiltri; track servizio.key) {
                                <button type="button" [class.active]="hasServizioFilter(servizio.key)" (click)="toggleServizio(servizio.key)">
                                    <i class="pi pi-check"></i>
                                    {{ servizio.label }}
                                </button>
                            }
                        </div>
                    </section>

                    <section class="list-panel">
                        @if (catalogoApiDisponibile !== false) {
                            <div class="catalog-group approved-group">
                                <div class="catalog-section-title">
                                    <div>
                                        <strong>Strutture approvate</strong>
                                        <span>Strutture censite e validate dalla segreteria.</span>
                                    </div>
                                    <em>{{ struttureApprovateFiltrate().length }}</em>
                                </div>
                                <div class="catalog-items">
                                    @for (posto of struttureApprovateFiltrate(); track posto.id) {
                                        <div role="button" tabindex="0" class="posto-item api-source"
                                            [class.active]="posto.id === selected.id"
                                            [class.flusso-selezionato]="postoPerRichiesta?.id === posto.id"
                                            (click)="select(posto, true)"
                                            (keydown.enter)="select(posto, true)">
                                            @if (hasStructurePhoto(posto)) {
                                                <img class="posto-thumb" width="72" height="54" style="width:72px;height:54px;object-fit:cover;border-radius:10px" [src]="posto.fotoCopertina" [alt]="posto.nome" />
                                            } @else {
                                                <span class="photo-empty" style="width:72px;min-height:54px;display:inline-flex;align-items:center;justify-content:center;gap:.3rem;border:1px dashed #cbd5e1;border-radius:10px;background:#f8fafc;color:#64748b;font-size:.72rem;font-weight:800"><i class="pi pi-building"></i> Nessuna foto</span>
                                            }
                                            <span class="posto-title">{{ posto.nome }}</span>
                                            <span class="posto-meta">{{ posto.tipoDisplay || posto.tipo }} · {{ posto.citta }}{{ posto.regione ? ' / ' + posto.regione : '' }}</span>
                                            <span class="posto-address">{{ posto.indirizzo || 'Indirizzo da completare' }}</span>
                                            <span class="posto-capacity">Capienza: {{ posto.capienza ?? 'Da completare' }} · Posti letto: {{ posto.strutturaProfile?.postiLetto ?? 'Da completare' }}</span>
                                            <span class="badges">
                                                <span class="local-badge disp-disponibile">Approvata</span>
                                                <span class="local-badge census-check">Verificata</span>
                                                <span class="local-badge census-received">Censita</span>
                                            </span>
                                            @if (convivenzaBozza && canSendStructureRequest) {
                                                <button type="button" class="seleziona-btn"
                                                    [class.selezionato]="postoPerRichiesta?.id === posto.id"
                                                    [disabled]="!isPostoOperativo(posto)"
                                                    (click)="$event.stopPropagation(); selezionaPerRichiesta(posto)">
                                                    @if (postoPerRichiesta?.id === posto.id) {
                                                        <i class="pi pi-check"></i> Selezionato
                                                    } @else {
                                                        Seleziona posto
                                                    }
                                                </button>
                                            }
                                        </div>
                                    } @empty {
                                        @if (!catalogoLoading) {
                                            <div class="empty-state">Nessuna struttura approvata disponibile.</div>
                                        }
                                    }
                                </div>
                            </div>
                        }

                        @if (localFallbackStructures.length) {
                            <div class="catalog-group fallback-group">
                                <div class="catalog-section-title">
                                    <div>
                                        <strong>Altri posti disponibili</strong>
                                        <span>Elenco operativo da verificare o completare.</span>
                                    </div>
                                    <em>{{ altriPostiFiltrati().length }}</em>
                                </div>
                                <div class="catalog-items">
                                    @for (posto of altriPostiFiltrati(); track posto.id) {
                                        <div role="button" tabindex="0" class="posto-item"
                                            [class.active]="posto.id === selected.id"
                                            [class.flusso-selezionato]="postoPerRichiesta?.id === posto.id"
                                            (click)="select(posto, true)"
                                            (keydown.enter)="select(posto, true)">
                                            @if (hasStructurePhoto(posto)) {
                                                <img class="posto-thumb" width="72" height="54" style="width:72px;height:54px;object-fit:cover;border-radius:10px" [src]="posto.fotoCopertina" [alt]="posto.nome" />
                                            } @else {
                                                <span class="photo-empty" style="width:72px;min-height:54px;display:inline-flex;align-items:center;justify-content:center;gap:.3rem;border:1px dashed #cbd5e1;border-radius:10px;background:#f8fafc;color:#64748b;font-size:.72rem;font-weight:800"><i class="pi pi-building"></i> Nessuna foto</span>
                                            }
                                            <span class="posto-title">{{ posto.nome }}</span>
                                            <span class="posto-meta">{{ posto.tipoDisplay || posto.tipo }} · {{ posto.citta }}{{ posto.regione ? ' / ' + posto.regione : '' }}</span>
                                            <span class="posto-address">{{ posto.indirizzo || 'Indirizzo da completare' }}</span>
                                            <span class="posto-capacity">Capienza: {{ posto.capienza ?? 'Da completare' }} · Posti letto: {{ posto.strutturaProfile?.postiLetto ?? 'Da completare' }}</span>
                                            <span class="badges">
                                                <span class="local-badge">{{ posto.tipoDisplay || posto.tipo }}</span>
                                                <span class="local-badge" [ngClass]="getDisponibilitaClass(posto.statoDisponibilita)">{{ posto.statoDisponibilita }}</span>
                                                @if (posto.statoCensimento) {
                                                    <span class="local-badge census-received">{{ posto.statoCensimento }}</span>
                                                }
                                                @if (posto.statoVerifica) {
                                                    <span class="local-badge census-check">{{ posto.statoVerifica }}</span>
                                                } @else {
                                                    <span class="local-badge census-check">Da verificare</span>
                                                }
                                            </span>
                                            @if (convivenzaBozza && canSendStructureRequest) {
                                                <button type="button" class="seleziona-btn"
                                                    [class.selezionato]="postoPerRichiesta?.id === posto.id"
                                                    [disabled]="!isPostoOperativo(posto)"
                                                    (click)="$event.stopPropagation(); selezionaPerRichiesta(posto)">
                                                    @if (postoPerRichiesta?.id === posto.id) {
                                                        <i class="pi pi-check"></i> Selezionato
                                                    } @else if (!isPostoOperativo(posto)) {
                                                        Non operativa
                                                    } @else {
                                                        Seleziona posto
                                                    }
                                                </button>
                                            }
                                        </div>
                                    }
                                    @if (!altriPostiFiltrati().length && !catalogoLoading) {
                                        <div class="empty-state">Nessun posto locale corrisponde ai filtri selezionati.</div>
                                    }
                                </div>
                            </div>
                        } @else if (catalogoApiDisponibile === false) {
                            <div class="catalog-group fallback-group">
                                <div class="catalog-section-title">
                                    <div>
                                        <strong>Altri posti disponibili</strong>
                                        <span>Elenco operativo da verificare o completare.</span>
                                    </div>
                                    <em>0</em>
                                </div>
                                <div class="empty-state">Nessun posto locale disponibile.</div>
                            </div>
                        }
                        @if (!postiFiltrati().length && !catalogoLoading) {
                            <div class="empty-state">Nessun posto corrisponde ai filtri selezionati.</div>
                        }
                    </section>
                </aside>

                <main class="map-panel">
                    <div class="map-shell">
                        <div #mapContainer class="mock-map" aria-label="Mappa strutture censite">
                            <div class="map-toolbar">
                                <span>Posizione strutture</span>
                                <strong>Mappa delle strutture approvate e dei posti disponibili.</strong>
                            </div>
                            <div class="map-grid-line line-a"></div>
                            <div class="map-grid-line line-b"></div>
                            <div class="map-district district-a"></div>
                            <div class="map-district district-b"></div>
                            <div class="map-district district-c"></div>

                            @for (marker of markersMock(); track marker.posto.id) {
                                <button
                                    type="button"
                                    class="map-marker"
                                    [class.active]="marker.posto.id === selected.id"
                                    [style.left.%]="marker.left"
                                    [style.top.%]="marker.top"
                                    [attr.aria-label]="'Seleziona ' + marker.posto.nome"
                                    (click)="select(marker.posto, true)">
                                    <span>{{ marker.posto.capienza ?? '?' }}</span>
                                </button>
                            }

                            <article class="map-popup">
                                <span>{{ selected.tipoDisplay || selected.tipo }}</span>
                                <strong>{{ selected.nome }}</strong>
                                <small>{{ selected.citta }} · {{ selected.indirizzo || 'Indirizzo da completare' }}</small>
                                <button type="button" (click)="scrollToDetail()">Dettagli</button>
                            </article>
                        </div>
                    </div>

                    <section class="detail-card" id="posto-detail">
                        <div class="detail-head">
                            <div>
                                <span class="eyebrow">{{ selected.tipoDisplay || selected.tipo }}</span>
                                <h2>{{ selected.nome }}</h2>
                                <p>{{ selected.indirizzo }} · {{ selected.citta }}</p>
                            </div>
                            <p-tag [value]="selected.statoDisponibilita" [severity]="getDisponibilitaSeverity(selected.statoDisponibilita)" />
                        </div>

                        @if (selected.statoCensimento || selected.statoVerifica) {
                            <div class="census-badges">
                                @if (selected.statoCensimento) {
                                    <span class="local-badge census-received">{{ selected.statoCensimento }}</span>
                                }
                                @if (selected.statoVerifica) {
                                    <span class="local-badge census-check">{{ selected.statoVerifica }}</span>
                                }
                            </div>
                        }

                        @if (hasStructurePhoto(selected)) {
                            <img class="detail-cover" style="width:100%;max-height:280px;object-fit:cover;border-radius:14px" [src]="selected.fotoCopertina" [alt]="selected.nome" />
                        } @else {
                            <div class="detail-cover placeholder-cover" style="min-height:92px;display:grid;place-items:center;gap:.35rem;border:1px dashed #cbd5e1;border-radius:14px;background:#f8fafc;color:#64748b;font-weight:800"><i class="pi pi-building" style="font-size:1.3rem"></i><span>Nessuna foto caricata</span></div>
                        }

                        @if (!selected.email) {
                            <div class="email-warning"><i class="pi pi-exclamation-triangle"></i><span>Email struttura mancante.</span></div>
                        }

                        <dl class="detail-grid">
                            <div><dt>Zona</dt><dd>{{ displayValue(selected.zona) }}</dd></div>
                            <div><dt>Tipo</dt><dd>{{ selected.tipoDisplay || selected.tipo }}</dd></div>
                            <div><dt>Capienza</dt><dd>{{ selected.capienza ?? 'Da completare' }}</dd></div>
                            <div><dt>Referente</dt><dd>{{ displayValue(selected.referente) }}</dd></div>
                            <div><dt>Telefono</dt><dd>{{ displayValue(selected.telefono) }}</dd></div>
                            <div><dt>Email</dt><dd>{{ displayValue(selected.email) }}</dd></div>
                            <div><dt>Stato verifica</dt><dd>{{ selected.statoDisponibilita }}</dd></div>
                        </dl>

                        @if (selected.censimento) {
                            <section class="census-detail">
                                <h3>Dati censimento struttura</h3>
                                <dl class="detail-grid">
                                    <div><dt>Posti letto</dt><dd>{{ selected.censimento.capienzaPostiLetto ?? 'Da completare' }}</dd></div>
                                    <div><dt>Camere</dt><dd>{{ selected.censimento.numeroCamere ?? 'Da completare' }}</dd></div>
                                    <div><dt>Bagni</dt><dd>{{ displayValue(selected.censimento.bagni) }}</dd></div>
                                    <div><dt>Sale incontri</dt><dd>{{ displayValue(selected.censimento.saleIncontri) }}</dd></div>
                                    <div><dt>Refettorio</dt><dd>{{ booleanLabel(selected.censimento.refettorio) }}</dd></div>
                                    <div><dt>Cappella</dt><dd>{{ booleanLabel(selected.censimento.cappella) }}</dd></div>
                                    <div><dt>Parcheggio</dt><dd>{{ booleanLabel(selected.censimento.parcheggio) }}</dd></div>
                                    <div><dt>Pasti disponibili</dt><dd>{{ displayValue(selected.censimento.pastiDisponibili) }}</dd></div>
                                </dl>
                            </section>
                        }

                        @if (selected.strutturaProfile) {
                            <section class="census-detail structure-profile-detail">
                                <h3>Dati aggiornati dalla struttura</h3>
                                <p>{{ selected.strutturaProfile.descrizione || 'Descrizione da completare.' }}</p>
                                <dl class="detail-grid">
                                    <div><dt>Posti letto</dt><dd>{{ selected.strutturaProfile.postiLetto ?? 'Da completare' }}</dd></div>
                                    <div><dt>Camere</dt><dd>{{ selected.strutturaProfile.camere ?? 'Da completare' }}</dd></div>
                                    <div><dt>Sale incontri</dt><dd>{{ displayValue(selected.strutturaProfile.sale) }}</dd></div>
                                    <div><dt>Cappella</dt><dd>{{ booleanLabel(selected.strutturaProfile.cappella) }}</dd></div>
                                    <div><dt>Mensa</dt><dd>{{ booleanLabel(selected.strutturaProfile.mensa) }}</dd></div>
                                    <div><dt>Cucina interna</dt><dd>{{ booleanLabel(selected.strutturaProfile.cucinaInterna) }}</dd></div>
                                    <div><dt>Parcheggio</dt><dd>{{ booleanLabel(selected.strutturaProfile.parcheggio) }}</dd></div>
                                    <div><dt>Accessibilità disabili</dt><dd>{{ booleanLabel(selected.strutturaProfile.accessibilitaDisabili) }}</dd></div>
                                    <div><dt>Spazi esterni</dt><dd>{{ booleanLabel(selected.strutturaProfile.spaziEsterni) }}</dd></div>
                                    <div><dt>Famiglie con bambini</dt><dd>{{ booleanLabel(selected.strutturaProfile.famiglieConBambini) }}</dd></div>
                                    <div><dt>Tariffe indicative</dt><dd>{{ displayValue(selected.strutturaProfile.tariffeIndicative) }}</dd></div>
                                    <div><dt>Caparra</dt><dd>{{ displayValue(selected.strutturaProfile.condizioniCaparra) }}</dd></div>
                                    <div><dt>Cancellazione</dt><dd>{{ displayValue(selected.strutturaProfile.condizioniCancellazione) }}</dd></div>
                                </dl>

                                @if (selected.strutturaProfile.foto.length) {
                                    <div class="structure-gallery">
                                        @for (foto of selected.strutturaProfile.foto; track foto.id) {
                                            <img [src]="photoSrc(foto)" [alt]="foto.descrizione" />
                                        }
                                    </div>
                                } @else {
                                    <div class="empty-state">Nessuna foto caricata dalla struttura.</div>
                                }

                                @if (selected.promoAttive?.length) {
                                    <div class="promo-chips">
                                        @for (promo of selected.promoAttive; track promo.id) {
                                            <span><strong>{{ promo.titolo }}</strong>{{ promo.descrizione ? ' - ' + promo.descrizione : '' }}</span>
                                        }
                                    </div>
                                }
                            </section>
                        }

                        @if (isSanGaetano(selected)) {
                            <section class="census-link-box">
                                <div>
                                    <span>Link censimento struttura</span>
                                    <code>{{ censimentoSanGaetanoLink }}</code>
                                </div>
                                <button pButton type="button" label="Copia link" icon="pi pi-copy" outlined (click)="copyCensimentoLink()"></button>
                            </section>
                        }

                        <section class="notes">
                            <h3>Note</h3>
                            <p>{{ selected.note || 'Da completare' }}</p>
                        </section>

                        <section class="history">
                            <h3>Convivenze svolte qui</h3>
                            @if (selected.storicoConvivenze.length) {
                                @for (item of selected.storicoConvivenze; track item) {
                                    <span>{{ item }}</span>
                                }
                            } @else {
                                <p>Nessuno storico registrato.</p>
                            }
                        </section>

                        <div class="actions">
                            <button pButton type="button" label="Dettaglio" icon="pi pi-info-circle" outlined></button>
                            @if (convivenzaBozza && canSendStructureRequest) {
                                <button pButton type="button" label="Seleziona e invia richiesta" icon="pi pi-send" [disabled]="!isPostoOperativo(selected)"
                                    (click)="apriModaleRichiesta(selected)"></button>
                            } @else if (canSendStructureRequest) {
                                <button pButton type="button" label="Invia richiesta" icon="pi pi-send" [disabled]="!isPostoOperativo(selected)" (click)="apriModaleRichiesta(selected)"></button>
                            }
                            @if (selected.googleMapsUrl) {
                                <a pButton [href]="selected.googleMapsUrl" target="_blank" rel="noopener" icon="pi pi-external-link" label="Apri in Google Maps" outlined></a>
                            }
                        </div>
                    </section>
                </main>
            </div>
        </section>
    `,
    styles: [
        `
            .posti-page {
                display: grid;
                gap: 1.25rem;
                min-height: 100vh;
                margin: -1rem;
                padding: 1.25rem 1.25rem 6rem;
                background: #f3f6fb;
                color: #0f172a;
                box-shadow: 0 0 0 100vmax #f3f6fb;
                clip-path: inset(0 -100vmax);
            }
            .stats { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: .75rem; }
            .stats div,
            .filters,
            .list-panel,
            .map-shell,
            .detail-card {
                background: rgba(255,255,255,.96);
                border: 1px solid #e2e8f0;
                border-radius: 18px;
                box-shadow: 0 12px 30px rgba(15,23,42,.08);
            }
            .stats div { padding: .9rem; }
            .stats span { display: block; color: #64748b; font-size: .82rem; }
            .stats strong { display: block; margin-top: .2rem; color: #111827; font-size: 1.2rem; }
            .map-layout { display: grid; grid-template-columns: minmax(420px, .8fr) minmax(0, 1.4fr); gap: 1.25rem; align-items: start; }
            .sidebar-panel { display: grid; gap: 1rem; min-width: 0; }
            .filters { display: grid; gap: .75rem; padding: 1rem; }
            .filters input,
            .filters p-select { width: 100%; }
            .service-filter { display: flex; flex-wrap: wrap; gap: .5rem; }
            .service-filter button {
                min-height: 38px;
                border: 1px solid #d7dee8;
                border-radius: 999px;
                background: #f8fafc;
                color: #334155;
                padding: .42rem .75rem;
                cursor: pointer;
                display: inline-flex;
                align-items: center;
                gap: .35rem;
                font-weight: 700;
                line-height: 1.2;
            }
            .service-filter button.active { background: #e0f2fe; border-color: #7dd3fc; color: #075985; }
            .list-panel {
                padding: .9rem;
                display: grid;
                gap: 1.1rem;
                align-content: start;
                max-height: min(78vh, 860px);
                overflow: auto;
                background: rgba(255,255,255,.98);
                scrollbar-gutter: stable;
            }
            .catalog-group,
            .catalog-items { display: grid; gap: .8rem; min-width: 0; }
            .catalog-group + .catalog-group {
                margin-top: .8rem;
                padding-top: 1rem;
                border-top: 1px solid #e2e8f0;
            }
            .catalog-section-title { display: flex; justify-content: space-between; gap: .75rem; align-items: flex-start; }
            .catalog-section-title div { display: grid; gap: .15rem; }
            .catalog-section-title strong { color: #0f172a; font-size: .98rem; }
            .catalog-section-title span { color: #64748b; font-size: .8rem; font-weight: 700; line-height: 1.3; }
            .catalog-section-title em { color: #1d4ed8; font-style: normal; font-weight: 900; }
            .posto-item {
                min-height: 140px;
                text-align: left;
                border: 1px solid #e5e7eb;
                border-radius: 12px;
                background: #fafafa;
                padding: .95rem 1rem;
                cursor: pointer;
                display: grid;
                gap: .45rem;
                align-content: start;
                color: #111827;
                line-height: 1.35;
            }
            .posto-item.api-source { border-color: #bfdbfe; background: #f8fbff; }
            .posto-item.active { border-color: #315f8f; background: #eff6ff; box-shadow: inset 3px 0 0 #315f8f; }
            .posto-item span { display: block; min-width: 0; overflow-wrap: anywhere; }
            .posto-title { color: #111827; font-weight: 850; line-height: 1.25; }
            .posto-meta,
            .posto-address,
            .posto-capacity { color: #64748b; }
            .badges { display: flex !important; flex-wrap: wrap; gap: .4rem; align-items: center; }
            .local-badge {
                display: inline-flex;
                align-items: center;
                min-height: 1.7rem;
                padding: .22rem .55rem;
                border-radius: 999px;
                background: #f1f5f9;
                color: #334155;
                border: 1px solid #e2e8f0;
                font-size: .78rem;
                font-weight: 800;
                line-height: 1.2;
            }
            .disp-disponibile { background: #dcfce7; color: #166534; border-color: #bbf7d0; }
            .disp-verificare { background: #fef3c7; color: #92400e; border-color: #fde68a; }
            .disp-non-disponibile { background: #fee2e2; color: #991b1b; border-color: #fecaca; }
            .census-received { background: #dbeafe; color: #1e40af; border-color: #bfdbfe; }
            .census-check { background: #fef3c7; color: #92400e; border-color: #fde68a; }
            .empty-state {
                border: 1px dashed #cbd5e1;
                border-radius: 12px;
                padding: 1rem;
                color: #64748b;
                text-align: center;
            }
            .map-panel { display: grid; gap: 1rem; min-width: 0; }
            .map-shell { padding: .75rem; }
            .detail-card { padding: 1.1rem; }
            .detail-head { display: flex; justify-content: space-between; gap: 1rem; align-items: flex-start; margin-bottom: 1rem; }
            .eyebrow { color: #64748b; font-weight: 800; font-size: .85rem; }
            .detail-head h2 { margin: .2rem 0 .25rem; font-size: 1.45rem; color: #111827; }
            .detail-head p { margin: 0; color: #64748b; }
            .census-badges {
                display: flex;
                flex-wrap: wrap;
                gap: .45rem;
                margin: -.35rem 0 .9rem;
            }
            .email-warning {
                display: inline-flex;
                gap: .5rem;
                align-items: center;
                margin-bottom: .9rem;
                padding: .55rem .75rem;
                border-radius: 10px;
                background: #fff7ed;
                color: #9a3412;
                font-weight: 800;
            }
            .detail-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: .75rem; margin: 0; }
            .detail-grid div { border: 1px solid #e5e7eb; border-radius: 12px; padding: .78rem; background: #fbfbf8; }
            .detail-grid dt { color: #64748b; font-size: .8rem; }
            .detail-grid dd { margin: .25rem 0 0; color: #111827; font-weight: 800; overflow-wrap: anywhere; }
            .notes h3,
            .history h3,
            .census-detail h3 { margin: 1rem 0 .55rem; color: #111827; }
            .structure-profile-detail { margin-top: 1rem; padding: 1rem; border-radius: 14px; background: #f8fafc; }
            .notes p,
            .history p { margin: 0; color: #4b5563; line-height: 1.5; }
            .census-link-box {
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: .85rem;
                flex-wrap: wrap;
                margin-top: 1rem;
                padding: .85rem;
                border: 1px solid #bfdbfe;
                border-radius: 12px;
                background: #eff6ff;
            }
            .census-link-box div { display: grid; gap: .25rem; min-width: 0; }
            .census-link-box span { color: #1e40af; font-size: .82rem; font-weight: 850; }
            .census-link-box code {
                color: #0f172a;
                font-weight: 850;
                white-space: normal;
                overflow-wrap: anywhere;
            }
            .history { display: block; }
            .history span {
                display: inline-flex;
                margin: .15rem .35rem .15rem 0;
                padding: .45rem .65rem;
                border-radius: 999px;
                background: #f1f5f9;
                color: #334155;
                font-weight: 700;
            }
            .actions { display: flex; flex-wrap: wrap; gap: .75rem; margin-top: 1.15rem; justify-content: flex-end; }
            .actions a,
            .actions button { min-height: 44px; }
            .convivenza-ctx-box {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 1rem;
                flex-wrap: wrap;
                padding: .85rem 1.1rem;
                border-radius: 14px;
                background: #eff6ff;
                border: 1px solid #bfdbfe;
            }
            .ctx-info { display: flex; align-items: flex-start; gap: .75rem; }
            .ctx-info .pi { color: #1d4ed8; font-size: 1.1rem; margin-top: .15rem; }
            .ctx-info div { display: grid; gap: .2rem; }
            .ctx-label { color: #1e40af; font-size: .8rem; font-weight: 700; text-transform: uppercase; }
            .ctx-info strong { color: #111827; font-size: 1rem; }
            .ctx-info span:last-child { color: #475569; font-size: .88rem; }
            .ctx-cta { display: flex; align-items: center; gap: .75rem; flex-wrap: wrap; }
            .ctx-cta span { color: #111827; font-size: .92rem; }
            .seleziona-btn {
                display: inline-flex;
                align-items: center;
                gap: .35rem;
                min-height: 34px;
                padding: .35rem .75rem;
                border-radius: 8px;
                border: 1px solid #315f8f;
                background: #fff;
                color: #315f8f;
                font-weight: 700;
                font-size: .82rem;
                cursor: pointer;
            }
            .seleziona-btn.selezionato { background: #dcfce7; border-color: #16a34a; color: #166534; }
            .seleziona-btn:disabled { border-color: #cbd5e1; color: #64748b; background: #f1f5f9; cursor: not-allowed; }
            .posto-item.flusso-selezionato { border-color: #16a34a; background: #f0fdf4; }

            .form-convivenza-inline {
                background: #fff;
                border: 1px solid #e5e7eb;
                border-radius: 14px;
                box-shadow: 0 10px 26px rgba(15,23,42,.06);
                padding: 1.25rem 1.5rem;
                display: grid;
                gap: 1rem;
            }
            .fci-header { display: grid; gap: .35rem; }
            .fci-eyebrow {
                display: inline-flex;
                align-items: center;
                gap: .45rem;
                color: #1e40af;
                font-size: .85rem;
                font-weight: 800;
                text-transform: uppercase;
            }
            .fci-header p { margin: 0; color: #475569; font-size: .9rem; }
            .fci-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .85rem; }
            .fci-field { display: grid; gap: .4rem; }
            .fci-field label { font-size: .82rem; font-weight: 700; color: #374151; }
            .fci-field input,
            .fci-field p-select { width: 100%; }
            .fci-col-span-2 { grid-column: span 2; }
            .fci-readonly {
                min-height: 38px;
                padding: .5rem .75rem;
                border: 1px solid #e5e7eb;
                border-radius: 8px;
                background: #f8fafc;
                color: #64748b;
                font-size: .9rem;
                display: flex;
                align-items: center;
            }
            .fci-error {
                display: inline-flex;
                align-items: center;
                gap: .5rem;
                padding: .6rem .8rem;
                border-radius: 10px;
                font-weight: 800;
                font-size: .88rem;
            }
            .fci-error { background: #fff7ed; color: #9a3412; }
            .fci-actions {
                display: flex;
                justify-content: flex-end;
                gap: .75rem;
                flex-wrap: wrap;
            }
            .fci-actions button { min-height: 44px; }

            @media (max-width: 1200px) {
                .stats { grid-template-columns: repeat(3, minmax(0, 1fr)); }
                .map-layout { grid-template-columns: 1fr; }
                .list-panel { max-height: none; }
                .detail-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
            }
            @media (max-width: 767px) {
                .fci-grid,
                .signal-grid,
                .reported-grid { grid-template-columns: 1fr; }
                .fci-col-span-2 { grid-column: span 1; }
                .signal-span-2 { grid-column: span 1; }
                .actions { flex-direction: column; }
                .actions a,
                .actions button { width: 100%; }
                .stats,
                .detail-grid { grid-template-columns: 1fr; }
                .service-filter button { flex: 1 1 100%; justify-content: center; }
                .mock-map { min-height: 360px; height: 420px; }
                .posto-item { min-height: auto; padding: 1rem; }
                .detail-head { flex-direction: column; }
            }
        `
    ]
})
export class PostiConvivenza implements OnInit {
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly authService = inject(AuthService);
    private readonly struttureApi = inject(StruttureApiService);
    readonly userAccessContext = getUserAccessContext();
    readonly canCreatePosto = canPerformAction('nuovo-posto', this.userAccessContext);
    readonly canSendStructureRequest = canPerformAction('invia-richiesta-struttura', this.userAccessContext);

    @ViewChild('mapContainer') private mapContainer?: ElementRef<HTMLDivElement>;

    readonly statiRelazione: StatoRelazione[] = ['Da verificare', 'Censito internamente', 'Interessato al progetto', 'Partner attivo', 'Non disponibile'];
    readonly statiDisponibilita: StatoDisponibilitaPosto[] = ['Disponibile', 'Da verificare', 'Non disponibile'];
    readonly tipologie: TipologiaPosto[] = ['Casa di convivenza', 'Parrocchia', 'Istituto religioso', 'Casa per ritiri', 'Albergo / pensione', 'Altro'];
    readonly serviziFiltri: { key: ServizioFiltro; label: string }[] = [
        { key: 'salaIncontri', label: 'Sala incontri' },
        { key: 'cucina', label: 'Cucina' },
        { key: 'parcheggio', label: 'Parcheggio' },
        { key: 'accessibilita', label: 'Accessibilita' },
        { key: 'spazioBambini', label: 'Spazio bambini' }
    ];
    readonly censimentoSanGaetanoLink = SAN_GAETANO_CENSIMENTO_LINK;
    approvedApiStructures: PostoConCensimento[] = [];
    localFallbackStructures: PostoConCensimento[] = this.isDemo ? this.creaPostiDemo() : this.creaPostiConCensimento();
    posti: PostoConCensimento[] = [...this.localFallbackStructures];
    struttureSegnalate = this.isDemo ? [] : readStruttureSegnalate().filter((item) => !item.pubblicata && item.stato !== 'Scartata');
    tipi: TipoStrutturaMappa[] = this.createTipiOptions();
    zone: string[] = this.createZoneOptions();

    filtroTesto = '';
    filtroZona: string | null = null;
    filtroCapienza: number | null = null;
    filtroTipo: TipoStrutturaMappa | null = null;
    filtroDisponibilita: StatoDisponibilitaPosto | null = null;
    serviziSelezionati: ServizioFiltro[] = [];
    selected: PostoConCensimento = this.posti[0] ?? this.createEmptyPosto();

    readonly formatDateIt = formatPostiDateIt;

    private readonly currentCommunity = getCurrentCommunity();
    readonly comunitaNome = `${this.currentCommunity.nomeComunita} – ${this.currentCommunity.parrocchiaNome}`;
    readonly hasComunitaFiglie = (this.currentCommunity.comunitaFiglieAssociate?.length ?? 0) > 0;
    readonly comunitaFiglieOptions = (this.currentCommunity.comunitaFiglieAssociate ?? []).map(
        (f) => `${f.nomeComunita} – ${f.parrocchiaNome}`
    );
    readonly chiOrganizzaOptions = ['Comunità', 'Equipe dei catechisti'];
    readonly tipiConvivenzaForm = [
        { label: '── Convivenze annuali ──', value: null, disabled: true },
        ...TIPI_CONVIVENZA_ANNUALE.map((t) => ({ label: t, value: t, disabled: false })),
        { label: '── Tappe catechistiche ──', value: null, disabled: true },
        ...TAPPE_UFFICIALI_CAMMINO.map((t) => ({ label: t, value: t, disabled: false }))
    ];

    convivenzaBozza: ConvivenzaBozza | null = null;
    postoPerRichiesta: PostoConCensimento | null = null;

    showFormConvivenza = false;
    formChiOrganizza = 'Comunità';
    formComunitaDestinataria = '';
    formTipoConvivenza: string | null = null;
    formDataInizio = '';
    formDataFine = '';
    formPartecipanti: number | null = null;
    formNote = '';
    formValidationError = '';
    requestReferenteName = '';
    requestEmail = '';
    requestPhone = '';
    requestCommunityName = '';
    requestParishName = '';
    requestCity = '';
    requestAdults: number | null = null;
    requestChildren: number | null = null;
    requestFeedbackMessage = '';
    requestFeedbackType: 'success' | 'error' | '' = '';
    pageRequestFeedbackMessage = '';
    pageRequestFeedbackType: 'success' | 'error' | '' = '';
    submittingStructureRequest = false;
    showSegnalaForm = false;
    segnalazioneErrore = '';
    segnalazioneForm = this.createEmptySegnalazioneForm();
    catalogoLoading = false;
    catalogoApiError = '';
    catalogoApiDisponibile: boolean | null = this.isDemo ? false : null;

    get isDemo() {
        const url = this.router.url.split('?')[0].split('#')[0];
        return this.route.snapshot.data['demo'] === true || url === '/demo' || url.startsWith('/demo/');
    }

    get mappaRoute() {
        return this.isDemo ? '/demo/posti-convivenza/mappa' : '/gestionale-cn/posti-convivenza/mappa';
    }

    ngOnInit() {
        this.caricaCatalogoStruttureReale();

        const param = this.route.snapshot.queryParamMap.get('convivenzaId');
        if (param) {
            const id = Number(param);
            const raw = localStorage.getItem(`bozza-convivenza-${id}`);
            if (raw) {
                try {
                    this.convivenzaBozza = JSON.parse(raw) as ConvivenzaBozza;
                } catch {
                    this.convivenzaBozza = null;
                }
            }
        }
    }

    private caricaCatalogoStruttureReale() {
        if (this.isDemo) {
            this.localFallbackStructures = this.posti;
            return;
        }

        this.catalogoLoading = true;
        this.catalogoApiError = '';
        this.catalogoApiDisponibile = null;

        this.struttureApi.getCatalogStructures().subscribe({
            next: (strutture) => {
                const catalogoReale = (Array.isArray(strutture) ? strutture : [])
                    .map((struttura, index) => this.creaPostoDaApiStructure(struttura, index));

                this.approvedApiStructures = catalogoReale;
                this.localFallbackStructures = this.rimuoviDuplicatiLocali(this.creaPostiConCensimento(), catalogoReale);
                this.catalogoApiDisponibile = true;
                this.catalogoApiError = '';
                this.setPosti([...this.approvedApiStructures, ...this.localFallbackStructures]);
            },
            error: (error) => {
                console.error('[Posti di Convivenza] Catalogo approvato API non disponibile', error);
                this.approvedApiStructures = [];
                this.localFallbackStructures = this.creaPostiConCensimento();
                this.catalogoApiDisponibile = false;
                this.catalogoApiError = 'Catalogo approvato non disponibile. Viene mostrato l’elenco locale di supporto.';
                this.setPosti(this.localFallbackStructures);
                this.catalogoLoading = false;
            },
            complete: () => {
                this.catalogoLoading = false;
            }
        });
    }

    private setPosti(posti: PostoConCensimento[]) {
        this.posti = posti;
        this.tipi = this.createTipiOptions();
        this.zone = this.createZoneOptions();
        this.selected = this.posti[0] ?? this.createEmptyPosto();
        this.aggiornaMappa();
    }

    select(posto: PostoConCensimento, centerMap = false) {
        this.selected = posto;
        this.aggiornaMappa(centerMap);
    }

    apriModaleRichiesta(posto: PostoConCensimento | null) {
        if (!posto || !this.canSendStructureRequest || !this.isPostoOperativo(posto)) {
            return;
        }

        this.postoPerRichiesta = posto;
        this.select(posto, true);
        this.preparaFormRichiestaDaContesto();
        this.pageRequestFeedbackMessage = '';
        this.pageRequestFeedbackType = '';
        this.showFormConvivenza = true;
        setTimeout(() => {
            document.querySelector('.form-convivenza-inline')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 50);
    }

    private preparaFormRichiestaDaContesto() {
        const authState = this.authService.state();
        const fullName = [authState.firstName, authState.lastName].filter(Boolean).join(' ').trim();
        this.formChiOrganizza = 'Comunità';
        this.formComunitaDestinataria = this.comunitaNome;
        this.requestReferenteName = this.requestReferenteName || fullName;
        this.requestEmail = this.requestEmail || authState.email || '';
        this.requestPhone = this.requestPhone || '';
        this.requestCommunityName = this.convivenzaBozza?.comunitaDestinatariaNome || this.comunitaNome;
        this.requestParishName = this.currentCommunity.parrocchiaNome || '';
        this.requestCity = this.currentCommunity.comune || this.postoPerRichiesta?.citta || '';
        this.formTipoConvivenza = this.convivenzaBozza?.tipoConvivenza || null;
        this.formDataInizio = this.convivenzaBozza?.dataInizio || '';
        this.formDataFine = this.convivenzaBozza?.dataFine || '';
        this.formPartecipanti = this.convivenzaBozza?.partecipantiPrevisti || null;
        this.formNote = this.convivenzaBozza?.note || '';
        this.requestAdults = null;
        this.requestChildren = null;
        this.formValidationError = '';
        this.requestFeedbackMessage = '';
        this.requestFeedbackType = '';
    }

    chiudiFormConvivenza() {
        this.showFormConvivenza = false;
        this.postoPerRichiesta = null;
        this.formValidationError = '';
        this.requestFeedbackMessage = '';
        this.requestFeedbackType = '';
    }

    salvaFormConvivenzaEProcedi() {
        if (this.submittingStructureRequest) {
            return;
        }

        const validation = this.validateStructureRequestForm();
        if (validation) {
            this.formValidationError = validation;
            this.requestFeedbackMessage = '';
            this.requestFeedbackType = '';
            return;
        }

        if (!this.postoPerRichiesta || !this.formTipoConvivenza || !this.formPartecipanti) {
            this.formValidationError = 'Seleziona una struttura e compila i dati della richiesta.';
            return;
        }

        if (this.formDataFine < this.formDataInizio) {
            this.formValidationError = 'La data di fine deve essere uguale o successiva a quella di inizio.';
            return;
        }

        this.formValidationError = '';

        const comunitaDestinatariaNome = this.hasComunitaFiglie
            ? (this.formComunitaDestinataria || this.comunitaNome)
            : this.comunitaNome;

        if (!this.convivenzaBozza) {
            const id = Date.now();
            const bozza: ConvivenzaBozza = {
                id,
                titolo: this.formTipoConvivenza,
                tipoConvivenza: this.formTipoConvivenza,
                comunitaDestinatariaNome,
                dataInizio: this.formDataInizio,
                dataFine: this.formDataFine,
                stato: 'Bozza',
                soggettoOrganizzatore: this.formChiOrganizza,
                equipeOrganizzatriceNome: this.formChiOrganizza === 'Equipe dei catechisti' ? 'Equipe dei catechisti' : '',
                partecipantiPrevisti: Number(this.formPartecipanti),
                note: this.formNote
            };

            localStorage.setItem(`bozza-convivenza-${id}`, JSON.stringify(bozza));
            this.convivenzaBozza = bozza;
        }

        this.inviaRichiestaReale();
    }

    selezionaPerRichiesta(posto: PostoConCensimento) {
        if (!this.isPostoOperativo(posto)) {
            return;
        }

        this.postoPerRichiesta = posto;
        this.select(posto, true);
    }

    private inviaRichiestaReale() {
        if (!this.postoPerRichiesta || !this.formTipoConvivenza || !this.formPartecipanti) {
            return;
        }

        const posto = this.postoPerRichiesta;
        const payload: StructureRequestCreateRequest = {
            structureId: posto.catalogoOrigine === 'api' && posto.id > 0 ? posto.id : null,
            structureName: posto.nome,
            requestedByName: this.requestReferenteName.trim(),
            requestedByEmail: this.requestEmail.trim(),
            requestedByPhone: this.requestPhone.trim() || null,
            communityName: this.requestCommunityName.trim() || this.convivenzaBozza?.comunitaDestinatariaNome || this.comunitaNome,
            parishName: this.requestParishName.trim() || this.currentCommunity.parrocchiaNome,
            city: this.requestCity.trim() || this.currentCommunity.comune || posto.citta,
            eventType: this.formTipoConvivenza,
            convivenzaType: this.formTipoConvivenza,
            startDate: this.toApiDate(this.formDataInizio),
            endDate: this.toApiDate(this.formDataFine),
            peopleCount: Number(this.formPartecipanti),
            adultsCount: this.toOptionalNumber(this.requestAdults),
            childrenCount: this.toOptionalNumber(this.requestChildren),
            notes: this.formNote.trim() || null
        };

        this.submittingStructureRequest = true;
        this.requestFeedbackMessage = '';
        this.requestFeedbackType = '';

        this.struttureApi.createStructureRequest(payload).subscribe({
            next: (response) => {
                this.pageRequestFeedbackType = 'success';
                this.pageRequestFeedbackMessage = 'Richiesta inviata correttamente. La segreteria prenderà in carico la richiesta.';

                if (this.convivenzaBozza) {
                    const convivenzaAggiornata: ConvivenzaBozza = { ...this.convivenzaBozza, stato: 'In richiesta' };
                    localStorage.setItem(`bozza-convivenza-${convivenzaAggiornata.id}`, JSON.stringify(convivenzaAggiornata));
                    this.convivenzaBozza = convivenzaAggiornata;
                }

                localStorage.setItem(`structure-request-${response.id}`, JSON.stringify(response));
                this.showFormConvivenza = false;
                this.postoPerRichiesta = null;
                this.requestFeedbackMessage = '';
                this.requestFeedbackType = '';
            },
            error: (error) => {
                console.error('[Posti di Convivenza] Invio richiesta struttura non riuscito', error);
                this.requestFeedbackType = 'error';
                this.requestFeedbackMessage = 'Non è stato possibile inviare la richiesta. Riprova più tardi.';
            },
            complete: () => {
                this.submittingStructureRequest = false;
            }
        });
    }

    private validateStructureRequestForm() {
        if (!this.postoPerRichiesta) return 'Seleziona una struttura.';
        if (!this.requestReferenteName.trim()) return 'Il nome referente è obbligatorio.';
        if (!this.requestEmail.trim()) return 'L’email è obbligatoria.';
        if (!this.formTipoConvivenza) return 'Il tipo convivenza è obbligatorio.';
        if (!this.formDataInizio) return 'La data di inizio è obbligatoria.';
        if (!this.formDataFine) return 'La data di fine è obbligatoria.';
        if (!this.formPartecipanti || Number(this.formPartecipanti) <= 0) return 'Il numero persone è obbligatorio.';
        return '';
    }

    private toApiDate(value: string) {
        return `${value}T00:00:00.000Z`;
    }

    private toOptionalNumber(value: number | null) {
        return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null;
    }

    toggleServizio(servizio: ServizioFiltro) {
        this.serviziSelezionati = this.hasServizioFilter(servizio) ? this.serviziSelezionati.filter((item) => item !== servizio) : [...this.serviziSelezionati, servizio];
        this.aggiornaMappa();
    }

    hasServizioFilter(servizio: ServizioFiltro) {
        return this.serviziSelezionati.includes(servizio);
    }

    countByDisponibilita(stato: StatoDisponibilitaPosto) {
        return this.posti.filter((posto) => posto.statoDisponibilita === stato).length;
    }

    postiFiltrati() {
        const testo = this.filtroTesto.trim().toLowerCase();

        return this.posti.filter((posto) => {
            const haystack = `${posto.nome} ${posto.indirizzo} ${posto.citta} ${posto.email} ${posto.referente}`.toLowerCase();
            const matchTesto = !testo || haystack.includes(testo);
            const matchZona = !this.filtroZona || posto.zona === this.filtroZona || posto.citta === this.filtroZona;
            const matchCapienza = !this.filtroCapienza || (posto.capienza != null && posto.capienza >= this.filtroCapienza);
            const matchTipo = !this.filtroTipo || posto.tipo === this.filtroTipo;
            const matchDisponibilita = !this.filtroDisponibilita || posto.statoDisponibilita === this.filtroDisponibilita;
            const matchServizi = this.serviziSelezionati.every((servizio) => posto.servizi[servizio]);
            return matchTesto && matchZona && matchCapienza && matchTipo && matchDisponibilita && matchServizi;
        });
    }

    struttureApprovateFiltrate() {
        return this.postiFiltrati().filter((posto) => posto.catalogoOrigine === 'api');
    }

    altriPostiFiltrati() {
        return this.postiFiltrati().filter((posto) => posto.catalogoOrigine !== 'api');
    }

    displayValue(value: string | null) {
        return value && value.trim() ? value : 'Da completare';
    }

    toggleSegnalaForm(force?: boolean) {
        if (!this.canCreatePosto) {
            return;
        }

        this.showSegnalaForm = force ?? !this.showSegnalaForm;
        this.segnalazioneErrore = '';
        if (!this.showSegnalaForm) {
            this.segnalazioneForm = this.createEmptySegnalazioneForm();
        }
    }

    salvaSegnalazione() {
        if (!this.canCreatePosto) {
            return;
        }

        const nome = this.segnalazioneForm.nomeStruttura.trim();
        if (!nome) {
            this.segnalazioneErrore = 'Inserisci almeno il nome della struttura.';
            return;
        }

        const segnalazioni = readStruttureSegnalate();
        const nuova: StrutturaSegnalataMock = {
            id: `segnalata-${Date.now()}`,
            nomeStruttura: nome,
            indirizzo: this.segnalazioneForm.indirizzo.trim(),
            citta: this.segnalazioneForm.citta.trim(),
            regione: this.segnalazioneForm.regione.trim() || 'Lazio',
            referente: this.segnalazioneForm.referente.trim(),
            telefono: this.segnalazioneForm.telefono.trim(),
            email: this.segnalazioneForm.email.trim(),
            note: this.segnalazioneForm.note.trim(),
            origine: 'Segnalata da comunità',
            propostaDa: 'Responsabile comunità',
            comunita: this.comunitaNome,
            stato: 'Segnalazione ricevuta',
            pubblicata: false,
            invitoInviato: false,
            tokenCensimento: '',
            statoVerifica: 'Da verificare',
            statoDisponibilita: 'Da verificare',
            dataSegnalazione: new Date().toISOString()
        };

        // Fase futura API: POST /api/admin/strutture/segnalazioni con stato iniziale non pubblicato.
        writeStruttureSegnalate([nuova, ...segnalazioni]);
        this.struttureSegnalate = [nuova, ...this.struttureSegnalate];
        this.segnalazioneForm = this.createEmptySegnalazioneForm();
        this.showSegnalaForm = false;
    }

    isPostoOperativo(posto: PostoConCensimento) {
        return posto.pubblicata === true;
    }

    booleanLabel(value: boolean) {
        return value ? 'Sì' : 'No';
    }

    isSanGaetano(posto: PostoConvivenza) {
        return posto.nome.trim().toLowerCase() === 'san gaetano';
    }

    copyCensimentoLink() {
        navigator.clipboard?.writeText(this.censimentoSanGaetanoLink);
    }

    photoSrc(foto: FotoStrutturaMock) {
        return foto.dataUrl || foto.url || '/images/backgrounds/posti-convivenza-bg.jpg';
    }

    hasStructurePhoto(posto: PostoConCensimento | null | undefined) {
        const photos = posto?.strutturaProfile?.foto;
        if (Array.isArray(photos)) {
            return photos.some((foto) => Boolean(foto?.dataUrl || foto?.url));
        }
        return Boolean(posto?.fotoCopertina && !posto.fotoCopertina.includes('posti-convivenza-bg.jpg'));
    }

    getDisponibilitaSeverity(stato: StatoDisponibilitaPosto) {
        switch (stato) {
            case 'Disponibile':
                return 'success';
            case 'Non disponibile':
                return 'danger';
            default:
                return 'warn';
        }
    }

    getDisponibilitaClass(stato: StatoDisponibilitaPosto) {
        switch (stato) {
            case 'Disponibile':
                return 'disp-disponibile';
            case 'Non disponibile':
                return 'disp-non-disponibile';
            default:
                return 'disp-verificare';
        }
    }

    aggiornaMappa(centerSelected = false) {
        const filtrati = this.postiFiltrati();
        if (!centerSelected && filtrati.length && !filtrati.some((posto) => posto.id === this.selected.id)) {
            this.selected = filtrati[0];
        }
    }

    markersMock() {
        const posti = this.postiFiltrati();
        if (!posti.length) {
            return [];
        }

        const lats = posti.map((posto) => posto.lat);
        const lngs = posti.map((posto) => posto.lng);
        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);
        const minLng = Math.min(...lngs);
        const maxLng = Math.max(...lngs);
        const latRange = maxLat - minLat || 1;
        const lngRange = maxLng - minLng || 1;

        return posti.map((posto) => ({
            posto,
            left: 10 + ((posto.lng - minLng) / lngRange) * 80,
            top: 86 - ((posto.lat - minLat) / latRange) * 72
        }));
    }

    scrollToDetail() {
        document.querySelector('#posto-detail')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    googleMapsUrl(posto: PostoConCensimento) {
        if (posto.latitudine != null && posto.longitudine != null) {
            return `https://www.google.com/maps/search/?api=1&query=${posto.latitudine},${posto.longitudine}`;
        }
        return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${posto.nome}, ${posto.indirizzo}, ${posto.citta}`)}`;
    }

    private creaPostiConCensimento(): PostoConCensimento[] {
        const censimento = this.readSanGaetanoCensimento();
        const strutturaProfile = readStrutturaProfile();
        const profileStatus = readProfileStatus();

        const postiBase = POSTI_CONVIVENZA_MOCK.map((posto) => {
            if (!censimento || !this.isSanGaetano(posto)) {
                return { ...posto, pubblicata: true };
            }

            return {
                ...posto,
                nome: censimento.nomeStruttura || posto.nome,
                tipo: 'Struttura di accoglienza' as TipoStrutturaMappa,
                indirizzo: censimento.indirizzo || posto.indirizzo,
                indirizzoNormalizzato: censimento.indirizzo || posto.indirizzoNormalizzato,
                citta: censimento.citta || posto.citta,
                regione: censimento.regione || posto.regione,
                zona: censimento.citta || posto.zona,
                referente: censimento.referente || posto.referente,
                telefono: censimento.telefono || posto.telefono,
                email: censimento.email || posto.email,
                capienza: censimento.capienzaPostiLetto ?? posto.capienza,
                statoRelazione: (censimento.pubblicata ? 'Partner attivo' : 'Da verificare') as StatoRelazione,
                statoDisponibilita: censimento.statoDisponibilita as StatoDisponibilitaPosto,
                note: censimento.noteOrganizzative || posto.note,
                servizi: {
                    ...posto.servizi,
                    camere: true,
                    salaIncontri: Boolean(censimento.saleIncontri?.trim()),
                    cucina: censimento.refettorio,
                    parcheggio: censimento.parcheggio
                },
                censimento,
                statoCensimento: censimento.statoCensimento,
                statoVerifica: censimento.statoVerifica,
                pubblicata: censimento.pubblicata
            };
        });

        if (!strutturaProfile) {
            return this.normalizzaPostiLocali(postiBase.filter((posto) => posto.pubblicata === true));
        }

        const postoProfilo = this.creaPostoDaStrutturaProfile(strutturaProfile, profileStatus);
        const senzaDuplicato = postiBase.filter((posto) => posto.nome.trim().toLowerCase() !== postoProfilo.nome.trim().toLowerCase());
        return this.normalizzaPostiLocali([postoProfilo, ...senzaDuplicato].filter((posto) => posto.pubblicata === true));
    }

    private normalizzaPostiLocali(posti: PostoConCensimento[]) {
        return posti.map((posto, index) => ({
            ...posto,
            id: posto.id >= 50000 ? posto.id : 50000 + index,
            catalogoOrigine: 'locale' as const,
            statoVerifica: posto.statoVerifica ?? 'Da verificare'
        }));
    }

    private rimuoviDuplicatiLocali(locali: PostoConCensimento[], api: PostoConCensimento[]) {
        const chiaviApi = new Set(api.map((posto) => this.catalogoKey(posto)));
        return locali.filter((posto) => !chiaviApi.has(this.catalogoKey(posto)));
    }

    private catalogoKey(posto: PostoConCensimento) {
        return `${posto.nome}|${posto.citta}|${posto.indirizzo}`.trim().toLowerCase();
    }

    private createEmptyPosto(): PostoConCensimento {
        return {
            id: -1,
            nome: 'Nessuna struttura disponibile',
            tipo: 'Struttura di accoglienza',
            tipologia: 'Casa di convivenza',
            zona: 'Da completare',
            citta: 'Da completare',
            regione: 'Da completare',
            indirizzo: '',
            indirizzoNormalizzato: '',
            capienza: null,
            referente: '',
            telefono: '',
            email: '',
            sitoWeb: '',
            statoRelazione: 'Da verificare',
            statoDisponibilita: 'Da verificare',
            note: 'Il catalogo mostra solo strutture approvate dal Global Admin.',
            latitudine: null,
            longitudine: null,
            lat: 41.9028,
            lng: 12.4964,
            placeId: null,
            googleMapsUrl: '',
            ultimoContatto: null,
            storicoConvivenze: [],
            servizi: {
                camere: false,
                salaIncontri: false,
                cucina: false,
                parcheggio: false,
                accessibilita: false,
                spazioBambini: false
            },
            valutazioneInterna: 'non valutato',
            pubblicata: false,
            catalogoOrigine: 'locale',
            fotoCopertina: '/images/backgrounds/posti-convivenza-bg.jpg',
            promoAttive: []
        };
    }

    private creaPostoDaStrutturaProfile(profile: StrutturaProfileMock, status: ProfileStatus): PostoConCensimento {
        const lat = 41.9028;
        const lng = 12.4964;
        const pubblicata = status === 'APPROVATA';
        return {
            id: 9500,
            nome: profile.nome,
            tipo: (profile.tipo || 'Struttura di accoglienza') as TipoStrutturaMappa,
            tipologia: 'Casa di convivenza',
            zona: profile.citta || profile.regione || 'Da verificare',
            citta: profile.citta || 'Da verificare',
            regione: profile.regione || 'Da verificare',
            indirizzo: profile.indirizzo,
            indirizzoNormalizzato: profile.indirizzo,
            capienza: profile.capienza,
            referente: profile.referente,
            telefono: profile.telefono,
            email: profile.email,
            sitoWeb: '',
            statoRelazione: (pubblicata ? 'Partner attivo' : 'Da verificare') as StatoRelazione,
            statoDisponibilita: (pubblicata ? 'Disponibile' : 'Da verificare') as StatoDisponibilitaPosto,
            note: profile.descrizione,
            latitudine: lat,
            longitudine: lng,
            lat,
            lng,
            placeId: null,
            googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${profile.nome}, ${profile.indirizzo}, ${profile.citta}, ${profile.regione}`)}`,
            ultimoContatto: profile.updatedAt || null,
            storicoConvivenze: [],
            servizi: {
                camere: Boolean(profile.camere),
                salaIncontri: Boolean(profile.sale?.trim()),
                cucina: profile.cucinaInterna || profile.mensa,
                parcheggio: profile.parcheggio,
                accessibilita: profile.accessibilitaDisabili,
                spazioBambini: profile.famiglieConBambini
            },
            valutazioneInterna: pubblicata ? 'positivo' : 'da verificare',
            strutturaProfile: profile,
            fotoCopertina: fotoCopertina(profile),
            promoAttive: activePromo(profile),
            statoVerifica: pubblicata ? 'Verificata' : 'Da verificare',
            pubblicata
        };
    }

    private creaPostoDaApiStructure(struttura: StructureAccreditationResponse, index: number): PostoConCensimento {
        const profile = this.toStrutturaProfile(struttura);
        const [lat, lng] = this.coordinateApiFallback(struttura, index);

        return {
            id: struttura.id,
            nome: struttura.name || 'Struttura senza nome',
            tipo: this.toTipoStruttura(struttura.type),
            tipoDisplay: struttura.type || 'Struttura di accoglienza',
            tipologia: this.toTipologiaPosto(struttura.type),
            zona: struttura.city || struttura.region || 'Da completare',
            citta: struttura.city || 'Da completare',
            regione: struttura.region || 'Da completare',
            indirizzo: struttura.googleFormattedAddress || struttura.address || '',
            indirizzoNormalizzato: struttura.googleFormattedAddress || struttura.address || '',
            capienza: this.toNullableNumber(struttura.capacity),
            referente: struttura.referentName || '',
            telefono: struttura.phone || '',
            email: struttura.email || '',
            sitoWeb: '',
            statoRelazione: 'Partner attivo',
            statoDisponibilita: 'Disponibile',
            note: struttura.description || 'Struttura approvata dal Global Admin.',
            latitudine: lat,
            longitudine: lng,
            lat,
            lng,
            placeId: struttura.googlePlaceId || null,
            googleMapsUrl: this.googleMapsUrlFromStructure(struttura, lat, lng),
            ultimoContatto: struttura.updatedAt || struttura.approvedAt || struttura.createdAt || null,
            storicoConvivenze: [],
            servizi: {
                camere: this.toNullableNumber(struttura.rooms) !== null,
                salaIncontri: this.toNullableNumber(struttura.halls) !== null,
                cucina: Boolean(struttura.hasInternalKitchen || struttura.hasCanteen),
                parcheggio: Boolean(struttura.hasParking),
                accessibilita: Boolean(struttura.hasDisabledAccess),
                spazioBambini: Boolean(struttura.acceptsFamiliesWithChildren)
            },
            valutazioneInterna: 'positivo',
            strutturaProfile: profile,
            fotoCopertina: fotoCopertina(profile),
            promoAttive: [],
            statoVerifica: 'Verificata',
            catalogoOrigine: 'api',
            pubblicata: true
        };
    }

    private toStrutturaProfile(struttura: StructureAccreditationResponse): StrutturaProfileMock {
        return normalizeStrutturaProfile({
            id: `api-${struttura.id}`,
            nome: struttura.name || 'Struttura senza nome',
            tipo: struttura.type || 'Struttura di accoglienza',
            descrizione: struttura.description || '',
            indirizzo: struttura.address || '',
            citta: struttura.city || '',
            regione: struttura.region || '',
            referente: struttura.referentName || '',
            telefono: struttura.phone || '',
            email: struttura.email || '',
            capienza: this.toNullableNumber(struttura.capacity),
            postiLetto: this.toNullableNumber(struttura.beds),
            camere: this.toNullableNumber(struttura.rooms),
            sale: this.toSaleLabel(struttura.halls),
            cappella: Boolean(struttura.hasChapel),
            mensa: Boolean(struttura.hasCanteen),
            cucinaInterna: Boolean(struttura.hasInternalKitchen),
            parcheggio: Boolean(struttura.hasParking),
            accessibilitaDisabili: Boolean(struttura.hasDisabledAccess),
            spaziEsterni: Boolean(struttura.hasOutdoorSpaces),
            famiglieConBambini: Boolean(struttura.acceptsFamiliesWithChildren),
            tariffeIndicative: struttura.indicativeRates || '',
            condizioniCaparra: struttura.depositConditions || '',
            condizioniCancellazione: struttura.cancellationConditions || '',
            foto: this.toFotoStruttura(struttura.photos),
            promo: [],
            updatedAt: struttura.updatedAt || struttura.approvedAt || struttura.createdAt || new Date().toISOString()
        });
    }

    private toFotoStruttura(photos: StructurePhotoResponse[] | null | undefined): FotoStrutturaMock[] {
        return (Array.isArray(photos) ? photos : [])
            .filter((foto) => Boolean(foto?.url))
            .map((foto) => ({
                id: String(foto.id),
                categoria: foto.category as FotoStrutturaMock['categoria'],
                url: foto.url,
                descrizione: foto.description || foto.category || 'Foto struttura',
                copertina: Boolean(foto.isCover),
                isCover: Boolean(foto.isCover),
                createdAt: foto.createdAt || ''
            }));
    }

    private toTipoStruttura(value: string | null | undefined): TipoStrutturaMappa {
        const normalized = (value || '').trim().toLowerCase();
        if (normalized.includes('hotel') || normalized.includes('albergo')) {
            return 'Hotel';
        }
        if (normalized.includes('parrocchia')) {
            return 'Parrocchia';
        }
        if (normalized.includes('istituto') || normalized.includes('religiosa')) {
            return 'Istituto';
        }
        if (normalized.includes('accoglienza')) {
            return 'Struttura di accoglienza';
        }
        return 'Casa di convivenza';
    }

    private toTipologiaPosto(value: string | null | undefined): TipologiaPosto {
        const normalized = (value || '').trim().toLowerCase();
        if (normalized.includes('hotel') || normalized.includes('albergo')) {
            return 'Albergo / pensione';
        }
        if (normalized.includes('parrocchia')) {
            return 'Parrocchia';
        }
        if (normalized.includes('istituto') || normalized.includes('religiosa')) {
            return 'Istituto religioso';
        }
        if (normalized.includes('ritiri')) {
            return 'Casa per ritiri';
        }
        return 'Casa di convivenza';
    }

    private toSaleLabel(value: number | string | null | undefined): string {
        const numberValue = this.toNullableNumber(value);
        if (numberValue === null) {
            return '';
        }
        return numberValue === 1 ? '1 sala incontri' : `${numberValue} sale incontri`;
    }

    private toNullableNumber(value: number | string | null | undefined): number | null {
        if (typeof value === 'number') {
            return Number.isFinite(value) && value > 0 ? value : null;
        }

        const parsed = Number.parseInt(String(value ?? '').replace(/[^\d-]/g, ''), 10);
        return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
    }

    private coordinateApiFallback(struttura: StructureAccreditationResponse, index: number): [number, number] {
        if (this.isValidCoordinate(struttura.latitude, struttura.longitude)) {
            return [Number(struttura.latitude), Number(struttura.longitude)];
        }

        const citta = struttura.city || '';
        const basi: Record<string, [number, number]> = {
            Roma: [41.9028, 12.4964],
            'Santa Severa': [42.0186, 11.9541],
            'Santa Marinella': [42.0349, 11.8542],
            Civitavecchia: [42.0924, 11.7954]
        };
        const base = basi[citta] ?? (citta.includes('Santa') ? basi['Santa Marinella'] : basi['Roma']);
        const offset = (index % 8) * 0.006;
        return [Number((base[0] + offset).toFixed(6)), Number((base[1] - offset).toFixed(6))];
    }

    private isValidCoordinate(latitude: number | null | undefined, longitude: number | null | undefined) {
        return typeof latitude === 'number' && typeof longitude === 'number' && Number.isFinite(latitude) && Number.isFinite(longitude);
    }

    private googleMapsUrlFromStructure(struttura: StructureAccreditationResponse, lat: number, lng: number) {
        if (this.isValidCoordinate(struttura.latitude, struttura.longitude)) {
            return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
        }

        const query = struttura.googleFormattedAddress || `${struttura.name}, ${struttura.address}, ${struttura.city}, ${struttura.region}`;
        return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
    }

    private createTipiOptions(): TipoStrutturaMappa[] {
        return Array.from(new Set(this.posti.map((posto) => posto.tipo)));
    }

    private createZoneOptions(): string[] {
        return Array.from(new Set(this.posti.map((posto) => posto.zona || posto.citta).filter(Boolean))).sort();
    }

    private readSanGaetanoCensimento(): CensimentoStrutturaMock | null {
        const raw = localStorage.getItem(SAN_GAETANO_CENSIMENTO_STORAGE_KEY);
        if (!raw) {
            return null;
        }

        try {
            return JSON.parse(raw) as CensimentoStrutturaMock;
        } catch {
            return null;
        }
    }

    private creaPostiDemo(): PostoConCensimento[] {
        return DEMO_POSTI.map((posto, index) => {
            const lat = 41.9 + index * 0.015;
            const lng = 12.49 + index * 0.015;
            return {
                id: index + 1,
                nome: posto.nome,
                tipo: 'Casa di convivenza',
                tipologia: posto.tipologia as TipologiaPosto,
                zona: posto.citta,
                citta: posto.citta,
                regione: posto.regione,
                indirizzo: posto.indirizzo,
                indirizzoNormalizzato: posto.indirizzo,
                capienza: posto.capienza,
                referente: '',
                telefono: '',
                email: '',
                sitoWeb: '',
                statoRelazione: posto.stato as StatoRelazione,
                statoDisponibilita: 'Da verificare',
                note: 'Scheda dimostrativa, senza dati reali.',
                latitudine: lat,
                longitudine: lng,
                lat,
                lng,
                placeId: null,
                googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${posto.nome}, ${posto.citta}, ${posto.regione}`)}`,
                ultimoContatto: null,
                storicoConvivenze: index === 0 ? ['Convivenza di Avvento'] : [],
                pubblicata: true,
                servizi: {
                    camere: true,
                    salaIncontri: true,
                    cucina: index !== 2,
                    parcheggio: index !== 1,
                    accessibilita: index === 0,
                    spazioBambini: index === 1
                },
                valutazioneInterna: index === 0 ? 'positivo' : 'non valutato',
                catalogoOrigine: 'demo'
            };
        });
    }

    private createEmptySegnalazioneForm() {
        return {
            nomeStruttura: '',
            indirizzo: '',
            citta: '',
            regione: 'Lazio',
            referente: '',
            telefono: '',
            email: '',
            note: ''
        };
    }

    private creaPostoDaSegnalazione(item: StrutturaSegnalataMock, index: number): PostoConCensimento {
        const lat = 41.9028 + index * 0.003;
        const lng = 12.4964 - index * 0.003;
        return {
            id: 9000 + index,
            nome: item.nomeStruttura,
            tipo: 'Struttura di accoglienza' as TipoStrutturaMappa,
            tipologia: 'Casa di convivenza',
            zona: item.citta || item.regione || 'Da verificare',
            citta: item.citta || 'Da verificare',
            regione: item.regione || 'Da verificare',
            indirizzo: item.indirizzo,
            indirizzoNormalizzato: item.indirizzo,
            capienza: null,
            referente: item.referente,
            telefono: item.telefono,
            email: item.email,
            sitoWeb: '',
            statoRelazione: 'Da verificare',
            statoDisponibilita: 'Da verificare',
            note: item.note,
            latitudine: lat,
            longitudine: lng,
            lat,
            lng,
            placeId: null,
            googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${item.nomeStruttura}, ${item.indirizzo}, ${item.citta}, ${item.regione}`)}`,
            ultimoContatto: null,
            storicoConvivenze: [],
            servizi: { camere: false, salaIncontri: false, cucina: false, parcheggio: false, accessibilita: false, spazioBambini: false },
            valutazioneInterna: 'da verificare',
            segnalazione: item,
            statoSegnalazione: item.stato,
            statoVerifica: item.statoVerifica,
            pubblicata: false
        };
    }
}
