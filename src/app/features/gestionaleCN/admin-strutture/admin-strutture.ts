import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import {
    CensimentoStrutturaMock,
    SAN_GAETANO_CENSIMENTO_LINK,
    SAN_GAETANO_CENSIMENTO_STORAGE_KEY,
    StrutturaSegnalataMock,
    readStruttureSegnalate,
    writeStruttureSegnalate
} from '../../strutture/strutture-censimento.mock';
import {
    FotoStrutturaMock,
    ProfileStatus,
    STRUTTURA_PROFILE_DEFAULT,
    StrutturaProfileMock,
    fotoCopertina,
    normalizeProfileStatus,
    normalizeStrutturaProfile,
    readProfileStatus,
    readStrutturaProfile,
    saveStrutturaProfile,
    statusLabelStruttura
} from '../../strutture/struttura-profile.storage';

type StatoAdminStruttura = 'IN_ATTESA' | 'APPROVATA' | 'RESPINTA' | 'SOSPESA';
type FiltroStatoAdmin = 'TUTTE' | StatoAdminStruttura;
type AdminSource = 'profile' | 'censimento' | 'segnalazione';

type AdminStrutturaItem = {
    id: string;
    source: AdminSource;
    stato: StatoAdminStruttura;
    dataRichiesta: string;
    updatedAt: string;
    noteAdmin: string;
    profile: StrutturaProfileMock;
    segnalazioneId?: string;
    rawSegnalazione?: StrutturaSegnalataMock;
    rawCensimento?: CensimentoStrutturaMock;
};

