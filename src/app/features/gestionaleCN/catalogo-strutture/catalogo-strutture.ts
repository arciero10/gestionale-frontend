import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { POSTI_CONVIVENZA_MOCK, PostoConvivenza } from '../data/posti-convivenza.mock';
import { canPerformAction, canSeeMenuItem, getUserAccessContext } from '../data/access-policy.mock';
import { getCurrentCommunity } from '../data/community-selection.storage';
import { TIPI_CONVIVENZA_ANNUALE, TAPPE_UFFICIALI_CAMMINO } from '../data/tappe-cammino.mock';

type StatoRichiestaDisponibilita = 'bozza' | 'inviata' | 'vista dalla struttura' | 'disponibile' | 'non disponibile' | 'proposta alternativa' | 'confermata' | 'annullata';

interface RichiestaDisponibilitaMock {
    id: string;
    strutturaId: number;
    strutturaNome: string;
    convivenzaCollegata: string;
    dataInizio: string;
    dataFine: string;
    partecipanti: number;
    tipoConvivenza: string;
    note: string;
    esigenze: string;
    stato: StatoRichiestaDisponibilita;
    creataIl: string;
}

type CatalogoStruttura = PostoConvivenza & { capienza: number };

const RICHIESTE_DISPONIBILITA_KEY = 'richieste-disponibilita-strutture';