@Component({
    selector: 'app-admin-strutture',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, CheckboxModule, InputTextModule, SelectModule, TagModule, TextareaModule],
    template: `
        <section class="admin-structures-page">
            <header class="page-head">
                <div>
                    <span>Global Admin</span>
                    <h1>Gestione strutture Global Admin</h1>
                    <p>Controllo completo di accreditamenti, censimenti, sospensioni e pubblicazione delle strutture.</p>
                </div>
                @if (feedbackMessage) {
                    <div class="feedback">{{ feedbackMessage }}</div>
                }
            </header>

            <section class="panel">
                <div class="section-title">
                    <div>
                        <span>Console strutture</span>
                        <h2>Stati e filtri</h2>
                    </div>
                    <strong>{{ struttureFiltrate.length }} / {{ struttureAdmin.length }}</strong>
                </div>

                <div class="status-grid">
                    <button type="button" class="status-card" [class.active]="filtroStato === 'TUTTE'" (click)="setFiltro('TUTTE')">
                        <span>Totale strutture</span>
                        <strong>{{ struttureAdmin.length }}</strong>
                    </button>
                    @for (stato of statiAdmin; track stato) {
                        <button type="button" class="status-card" [class.active]="filtroStato === stato" (click)="setFiltro(stato)">
                            <span>{{ statoLabel(stato) }}</span>
                            <strong>{{ countByStatus(stato) }}</strong>
                        </button>
                    }
                </div>

                <div class="toolbar">
                    <input pInputText [(ngModel)]="searchText" placeholder="Cerca nome, città, regione, referente, email" />
                    <p-select [options]="filtroOptions" [(ngModel)]="filtroStato" optionLabel="label" optionValue="value" appendTo="body"></p-select>
                </div>
            </section>

            <section class="cards-grid">
                @for (struttura of struttureFiltrate; track struttura.id) {
                    <article class="structure-card">
                        <header>
                            <div>
                                <span>{{ struttura.profile.tipo }}</span>
                                <h3>{{ struttura.profile.nome }}</h3>
                                <p>{{ displayValue(struttura.profile.citta) }} / {{ displayValue(struttura.profile.regione) }}</p>
                            </div>
                            <p-tag [value]="statoLabel(struttura.stato)" [severity]="statusSeverity(struttura.stato)"></p-tag>
                        </header>

                        <img class="cover" [src]="cover(struttura)" [alt]="struttura.profile.nome" />

                        <dl>
                            <div><dt>Indirizzo</dt><dd>{{ displayValue(struttura.profile.indirizzo) }}</dd></div>
                            <div><dt>Referente</dt><dd>{{ displayValue(struttura.profile.referente) }}</dd></div>
                            <div><dt>Email</dt><dd>{{ displayValue(struttura.profile.email) }}</dd></div>
                            <div><dt>Telefono</dt><dd>{{ displayValue(struttura.profile.telefono) }}</dd></div>
                            <div><dt>Capienza</dt><dd>{{ struttura.profile.capienza ?? 'Da completare' }}</dd></div>
                            <div><dt>Posti letto</dt><dd>{{ struttura.profile.postiLetto ?? 'Da completare' }}</dd></div>
                            <div><dt>Camere</dt><dd>{{ struttura.profile.camere ?? 'Da completare' }}</dd></div>
                            <div><dt>Sale</dt><dd>{{ displayValue(struttura.profile.sale) }}</dd></div>
                            <div><dt>Data richiesta</dt><dd>{{ formatDate(struttura.dataRichiesta) }}</dd></div>
                            <div><dt>Foto</dt><dd>{{ struttura.profile.foto.length }}</dd></div>
                        </dl>

                        <p class="description">{{ struttura.profile.descrizione || 'Descrizione da completare.' }}</p>

                        <div class="service-tags">
                            @for (servizio of serviziPrincipali(struttura.profile); track servizio) {
                                <span>{{ servizio }}</span>
                            }
                        </div>

                        <footer>
                            <button pButton type="button" label="Approva" icon="pi pi-check" [disabled]="struttura.stato === 'APPROVATA'" (click)="approvaStruttura(struttura)"></button>
                            <button pButton type="button" label="Rifiuta" icon="pi pi-times" severity="danger" outlined [disabled]="struttura.stato === 'RESPINTA'" (click)="rifiutaStruttura(struttura)"></button>
                            <button pButton type="button" label="Sospendi" icon="pi pi-ban" severity="warn" outlined [disabled]="struttura.stato === 'SOSPESA' || struttura.stato === 'RESPINTA'" (click)="sospendiStruttura(struttura)"></button>
                            <button pButton type="button" label="Riattiva" icon="pi pi-refresh" severity="secondary" outlined [disabled]="struttura.stato !== 'SOSPESA' && struttura.stato !== 'RESPINTA'" (click)="riattivaStruttura(struttura)"></button>
                            <button pButton type="button" label="Modifica" icon="pi pi-pencil" severity="secondary" outlined (click)="apriModifica(struttura)"></button>
                            <button pButton type="button" label="Vedi dettaglio" icon="pi pi-eye" outlined (click)="apriDettaglio(struttura)"></button>
                        </footer>
                    </article>
                } @empty {
                    <div class="empty-state">Nessuna struttura corrisponde ai filtri.</div>
                }
            </section>

            @if (selectedDetail) {
                <section class="detail-panel">
                    <header>
                        <div>
                            <span>Dettaglio completo</span>
                            <h2>{{ selectedDetail.profile.nome }}</h2>
                            <p>{{ selectedDetail.profile.indirizzo }} · {{ selectedDetail.profile.citta }} / {{ selectedDetail.profile.regione }}</p>
                        </div>
                        <button pButton type="button" label="Chiudi dettaglio" icon="pi pi-times" severity="secondary" outlined (click)="chiudiDettaglio()"></button>
                    </header>

                    <div class="detail-layout">
                        <img class="detail-cover" [src]="cover(selectedDetail)" [alt]="selectedDetail.profile.nome" />
                        <dl>
                            <div><dt>Tipo</dt><dd>{{ selectedDetail.profile.tipo }}</dd></div>
                            <div><dt>Stato</dt><dd>{{ statoLabel(selectedDetail.stato) }}</dd></div>
                            <div><dt>Referente</dt><dd>{{ displayValue(selectedDetail.profile.referente) }}</dd></div>
                            <div><dt>Email</dt><dd>{{ displayValue(selectedDetail.profile.email) }}</dd></div>
                            <div><dt>Telefono</dt><dd>{{ displayValue(selectedDetail.profile.telefono) }}</dd></div>
                            <div><dt>Capienza</dt><dd>{{ selectedDetail.profile.capienza ?? 'Da completare' }}</dd></div>
                            <div><dt>Posti letto</dt><dd>{{ selectedDetail.profile.postiLetto ?? 'Da completare' }}</dd></div>
                            <div><dt>Camere</dt><dd>{{ selectedDetail.profile.camere ?? 'Da completare' }}</dd></div>
                            <div><dt>Sale</dt><dd>{{ displayValue(selectedDetail.profile.sale) }}</dd></div>
                            <div><dt>Data richiesta</dt><dd>{{ formatDate(selectedDetail.dataRichiesta) }}</dd></div>
                            <div><dt>Ultima modifica</dt><dd>{{ formatDate(selectedDetail.updatedAt) }}</dd></div>
                            <div><dt>Stato accreditamento</dt><dd>{{ statoLabel(selectedDetail.stato) }}</dd></div>
                            <div class="span-2"><dt>Descrizione completa</dt><dd>{{ selectedDetail.profile.descrizione || 'Da completare' }}</dd></div>
                            <div class="span-2"><dt>Tariffe indicative</dt><dd>{{ displayValue(selectedDetail.profile.tariffeIndicative) }}</dd></div>
                            <div><dt>Condizioni caparra</dt><dd>{{ displayValue(selectedDetail.profile.condizioniCaparra) }}</dd></div>
                            <div><dt>Condizioni cancellazione</dt><dd>{{ displayValue(selectedDetail.profile.condizioniCancellazione) }}</dd></div>
                            <div class="span-2"><dt>Note admin</dt><dd>{{ selectedDetail.noteAdmin || 'Nessuna nota admin.' }}</dd></div>
                        </dl>
                    </div>

                    <div class="service-tags full">
                        @for (servizio of serviziCompleti(selectedDetail.profile); track servizio) {
                            <span>{{ servizio }}</span>
                        }
                    </div>

                    <div class="gallery">
                        @for (foto of selectedDetail.profile.foto; track foto.id) {
                            <figure>
                                <img [src]="photoSrc(foto)" [alt]="foto.descrizione" />
                                <figcaption>{{ foto.copertina || foto.isCover ? 'Copertina · ' : '' }}{{ foto.categoria }} · {{ foto.descrizione }}</figcaption>
                            </figure>
                        } @empty {
                            <div class="empty-state">Nessuna foto caricata dalla struttura.</div>
                        }
                    </div>

                    <footer>
                        <button pButton type="button" label="Approva" icon="pi pi-check" [disabled]="selectedDetail.stato === 'APPROVATA'" (click)="approvaStruttura(selectedDetail)"></button>
                        <button pButton type="button" label="Rifiuta" icon="pi pi-times" severity="danger" outlined [disabled]="selectedDetail.stato === 'RESPINTA'" (click)="rifiutaStruttura(selectedDetail)"></button>
                        <button pButton type="button" label="Sospendi" icon="pi pi-ban" severity="warn" outlined [disabled]="selectedDetail.stato === 'SOSPESA' || selectedDetail.stato === 'RESPINTA'" (click)="sospendiStruttura(selectedDetail)"></button>
                        <button pButton type="button" label="Riattiva" icon="pi pi-refresh" severity="secondary" outlined [disabled]="selectedDetail.stato !== 'SOSPESA' && selectedDetail.stato !== 'RESPINTA'" (click)="riattivaStruttura(selectedDetail)"></button>
                        <button pButton type="button" label="Modifica" icon="pi pi-pencil" severity="secondary" outlined (click)="apriModifica(selectedDetail)"></button>
                    </footer>
                </section>
            }

            @if (editingItem && editForm) {
                <section class="edit-panel">
                    <header>
                        <div>
                            <span>Modifica struttura</span>
                            <h2>{{ editingItem.profile.nome }}</h2>
                        </div>
                        <button pButton type="button" label="Annulla" icon="pi pi-times" severity="secondary" outlined (click)="annullaModifica()"></button>
                    </header>

                    <div class="edit-grid">
                        <label><span>Nome</span><input pInputText [(ngModel)]="editForm.nome" /></label>
                        <label><span>Tipo</span><input pInputText [(ngModel)]="editForm.tipo" /></label>
                        <label class="span-2"><span>Descrizione</span><textarea pTextarea rows="4" [(ngModel)]="editForm.descrizione"></textarea></label>
                        <label class="span-2"><span>Indirizzo</span><input pInputText [(ngModel)]="editForm.indirizzo" /></label>
                        <label><span>Città</span><input pInputText [(ngModel)]="editForm.citta" /></label>
                        <label><span>Regione</span><input pInputText [(ngModel)]="editForm.regione" /></label>
                        <label><span>Referente</span><input pInputText [(ngModel)]="editForm.referente" /></label>
                        <label><span>Email</span><input pInputText type="email" [(ngModel)]="editForm.email" /></label>
                        <label><span>Telefono</span><input pInputText [(ngModel)]="editForm.telefono" /></label>
                        <label><span>Capienza</span><input pInputText type="number" [(ngModel)]="editForm.capienza" /></label>
                        <label><span>Posti letto</span><input pInputText type="number" [(ngModel)]="editForm.postiLetto" /></label>
                        <label><span>Camere</span><input pInputText type="number" [(ngModel)]="editForm.camere" /></label>
                        <label class="span-2"><span>Sale</span><input pInputText [(ngModel)]="editForm.sale" /></label>
                        <label class="span-2"><span>Tariffe indicative</span><textarea pTextarea rows="3" [(ngModel)]="editForm.tariffeIndicative"></textarea></label>
                        <label><span>Condizioni caparra</span><input pInputText [(ngModel)]="editForm.condizioniCaparra" /></label>
                        <label><span>Condizioni cancellazione</span><input pInputText [(ngModel)]="editForm.condizioniCancellazione" /></label>
                    </div>

                    <div class="checks">
                        <label><p-checkbox [(ngModel)]="editForm.cappella" [binary]="true"></p-checkbox><span>Cappella</span></label>
                        <label><p-checkbox [(ngModel)]="editForm.mensa" [binary]="true"></p-checkbox><span>Mensa</span></label>
                        <label><p-checkbox [(ngModel)]="editForm.cucinaInterna" [binary]="true"></p-checkbox><span>Cucina interna</span></label>
                        <label><p-checkbox [(ngModel)]="editForm.parcheggio" [binary]="true"></p-checkbox><span>Parcheggio</span></label>
                        <label><p-checkbox [(ngModel)]="editForm.accessibilitaDisabili" [binary]="true"></p-checkbox><span>Accessibilità disabili</span></label>
                        <label><p-checkbox [(ngModel)]="editForm.spaziEsterni" [binary]="true"></p-checkbox><span>Spazi esterni</span></label>
                        <label><p-checkbox [(ngModel)]="editForm.famiglieConBambini" [binary]="true"></p-checkbox><span>Famiglie con bambini</span></label>
                    </div>

                    <footer>
                        <button pButton type="button" label="Annulla" severity="secondary" outlined (click)="annullaModifica()"></button>
                        <button pButton type="button" label="Salva modifiche" icon="pi pi-save" (click)="salvaModifiche()"></button>
                    </footer>
                </section>
            }
        </section>
    `,
    styles: [
        `
            .admin-structures-page { display: grid; gap: 1.25rem; color: #0f172a; }
            .page-head,
            .panel,
            .structure-card,
            .detail-panel,
            .edit-panel {
                border: 1px solid rgba(226,232,240,.92);
                border-radius: 18px;
                background: rgba(255,255,255,.96);
                box-shadow: 0 18px 42px rgba(15,23,42,.12);
                padding: 1.15rem;
            }
            .page-head { display: flex; justify-content: space-between; gap: 1rem; align-items: flex-start; }
            .feedback { padding: .75rem 1rem; border-radius: 999px; color: #065f46; background: #d1fae5; border: 1px solid #a7f3d0; font-weight: 850; }
            .page-head span,
            .section-title span,
            .structure-card header span,
            .detail-panel header span,
            .edit-panel header span { color: #1d4ed8; font-size: .78rem; font-weight: 900; text-transform: uppercase; letter-spacing: .04em; }
            h1, h2, h3 { margin: .15rem 0 .35rem; color: #0f172a; }
            p { margin: 0; color: #334155; line-height: 1.5; }
            .section-title,
            .detail-panel header,
            .edit-panel header { display: flex; justify-content: space-between; gap: 1rem; align-items: flex-start; margin-bottom: 1rem; }
            .status-grid { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: .75rem; }
            .status-card {
                display: grid;
                gap: .25rem;
                padding: .85rem;
                text-align: left;
                border: 1px solid #e2e8f0;
                border-radius: 14px;
                background: #fff;
                cursor: pointer;
            }
            .status-card.active { border-color: #1d4ed8; box-shadow: 0 0 0 3px rgba(29,78,216,.12); }
            .status-card span { color: #475569; font-size: .75rem; font-weight: 850; text-transform: uppercase; }
            .status-card strong { color: #0f172a; font-size: 1.55rem; }
            .toolbar { display: grid; grid-template-columns: 1fr 16rem; gap: .75rem; margin-top: 1rem; }
            .cards-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; }
            .structure-card { display: grid; gap: .9rem; }
            .structure-card header { display: flex; justify-content: space-between; gap: 1rem; align-items: flex-start; }
            .cover,
            .detail-cover,
            .gallery img { width: 100%; aspect-ratio: 16/9; object-fit: cover; border-radius: 16px; background: #e2e8f0; }
            dl { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .65rem; margin: 0; }
            dt { color: #475569; font-size: .78rem; font-weight: 800; }
            dd { margin: .15rem 0 0; color: #0f172a; font-weight: 850; overflow-wrap: anywhere; }
            .span-2 { grid-column: span 2; }
            .description { padding: .8rem; border-radius: 12px; background: #f8fafc; }
            .service-tags { display: flex; flex-wrap: wrap; gap: .45rem; }
            .service-tags span { padding: .35rem .55rem; border-radius: 999px; background: #eff6ff; color: #1e40af; font-size: .78rem; font-weight: 850; }
            .service-tags.full span { background: #f1f5f9; color: #0f172a; }
            footer { display: flex; flex-wrap: wrap; gap: .55rem; justify-content: flex-end; }
            .detail-layout { display: grid; grid-template-columns: minmax(18rem, 28rem) 1fr; gap: 1rem; }
            .gallery { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: .75rem; }
            figure { margin: 0; display: grid; gap: .35rem; }
            figcaption { color: #475569; font-size: .82rem; font-weight: 700; }
            .edit-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .8rem; }
            label { display: grid; gap: .35rem; color: #1e293b; font-weight: 850; }
            input, textarea, p-select { width: 100%; }
            .checks { display: flex; flex-wrap: wrap; gap: .8rem; margin-top: .9rem; padding: .9rem; border: 1px solid #e2e8f0; border-radius: 14px; background: #f8fafc; }
            .checks label { display: flex; align-items: center; gap: .4rem; }
            .empty-state { padding: 1rem; border: 1px dashed #cbd5e1; border-radius: 14px; color: #475569; background: rgba(255,255,255,.9); text-align: center; }
            @media (max-width: 1100px) {
                .status-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
                .cards-grid,
                .detail-layout,
                .gallery { grid-template-columns: 1fr; }
            }
            @media (max-width: 720px) {
                .page-head,
                .section-title,
                .structure-card header,
                .detail-panel header,
                .edit-panel header { flex-direction: column; align-items: stretch; }
                .toolbar,
                dl,
                .edit-grid { grid-template-columns: 1fr; }
                .span-2 { grid-column: span 1; }
                footer button { width: 100%; }
            }
        `
    ]
})
export class AdminStrutture {
    readonly statiAdmin: StatoAdminStruttura[] = ['IN_ATTESA', 'APPROVATA', 'RESPINTA', 'SOSPESA'];
    readonly filtroOptions = [
        { label: 'Tutte', value: 'TUTTE' },
        { label: 'In attesa', value: 'IN_ATTESA' },
        { label: 'Approvate', value: 'APPROVATA' },
        { label: 'Respinte', value: 'RESPINTA' },
        { label: 'Sospese', value: 'SOSPESA' }
    ];