@Component({
    selector: 'app-catalogo-strutture',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, SelectModule, TagModule],
    template: `
        <section class="catalog-page">
            @if (!canViewCatalog) {
                <section class="catalog-card empty-state">
                    <h1>Catalogo strutture</h1>
                    <p>Il catalogo strutture è disponibile solo agli utenti autorizzati alla logistica o alle richieste disponibilità.</p>
                </section>
            } @else {
                <header class="catalog-hero">
                    <div>
                        <span>Catalogo strutture</span>
                        <h1>Trova una struttura per la convivenza</h1>
                        <p>Consulta strutture censite e abilitate dal Global Admin. Lo stile è quello di un catalogo: il responsabile richiede disponibilità, non crea la struttura.</p>
                    </div>
                    <p-tag value="Mock catalogo" severity="info"></p-tag>
                </header>

                <section class="filters-card">
                    <label><span>Data inizio</span><input pInputText type="date" [(ngModel)]="filters.dataInizio" /></label>
                    <label><span>Data fine</span><input pInputText type="date" [(ngModel)]="filters.dataFine" /></label>
                    <label><span>Partecipanti</span><input pInputText type="number" min="1" [(ngModel)]="filters.partecipanti" /></label>
                    <label><span>Regione/città/zona</span><input pInputText [(ngModel)]="filters.localita" placeholder="Roma, Lazio, Ovest..." /></label>
                    <label><span>Capienza minima</span><input pInputText type="number" min="0" [(ngModel)]="filters.capienzaMinima" /></label>
                    <label><span>Servizi</span><p-select appendTo="body" [options]="serviziOptions" [(ngModel)]="filters.servizio" [showClear]="true" placeholder="Qualsiasi"></p-select></label>
                    <label class="check-row"><input type="checkbox" [(ngModel)]="filters.accessibilita" /> Accessibilità</label>
                    <label class="check-row"><input type="checkbox" [(ngModel)]="filters.soloAttive" /> Solo strutture attive/disponibili</label>
                </section>

                <div class="catalog-layout">
                    <section class="results-grid">
                        @for (struttura of struttureFiltrate; track struttura.id) {
                            <article class="structure-card" [class.active]="selected.id === struttura.id">
                                <button type="button" class="photo-button" (click)="select(struttura)" [style.backgroundImage]="'url(' + getFoto(struttura) + ')'">
                                    <span>{{ struttura.citta }}</span>
                                </button>
                                <div class="structure-body">
                                    <div class="structure-title">
                                        <div>
                                            <h2>{{ struttura.nome }}</h2>
                                            <p>{{ struttura.citta }} · {{ struttura.indirizzo || 'Indirizzo da completare' }}</p>
                                        </div>
                                        <p-tag [value]="struttura.statoDisponibilita" [severity]="struttura.statoDisponibilita === 'Disponibile' ? 'success' : 'warn'"></p-tag>
                                    </div>
                                    <dl>
                                        <div><dt>Capienza</dt><dd>{{ struttura.capienza }}</dd></div>
                                        <div><dt>Camere/posti</dt><dd>{{ struttura.servizi.camere ? 'Camere presenti' : 'Da verificare' }}</dd></div>
                                        <div><dt>Valutazione</dt><dd>{{ struttura.valutazioneInterna }}</dd></div>
                                    </dl>
                                    <div class="service-list">
                                        @for (servizio of serviziPrincipali(struttura); track servizio) {
                                            <span>{{ servizio }}</span>
                                        }
                                    </div>
                                    <footer>
                                        <button pButton type="button" label="Dettaglio" icon="pi pi-info-circle" outlined (click)="select(struttura)"></button>
                                        @if (canRequestAvailability) {
                                            <button pButton type="button" label="Richiedi disponibilità" icon="pi pi-send" (click)="apriRichiesta(struttura)"></button>
                                        }
                                    </footer>
                                </div>
                            </article>
                        } @empty {
                            <section class="catalog-card empty-state">
                                <h2>Nessuna struttura trovata</h2>
                                <p>Modifica filtri, date o servizi richiesti.</p>
                            </section>
                        }
                    </section>

                    @if (selected) {
                        <aside class="detail-card">
                            <div class="gallery" [style.backgroundImage]="'url(' + getFoto(selected) + ')'"></div>
                            <div class="detail-head">
                                <div>
                                    <span>Dettaglio struttura</span>
                                    <h2>{{ selected.nome }}</h2>
                                    <p>{{ selected.indirizzo }} · {{ selected.citta }}</p>
                                </div>
                                <p-tag [value]="selected.statoRelazione" severity="info"></p-tag>
                            </div>
                            <dl class="detail-grid">
                                <div><dt>Referente</dt><dd>{{ selected.referente || 'Da completare' }}</dd></div>
                                <div><dt>Email</dt><dd>{{ selected.email || 'Da completare' }}</dd></div>
                                <div><dt>Telefono</dt><dd>{{ selected.telefono || 'Da completare' }}</dd></div>
                                <div><dt>Capienza</dt><dd>{{ selected.capienza }}</dd></div>
                                <div><dt>Sale</dt><dd>{{ selected.servizi.salaIncontri ? 'Sale incontri presenti' : 'Da verificare' }}</dd></div>
                                <div><dt>Mappa</dt><dd>{{ selected.lat }}, {{ selected.lng }}</dd></div>
                            </dl>
                            <section>
                                <h3>Servizi e regole casa</h3>
                                <p>{{ selected.note || 'Regole casa e dettagli organizzativi saranno aggiornati dalla struttura nel proprio spazio.' }}</p>
                                <div class="service-list">
                                    @for (servizio of serviziPrincipali(selected); track servizio) {
                                        <span>{{ servizio }}</span>
                                    }
                                </div>
                            </section>
                            <section>
                                <h3>Storico richieste</h3>
                                @if (storicoRichieste(selected.id).length) {
                                    @for (richiesta of storicoRichieste(selected.id); track richiesta.id) {
                                        <div class="request-history">
                                            <strong>{{ richiesta.convivenzaCollegata }}</strong>
                                            <span>{{ richiesta.dataInizio }} - {{ richiesta.dataFine }} · {{ richiesta.stato }}</span>
                                        </div>
                                    }
                                } @else {
                                    <p>Nessuna richiesta mock ancora registrata.</p>
                                }
                            </section>
                            @if (canRequestAvailability) {
                                <button pButton type="button" label="Richiedi disponibilità" icon="pi pi-send" (click)="apriRichiesta(selected)"></button>
                            }
                        </aside>
                    }
                </div>

                @if (requestOpen && requestStructure) {
                    <div class="modal-backdrop" role="presentation" (click)="chiudiRichiesta()">
                        <section class="request-modal" role="dialog" aria-modal="true" (click)="$event.stopPropagation()">
                            <header>
                                <span>Richiesta disponibilità</span>
                                <h2>{{ requestStructure.nome }}</h2>
                            </header>
                            <label>Convivenza collegata<input pInputText [(ngModel)]="requestForm.convivenzaCollegata" /></label>
                            <label>Tipo convivenza<p-select appendTo="body" [options]="tipiConvivenza" [(ngModel)]="requestForm.tipoConvivenza"></p-select></label>
                            <div class="form-grid">
                                <label>Data inizio<input pInputText type="date" [(ngModel)]="requestForm.dataInizio" /></label>
                                <label>Data fine<input pInputText type="date" [(ngModel)]="requestForm.dataFine" /></label>
                                <label>Partecipanti<input pInputText type="number" min="1" [(ngModel)]="requestForm.partecipanti" /></label>
                            </div>
                            <label>Note<textarea rows="3" [(ngModel)]="requestForm.note"></textarea></label>
                            <label>Esigenze particolari<textarea rows="3" [(ngModel)]="requestForm.esigenze"></textarea></label>
                            @if (feedback) {
                                <div class="feedback">{{ feedback }}</div>
                            }
                            <footer>
                                <button pButton type="button" label="Annulla" severity="secondary" outlined (click)="chiudiRichiesta()"></button>
                                <button pButton type="button" label="Invia richiesta" icon="pi pi-send" (click)="salvaRichiesta()"></button>
                            </footer>
                        </section>
                    </div>
                }
            }
        </section>
    `,
    styles: [`
        .catalog-page { display: grid; gap: 1rem; color: #0f172a; }
        .catalog-hero, .filters-card, .catalog-card, .detail-card, .structure-card, .request-modal {
            background: rgba(255,255,255,.96);
            border: 1px solid rgba(255,255,255,.5);
            border-radius: 16px;
            box-shadow: 0 18px 42px rgba(15,23,42,.16);
            backdrop-filter: blur(10px);
        }
        .catalog-hero { display:flex; justify-content:space-between; gap:1rem; align-items:center; padding:1.1rem; }
        .catalog-hero span, label span, dt, .detail-head span, .request-modal header span { color:#334155; font-size:.78rem; font-weight:900; text-transform:uppercase; }
        h1, h2, h3 { margin:.15rem 0 .35rem; color:#0f172a; }
        p, dd { margin:0; color:#334155; line-height:1.45; font-weight:650; }
        .filters-card { padding:1rem; display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:.8rem; }
        label { display:grid; gap:.35rem; color:#1e293b; font-weight:800; }
        input, textarea, p-select { width:100%; }
        input, textarea, select { border:1px solid #cbd5e1; border-radius:10px; min-height:42px; padding:.6rem .7rem; color:#0f172a; background:#fff; font:inherit; }
        .check-row { display:flex; align-items:center; gap:.5rem; align-self:end; min-height:42px; }
        .catalog-layout { display:grid; grid-template-columns:minmax(0,1fr) minmax(20rem,28rem); gap:1rem; align-items:start; }
        .results-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:1rem; }
        .structure-card { overflow:hidden; display:grid; grid-template-columns:13rem minmax(0,1fr); }
        .structure-card.active { outline:3px solid rgba(37,99,235,.35); }
        .photo-button, .gallery { min-height:13rem; background-size:cover; background-position:center; border:0; position:relative; }
        .photo-button { cursor:pointer; text-align:left; }
        .photo-button span { position:absolute; left:.75rem; bottom:.75rem; padding:.35rem .6rem; border-radius:999px; color:#fff; background:rgba(15,23,42,.72); font-weight:900; }
        .structure-body, .detail-card { padding:1rem; display:grid; gap:.8rem; }
        .structure-title { display:flex; justify-content:space-between; gap:.75rem; align-items:start; }
        dl, .detail-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:.55rem; margin:0; }
        .detail-grid { grid-template-columns:repeat(2,minmax(0,1fr)); }
        dl div, .request-history { padding:.65rem; border-radius:12px; background:rgba(248,250,252,.95); border:1px solid #e2e8f0; }
        .service-list { display:flex; flex-wrap:wrap; gap:.45rem; }
        .service-list span { padding:.32rem .55rem; border-radius:999px; color:#1e293b; background:#e0f2fe; font-weight:800; font-size:.82rem; }
        footer { display:flex; justify-content:flex-end; gap:.55rem; flex-wrap:wrap; }
        .modal-backdrop { position:fixed; inset:0; z-index:1300; display:grid; place-items:center; padding:1rem; background:rgba(15,23,42,.5); }
        .request-modal { width:min(640px,100%); padding:1rem; display:grid; gap:.8rem; }
        .form-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:.75rem; }
        .feedback { padding:.75rem; border-radius:12px; background:#ecfdf5; color:#166534; font-weight:900; }
        .empty-state { padding:1.25rem; }
        @media (max-width:1100px) { .catalog-layout, .results-grid, .filters-card { grid-template-columns:1fr; } .structure-card { grid-template-columns:1fr; } }
        @media (max-width:640px) { .catalog-hero, .structure-title { flex-direction:column; } .form-grid, dl, .detail-grid { grid-template-columns:1fr; } footer button { width:100%; } }
    `]
})
export class CatalogoStrutture {
    private readonly userContext = getUserAccessContext();
    private readonly community = getCurrentCommunity();
    readonly canViewCatalog = canSeeMenuItem('posti-convivenza', this.userContext);
    readonly canRequestAvailability = canPerformAction('invia-richiesta-struttura', this.userContext) || this.userContext.isCatechista || this.userContext.isOstiario || this.userContext.isCollaboratoreConvivenze;
    readonly serviziOptions = ['Camere', 'Sala incontri', 'Cucina', 'Parcheggio', 'Accessibilità', 'Spazio bambini'];
    readonly tipiConvivenza = [...TIPI_CONVIVENZA_ANNUALE, ...TAPPE_UFFICIALI_CAMMINO];
    readonly strutture: CatalogoStruttura[] = POSTI_CONVIVENZA_MOCK.map((struttura) => ({
        ...struttura,
        capienza: struttura.capienza ?? this.capienzaStimata(struttura),
        statoDisponibilita: struttura.statoDisponibilita === 'Da verificare' && struttura.statoRelazione === 'Partner attivo' ? 'Disponibile' : struttura.statoDisponibilita
    }));
    selected: CatalogoStruttura = this.strutture[0];
    requestOpen = false;
    requestStructure: CatalogoStruttura | null = null;
    feedback = '';