    filtroStato: FiltroStatoAdmin = 'TUTTE';
    searchText = '';
    feedbackMessage = '';
    selectedDetail: AdminStrutturaItem | null = null;
    editingItem: AdminStrutturaItem | null = null;
    editForm: StrutturaProfileMock | null = null;
    struttureAdmin = this.loadStruttureAdmin();

    get struttureFiltrate(): AdminStrutturaItem[] {
        const text = this.searchText.trim().toLowerCase();
        return this.struttureAdmin.filter((item) => {
            const matchStato = this.filtroStato === 'TUTTE' || item.stato === this.filtroStato;
            const haystack = `${item.profile.nome} ${item.profile.citta} ${item.profile.regione} ${item.profile.referente} ${item.profile.email}`.toLowerCase();
            return matchStato && (!text || haystack.includes(text));
        });
    }

    setFiltro(stato: FiltroStatoAdmin) {
        this.filtroStato = stato;
    }

    approvaStruttura(struttura: AdminStrutturaItem) {
        this.updateAdminStruttura(struttura, 'APPROVATA');
        this.flash('Struttura approvata e pubblicata nel catalogo.');
    }

    rifiutaStruttura(struttura: AdminStrutturaItem) {
        if (!window.confirm(`Rifiutare la struttura "${struttura.profile.nome}"?`)) {
            return;
        }
        this.updateAdminStruttura(struttura, 'RESPINTA');
        this.flash('Struttura respinta.');
    }

    sospendiStruttura(struttura: AdminStrutturaItem) {
        this.updateAdminStruttura(struttura, 'SOSPESA');
        this.flash('Struttura sospesa.');
    }

    riattivaStruttura(struttura: AdminStrutturaItem) {
        this.updateAdminStruttura(struttura, 'APPROVATA');
        this.flash('Struttura riattivata e pubblicata nel catalogo.');
    }

    apriDettaglio(struttura: AdminStrutturaItem) {
        this.selectedDetail = struttura;
        this.editingItem = null;
        this.editForm = null;
    }

    chiudiDettaglio() {
        this.selectedDetail = null;
    }

    apriModifica(struttura: AdminStrutturaItem) {
        this.editingItem = struttura;
        this.editForm = normalizeStrutturaProfile(JSON.parse(JSON.stringify(struttura.profile)) as StrutturaProfileMock);
        this.selectedDetail = null;
    }

    annullaModifica() {
        this.editingItem = null;
        this.editForm = null;
    }

    salvaModifiche() {
        if (!this.editingItem || !this.editForm) {
            return;
        }

        this.persistProfile(this.editingItem, normalizeStrutturaProfile(this.editForm), this.editingItem.stato);
        this.struttureAdmin = this.loadStruttureAdmin();
        this.editingItem = null;
        this.editForm = null;
        this.flash('Modifiche salvate.');
    }