    filters = {
        dataInizio: '',
        dataFine: '',
        partecipanti: 35,
        localita: '',
        capienzaMinima: null as number | null,
        servizio: null as string | null,
        accessibilita: false,
        soloAttive: true
    };

    requestForm = this.emptyRequestForm();

    get struttureFiltrate() {
        const localita = this.filters.localita.trim().toLowerCase();
        const servizio = this.filters.servizio;

        return this.strutture.filter((struttura) => {
            const matchesLocalita = !localita || [struttura.regione, struttura.citta, struttura.zona, struttura.indirizzo].some((value) => value.toLowerCase().includes(localita));
            const matchesCapienza = !this.filters.capienzaMinima || (struttura.capienza ?? 0) >= this.filters.capienzaMinima;
            const matchesPartecipanti = !this.filters.partecipanti || (struttura.capienza ?? 0) >= this.filters.partecipanti;
            const matchesAttive = !this.filters.soloAttive || struttura.statoDisponibilita === 'Disponibile';
            const matchesAccessibilita = !this.filters.accessibilita || struttura.servizi.accessibilita;
            const matchesServizio = !servizio || this.hasServizio(struttura, servizio);
            return matchesLocalita && matchesCapienza && matchesPartecipanti && matchesAttive && matchesAccessibilita && matchesServizio;
        });
    }

    select(struttura: CatalogoStruttura): void {
        this.selected = struttura;
    }

    apriRichiesta(struttura: CatalogoStruttura): void {
        if (!this.canRequestAvailability) {
            return;
        }

        this.requestStructure = struttura;
        this.requestForm = this.emptyRequestForm();
        this.requestOpen = true;
        this.feedback = '';
    }

    chiudiRichiesta(): void {
        this.requestOpen = false;
        this.requestStructure = null;
        this.feedback = '';
    }

    salvaRichiesta(): void {
        if (!this.requestStructure) {
            return;
        }

        const richiesta: RichiestaDisponibilitaMock = {
            id: `RD-${Date.now()}`,
            strutturaId: this.requestStructure.id,
            strutturaNome: this.requestStructure.nome,
            convivenzaCollegata: this.requestForm.convivenzaCollegata.trim() || 'Convivenza da collegare',
            dataInizio: this.requestForm.dataInizio,
            dataFine: this.requestForm.dataFine,
            partecipanti: Number(this.requestForm.partecipanti) || 0,
            tipoConvivenza: this.requestForm.tipoConvivenza,
            note: this.requestForm.note,
            esigenze: this.requestForm.esigenze,
            stato: 'inviata',
            creataIl: new Date().toISOString()
        };

        const richieste = this.readRichieste();
        localStorage.setItem(RICHIESTE_DISPONIBILITA_KEY, JSON.stringify([richiesta, ...richieste]));
        this.feedback = 'Richiesta disponibilità inviata alla struttura in modalità mock.';
    }