    countByStatus(stato: StatoAdminStruttura) {
        return this.struttureAdmin.filter((item) => item.stato === stato).length;
    }

    statoLabel(stato: StatoAdminStruttura) {
        return statusLabelStruttura(stato);
    }

    statusSeverity(stato: StatoAdminStruttura): 'success' | 'secondary' | 'warn' | 'danger' {
        const severities: Record<StatoAdminStruttura, 'success' | 'secondary' | 'warn' | 'danger'> = {
            IN_ATTESA: 'warn',
            APPROVATA: 'success',
            RESPINTA: 'danger',
            SOSPESA: 'secondary'
        };
        return severities[stato];
    }

    displayValue(value: string | null | undefined) {
        return value && value.trim() ? value : 'Da completare';
    }

    formatDate(value: string | null | undefined) {
        if (!value) {
            return 'Da completare';
        }
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('it-IT').format(date);
    }

    cover(struttura: AdminStrutturaItem) {
        return fotoCopertina(struttura.profile);
    }

    photoSrc(foto: FotoStrutturaMock) {
        return foto.dataUrl || foto.url || '/images/backgrounds/posti-convivenza-bg.jpg';
    }

    serviziPrincipali(profile: StrutturaProfileMock): string[] {
        return this.serviziCompleti(profile).slice(0, 5);
    }

    serviziCompleti(profile: StrutturaProfileMock): string[] {
        const servizi = [
            profile.cappella ? 'Cappella' : '',
            profile.mensa ? 'Mensa' : '',
            profile.cucinaInterna ? 'Cucina interna' : '',
            profile.parcheggio ? 'Parcheggio' : '',
            profile.accessibilitaDisabili ? 'Accessibilità disabili' : '',
            profile.spaziEsterni ? 'Spazi esterni' : '',
            profile.famiglieConBambini ? 'Famiglie con bambini' : ''
        ].filter(Boolean);
        return servizi.length ? servizi : ['Servizi da completare'];
    }

    private updateAdminStruttura(struttura: AdminStrutturaItem, stato: StatoAdminStruttura) {
        this.persistProfile(struttura, struttura.profile, stato);
        this.struttureAdmin = this.loadStruttureAdmin();
        this.selectedDetail = this.struttureAdmin.find((item) => item.id === struttura.id) ?? null;
    }

    private persistProfile(struttura: AdminStrutturaItem, profile: StrutturaProfileMock, stato: StatoAdminStruttura) {
        if (struttura.source === 'profile') {
            saveStrutturaProfile(profile, stato);
            return;
        }

        if (struttura.source === 'censimento' && struttura.rawCensimento) {
            const updated: CensimentoStrutturaMock = {
                ...struttura.rawCensimento,
                nomeStruttura: profile.nome,
                tipoStruttura: profile.tipo,
                indirizzo: profile.indirizzo,
                citta: profile.citta,
                regione: profile.regione,
                referente: profile.referente,
                telefono: profile.telefono,
                email: profile.email,
                capienzaPostiLetto: profile.postiLetto,
                numeroCamere: profile.camere,
                saleIncontri: profile.sale,
                cappella: profile.cappella,
                refettorio: profile.mensa,
                parcheggio: profile.parcheggio,
                noteOrganizzative: profile.descrizione,
                statoVerifica: stato === 'APPROVATA' ? 'Verificata' : stato === 'SOSPESA' ? 'Sospesa' : 'Da verificare',
                statoDisponibilita: stato === 'APPROVATA' ? 'Disponibile' : 'Non disponibile',
                pubblicata: stato === 'APPROVATA'
            };
            localStorage.setItem(SAN_GAETANO_CENSIMENTO_STORAGE_KEY, JSON.stringify(updated));
            return;
        }

        if (struttura.source === 'segnalazione' && struttura.segnalazioneId) {
            const updated = readStruttureSegnalate().map((item) =>
                item.id === struttura.segnalazioneId
                    ? {
                          ...item,
                          nomeStruttura: profile.nome,
                          indirizzo: profile.indirizzo,
                          citta: profile.citta,
                          regione: profile.regione,
                          referente: profile.referente,
                          telefono: profile.telefono,
                          email: profile.email,
                          note: profile.descrizione,
                          pubblicata: stato === 'APPROVATA',
                          stato: stato === 'RESPINTA' ? 'Scartata' as const : 'Censimento ricevuto' as const,
                          statoVerifica: stato === 'APPROVATA' ? 'Verificata' as const : stato === 'SOSPESA' ? 'Sospesa' as const : 'Da verificare' as const,
                          statoDisponibilita: stato === 'APPROVATA' ? 'Disponibile' as const : 'Non disponibile' as const
                      }
                    : item
            );
            writeStruttureSegnalate(updated);
        }
    }