    storicoRichieste(strutturaId: number): RichiestaDisponibilitaMock[] {
        return this.readRichieste().filter((richiesta) => richiesta.strutturaId === strutturaId);
    }

    serviziPrincipali(struttura: PostoConvivenza): string[] {
        const servizi = [
            struttura.servizi.camere ? 'Camere' : '',
            struttura.servizi.salaIncontri ? 'Sala incontri' : '',
            struttura.servizi.cucina ? 'Cucina' : '',
            struttura.servizi.parcheggio ? 'Parcheggio' : '',
            struttura.servizi.accessibilita ? 'Accessibilità' : '',
            struttura.servizi.spazioBambini ? 'Spazio bambini' : ''
        ].filter(Boolean);
        return servizi.length ? servizi : ['Servizi da verificare'];
    }

    getFoto(struttura: PostoConvivenza): string {
        if (struttura.tipo === 'Hotel') {
            return '/images/backgrounds/richieste-strutture-bg.jpg';
        }
        if (struttura.citta === 'Roma') {
            return '/images/backgrounds/comunita-bg.jpg';
        }
        return '/images/backgrounds/posti-convivenza-bg.jpg';
    }

    private emptyRequestForm() {
        return {
            convivenzaCollegata: `${this.community.nomeComunita} - ${this.community.parrocchiaNome}`,
            dataInizio: this.filters.dataInizio,
            dataFine: this.filters.dataFine,
            partecipanti: this.filters.partecipanti,
            tipoConvivenza: this.tipiConvivenza[0] ?? 'Convivenza domenicale',
            note: '',
            esigenze: ''
        };
    }

    private readRichieste(): RichiestaDisponibilitaMock[] {
        try {
            return JSON.parse(localStorage.getItem(RICHIESTE_DISPONIBILITA_KEY) ?? '[]') as RichiestaDisponibilitaMock[];
        } catch {
            return [];
        }
    }

    private hasServizio(struttura: PostoConvivenza, servizio: string): boolean {
        switch (servizio) {
            case 'Camere': return struttura.servizi.camere;
            case 'Sala incontri': return struttura.servizi.salaIncontri;
            case 'Cucina': return struttura.servizi.cucina;
            case 'Parcheggio': return struttura.servizi.parcheggio;
            case 'Accessibilità': return struttura.servizi.accessibilita;
            case 'Spazio bambini': return struttura.servizi.spazioBambini;
            default: return true;
        }
    }

    private capienzaStimata(struttura: PostoConvivenza): number {
        if (struttura.nome === 'San Gaetano') {
            return 80;
        }
        if (struttura.tipo === 'Hotel') {
            return 60;
        }
        return struttura.servizi.camere ? 45 : 25;
    }
}