    private loadStruttureAdmin(): AdminStrutturaItem[] {
        const items: AdminStrutturaItem[] = [];
        const profile = readStrutturaProfile();
        if (profile) {
            items.push({
                id: 'struttura-profile-local',
                source: 'profile',
                stato: this.toAdminStatus(readProfileStatus()),
                dataRichiesta: profile.updatedAt,
                updatedAt: profile.updatedAt,
                noteAdmin: '',
                profile
            });
        }

        const censimento = this.readCensimentoSanGaetano();
        if (censimento) {
            items.push(this.fromCensimento(censimento));
        }

        items.push(...readStruttureSegnalate().map((item) => this.fromSegnalazione(item)));

        return items;
    }

    private fromCensimento(censimento: CensimentoStrutturaMock): AdminStrutturaItem {
        return {
            id: 'censimento-san-gaetano',
            source: 'censimento',
            stato: censimento.pubblicata ? 'APPROVATA' : censimento.statoVerifica === 'Sospesa' ? 'SOSPESA' : 'IN_ATTESA',
            dataRichiesta: censimento.dataInvio,
            updatedAt: censimento.dataInvio,
            noteAdmin: '',
            rawCensimento: censimento,
            profile: normalizeStrutturaProfile({
                ...STRUTTURA_PROFILE_DEFAULT,
                id: 'censimento-san-gaetano',
                nome: censimento.nomeStruttura,
                tipo: censimento.tipoStruttura,
                descrizione: censimento.noteOrganizzative,
                indirizzo: censimento.indirizzo,
                citta: censimento.citta,
                regione: censimento.regione,
                referente: censimento.referente,
                telefono: censimento.telefono,
                email: censimento.email,
                capienza: censimento.capienzaPostiLetto,
                postiLetto: censimento.capienzaPostiLetto,
                camere: censimento.numeroCamere,
                sale: censimento.saleIncontri,
                cappella: censimento.cappella,
                mensa: censimento.refettorio,
                parcheggio: censimento.parcheggio,
                updatedAt: censimento.dataInvio
            })
        };
    }

    private fromSegnalazione(segnalazione: StrutturaSegnalataMock): AdminStrutturaItem {
        return {
            id: `segnalazione-${segnalazione.id}`,
            source: 'segnalazione',
            segnalazioneId: segnalazione.id,
            rawSegnalazione: segnalazione,
            stato: segnalazione.stato === 'Scartata' ? 'RESPINTA' : segnalazione.pubblicata ? 'APPROVATA' : segnalazione.statoVerifica === 'Sospesa' ? 'SOSPESA' : 'IN_ATTESA',
            dataRichiesta: segnalazione.dataSegnalazione,
            updatedAt: segnalazione.dataInvito ?? segnalazione.dataSegnalazione,
            noteAdmin: '',
            profile: normalizeStrutturaProfile({
                ...STRUTTURA_PROFILE_DEFAULT,
                id: `segnalazione-${segnalazione.id}`,
                nome: segnalazione.nomeStruttura,
                tipo: 'Struttura di accoglienza',
                descrizione: segnalazione.note,
                indirizzo: segnalazione.indirizzo,
                citta: segnalazione.citta,
                regione: segnalazione.regione,
                referente: segnalazione.referente,
                telefono: segnalazione.telefono,
                email: segnalazione.email,
                capienza: null,
                postiLetto: null,
                camere: null,
                updatedAt: segnalazione.dataInvito ?? segnalazione.dataSegnalazione,
                foto: []
            })
        };
    }

    private readCensimentoSanGaetano(): CensimentoStrutturaMock | null {
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

    private toAdminStatus(status: ProfileStatus): StatoAdminStruttura {
        const normalized = normalizeProfileStatus(status);
        if (normalized === 'BOZZA') {
            return 'IN_ATTESA';
        }
        return normalized;
    }

    private flash(message: string) {
        this.feedbackMessage = message;
        window.setTimeout(() => {
            if (this.feedbackMessage === message) {
                this.feedbackMessage = '';
            }
        }, 3500);
    }

    readonly defaultCensimentoLink = SAN_GAETANO_CENSIMENTO_LINK;
}
