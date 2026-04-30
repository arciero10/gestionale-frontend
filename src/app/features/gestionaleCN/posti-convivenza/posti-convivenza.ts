import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { PlaceMapComponent } from '../maps/place-map';
import { POSTI_CONVIVENZA_MOCK, PostoConvivenza, ServiziPosto, StatoRelazione, TipologiaPosto } from '../data/posti-convivenza.mock';
import { DEMO_POSTI } from '../../demo/demo.mock';

type ServizioFiltro = keyof Pick<ServiziPosto, 'salaIncontri' | 'cucina' | 'parcheggio' | 'accessibilita' | 'spazioBambini'>;

@Component({
    selector: 'app-posti-convivenza',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink, ButtonModule, InputTextModule, SelectModule, TagModule, PlaceMapComponent],
    template: `
        <section class="posti-page">
            <header class="page-head">
                <div>
                    <h1>Posti di Convivenza</h1>
                    <p>Censimento operativo dei luoghi, contatti, servizi e relazione con le strutture.</p>
                </div>
                <div class="head-actions">
                    <a pButton [routerLink]="mappaRoute" icon="pi pi-map" label="Vista mappa" outlined></a>
                    <button pButton type="button" icon="pi pi-plus" label="Nuovo posto"></button>
                </div>
            </header>

            <section class="stats">
                <div><span>Totale posti</span><strong>{{ posti.length }}</strong></div>
                <div><span>Filtrati</span><strong>{{ postiFiltrati().length }}</strong></div>
                @for (stato of statiRelazione; track stato) {
                    <div><span>{{ stato }}</span><strong>{{ countByStato(stato) }}</strong></div>
                }
            </section>

            <section class="filters">
                <input pInputText placeholder="Cerca nome, indirizzo, citta, email" [(ngModel)]="filtroTesto" />
                <input pInputText placeholder="Citta o regione" [(ngModel)]="filtroLuogo" />
                <input pInputText type="number" placeholder="Capienza minima" [(ngModel)]="filtroCapienza" />
                <p-select appendTo="body" panelStyleClass="modal-dropdown-panel" [options]="tipologie" [(ngModel)]="filtroTipologia" placeholder="Tipologia" [showClear]="true"></p-select>
                <p-select appendTo="body" panelStyleClass="modal-dropdown-panel" [options]="statiRelazione" [(ngModel)]="filtroStato" placeholder="Stato relazione" [showClear]="true"></p-select>
                <div class="service-filter">
                    @for (servizio of serviziFiltri; track servizio.key) {
                        <button type="button" [class.active]="hasServizioFilter(servizio.key)" (click)="toggleServizio(servizio.key)">
                            <i class="pi pi-check"></i>
                            {{ servizio.label }}
                        </button>
                    }
                </div>
            </section>

            <div class="workspace">
                <aside class="list-panel">
                    <div class="result-count">{{ postiFiltrati().length }} risultati</div>
                    @for (posto of postiFiltrati(); track posto.id) {
                        <button type="button" class="posto-item" [class.active]="posto.id === selected.id" (click)="select(posto)">
                            <span class="posto-title">{{ posto.nome }}</span>
                            <span class="posto-address">{{ posto.indirizzo || 'Indirizzo da completare' }}</span>
                            <span>{{ posto.citta }}, {{ posto.regione }} · Capienza {{ posto.capienza ?? 'n/d' }}</span>
                            <span class="badges">
                                <span class="local-badge">{{ posto.tipologia }}</span>
                                <span class="local-badge" [ngClass]="getRelazioneClass(posto.statoRelazione)">{{ posto.statoRelazione }}</span>
                            </span>
                        </button>
                    } @empty {
                        <div class="empty-state">Nessun posto corrisponde ai filtri selezionati.</div>
                    }
                </aside>

                <main class="detail-panel">
                    <div class="detail-card">
                        <div class="detail-head">
                            <div>
                                <span class="eyebrow">{{ selected.tipologia }}</span>
                                <h2>{{ selected.nome }}</h2>
                            </div>
                            <p-tag [value]="selected.statoRelazione" [severity]="getRelazioneSeverity(selected.statoRelazione)" />
                        </div>

                        <div class="detail-grid">
                            <div><span>Indirizzo</span><strong>{{ displayValue(selected.indirizzo) }}</strong></div>
                            <div><span>Citta / Regione</span><strong>{{ selected.citta }}, {{ selected.regione }}</strong></div>
                            <div><span>Capienza</span><strong>{{ selected.capienza ?? 'Da completare' }}</strong></div>
                            <div><span>Referente</span><strong>{{ displayValue(selected.referente) }}</strong></div>
                            <div><span>Telefono</span><strong>{{ displayValue(selected.telefono) }}</strong></div>
                            <div><span>Email</span><strong>{{ displayValue(selected.email) }}</strong></div>
                            <div><span>Sito web</span><strong>{{ displayValue(selected.sitoWeb) }}</strong></div>
                            <div><span>Ultimo contatto</span><strong>{{ displayValue(selected.ultimoContatto) }}</strong></div>
                            <div><span>Valutazione interna</span><strong>{{ selected.valutazioneInterna }}</strong></div>
                        </div>

                        <section class="services">
                            <h3>Servizi disponibili</h3>
                            <div class="service-list">
                                @for (servizio of serviziAttivi(selected); track servizio) {
                                    <span>{{ servizio }}</span>
                                } @empty {
                                    <p>Servizi da completare.</p>
                                }
                            </div>
                        </section>

                        <section class="notes">
                            <h3>Note censimento</h3>
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
                            @if (selected.googleMapsUrl) {
                                <a pButton [href]="selected.googleMapsUrl" target="_blank" rel="noopener" icon="pi pi-external-link" label="Apri in Google Maps" outlined></a>
                            }
                            <button pButton type="button" label="Prepara richiesta" icon="pi pi-send"></button>
                            <button pButton type="button" label="Usa per una convivenza" icon="pi pi-calendar-plus"></button>
                        </div>
                    </div>

                    <aside class="map-card">
                        <app-place-map
                            [nome]="selected.nome"
                            [indirizzo]="selected.indirizzo"
                            [citta]="selected.citta"
                            [regione]="selected.regione"
                            [latitudine]="selected.latitudine"
                            [longitudine]="selected.longitudine"
                            [googleMapsUrl]="selected.googleMapsUrl"
                        />
                    </aside>
                </main>
            </div>
        </section>
    `,
    styles: [
        `
            .posti-page { display: grid; gap: 1.5rem; }
            .page-head { display: flex; justify-content: space-between; gap: 1rem; align-items: center; }
            .page-head h1 { margin: 0 0 .35rem; font-size: 2rem; }
            .page-head p { margin: 0; color: #64748b; }
            .head-actions { display: flex; flex-wrap: wrap; gap: .75rem; justify-content: flex-end; }
            .head-actions a,
            .head-actions button { min-height: 44px; }
            .stats { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: .75rem; }
            .stats div, .filters, .list-panel, .detail-card, .map-card {
                background: #fff;
                border: 1px solid #e5e7eb;
                border-radius: 14px;
                box-shadow: 0 10px 26px rgba(15,23,42,.06);
            }
            .stats div { padding: .9rem; }
            .stats span { display: block; color: #64748b; font-size: .82rem; }
            .stats strong { display: block; margin-top: .2rem; color: #111827; font-size: 1.2rem; }
            .filters { display: grid; grid-template-columns: minmax(14rem, 1fr) 13rem 11rem 14rem 14rem; gap: .75rem; padding: 1rem; }
            .service-filter { grid-column: 1 / -1; display: flex; flex-wrap: wrap; gap: .5rem; }
            .service-filter button {
                min-height: 40px;
                border: 1px solid #d7dee8;
                border-radius: 999px;
                background: #f8fafc;
                color: #334155;
                padding: .45rem .8rem;
                cursor: pointer;
                display: inline-flex;
                align-items: center;
                gap: .4rem;
                font-weight: 700;
            }
            .service-filter button .pi { opacity: .45; }
            .service-filter button.active {
                background: #e0f2fe;
                border-color: #7dd3fc;
                color: #075985;
            }
            .service-filter button.active .pi { opacity: 1; }
            .workspace { display: grid; grid-template-columns: 24rem minmax(0, 1fr); gap: 1.25rem; }
            .list-panel { padding: .75rem; display: grid; gap: .75rem; align-content: start; max-height: calc(100vh - 15rem); overflow: auto; }
            .result-count { color: #64748b; font-weight: 700; padding: .25rem .25rem .5rem; }
            .posto-item {
                min-height: 118px;
                text-align: left;
                border: 1px solid #e5e7eb;
                border-radius: 12px;
                background: #fafafa;
                padding: .9rem 1rem;
                cursor: pointer;
                display: grid;
                gap: .55rem;
                align-content: start;
                color: #111827;
                line-height: 1.35;
                overflow: visible;
            }
            .posto-item.active { border-color: #b86f35; background: #fff7ed; }
            .posto-item > span {
                display: block;
                min-width: 0;
                color: #64748b;
                overflow-wrap: anywhere;
            }
            .posto-title {
                color: #111827 !important;
                font-weight: 850;
                line-height: 1.25;
            }
            .posto-address {
                color: #475569 !important;
            }
            .badges { display: flex !important; flex-wrap: wrap; gap: .4rem; align-items: center; }
            .local-badge {
                display: inline-flex;
                align-items: center;
                min-height: 1.7rem;
                padding: .22rem .55rem;
                border-radius: 999px;
                background: #f1f5f9;
                color: #334155 !important;
                border: 1px solid #e2e8f0;
                font-size: .78rem;
                font-weight: 800;
                line-height: 1.2;
                white-space: normal;
            }
            .relazione-partner { background: #dcfce7; color: #166534 !important; border-color: #bbf7d0; }
            .relazione-interessato { background: #dbeafe; color: #1d4ed8 !important; border-color: #bfdbfe; }
            .relazione-verificare { background: #fef3c7; color: #92400e !important; border-color: #fde68a; }
            .relazione-non-disponibile { background: #fee2e2; color: #991b1b !important; border-color: #fecaca; }
            .relazione-censito { background: #f1f5f9; color: #334155 !important; border-color: #cbd5e1; }
            .empty-state {
                border: 1px dashed #cbd5e1;
                border-radius: 12px;
                padding: 1rem;
                color: #64748b;
                text-align: center;
            }
            .detail-panel { display: grid; grid-template-columns: minmax(0, 1fr) minmax(20rem, 24rem); gap: 1.25rem; align-items: start; }
            .detail-card, .map-card { padding: 1.25rem; }
            .detail-head { display: flex; justify-content: space-between; gap: 1rem; align-items: flex-start; margin-bottom: 1rem; }
            .eyebrow { color: #64748b; font-weight: 700; font-size: .85rem; }
            .detail-head h2 { margin: .2rem 0 0; font-size: 1.5rem; }
            .detail-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: .85rem; }
            .detail-grid div { border: 1px solid #e5e7eb; border-radius: 12px; padding: .85rem; background: #fbfbf8; }
            .detail-grid span { display: block; color: #64748b; font-size: .82rem; }
            .detail-grid strong { display: block; margin-top: .25rem; color: #111827; word-break: break-word; }
            .services h3, .notes h3, .history h3 { margin: 1.25rem 0 .75rem; }
            .service-list { display: flex; flex-wrap: wrap; gap: .5rem; }
            .service-list span,
            .history span {
                display: inline-flex;
                padding: .45rem .65rem;
                border-radius: 999px;
                background: #f1f5f9;
                color: #334155;
                font-weight: 700;
            }
            .service-list p,
            .notes p,
            .history p { margin: 0; color: #4b5563; }
            .actions { display: flex; flex-wrap: wrap; gap: .75rem; margin-top: 1.25rem; justify-content: flex-end; }
            .actions a,
            .actions button { min-height: 44px; }
            @media (max-width: 1200px) {
                .stats { grid-template-columns: repeat(3, minmax(0, 1fr)); }
                .filters, .workspace, .detail-panel { grid-template-columns: 1fr; }
                .list-panel { max-height: none; }
                .detail-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
            }
            @media (max-width: 767px) {
                .page-head { flex-direction: column; align-items: stretch; }
                .head-actions,
                .actions { flex-direction: column; }
                .head-actions a,
                .head-actions button,
                .actions a,
                .actions button { width: 100%; }
                .stats, .detail-grid { grid-template-columns: 1fr; }
                .service-filter button { flex: 1 1 100%; justify-content: center; }
                .posto-item { min-height: auto; padding: 1rem; }
            }
        `
    ]
})
export class PostiConvivenza {
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);

    readonly statiRelazione: StatoRelazione[] = ['Da verificare', 'Censito internamente', 'Interessato al progetto', 'Partner attivo', 'Non disponibile'];
    readonly tipologie: TipologiaPosto[] = ['Casa di convivenza', 'Parrocchia', 'Istituto religioso', 'Casa per ritiri', 'Albergo / pensione', 'Altro'];
    readonly serviziFiltri: { key: ServizioFiltro; label: string }[] = [
        { key: 'salaIncontri', label: 'Sala incontri' },
        { key: 'cucina', label: 'Cucina' },
        { key: 'parcheggio', label: 'Parcheggio' },
        { key: 'accessibilita', label: 'Accessibilita' },
        { key: 'spazioBambini', label: 'Spazio bambini' }
    ];
    readonly posti = this.isDemo ? this.creaPostiDemo() : POSTI_CONVIVENZA_MOCK;

    filtroTesto = '';
    filtroLuogo = '';
    filtroCapienza: number | null = null;
    filtroTipologia: TipologiaPosto | null = null;
    filtroStato: StatoRelazione | null = null;
    serviziSelezionati: ServizioFiltro[] = [];
    selected = this.posti[0];

    get isDemo() {
        const url = this.router.url.split('?')[0].split('#')[0];
        return this.route.snapshot.data['demo'] === true || url === '/demo' || url.startsWith('/demo/');
    }

    get mappaRoute() {
        return this.isDemo ? '/demo/posti-convivenza/mappa' : '/gestionale-cn/posti-convivenza/mappa';
    }

    private creaPostiDemo(): PostoConvivenza[] {
        return DEMO_POSTI.map((posto, index) => ({
            id: index + 1,
            nome: posto.nome,
            tipologia: posto.tipologia as TipologiaPosto,
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
            note: 'Scheda dimostrativa, senza dati reali.',
            latitudine: null,
            longitudine: null,
            placeId: null,
            googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${posto.nome}, ${posto.citta}, ${posto.regione}`)}`,
            ultimoContatto: null,
            storicoConvivenze: index === 0 ? ['Convivenza di Avvento'] : [],
            servizi: {
                camere: true,
                salaIncontri: true,
                cucina: index !== 2,
                parcheggio: index !== 1,
                accessibilita: index === 0,
                spazioBambini: index === 1
            },
            valutazioneInterna: index === 0 ? 'positivo' : 'non valutato'
        }));
    }

    select(posto: PostoConvivenza) {
        this.selected = posto;
    }

    toggleServizio(servizio: ServizioFiltro) {
        this.serviziSelezionati = this.hasServizioFilter(servizio) ? this.serviziSelezionati.filter((item) => item !== servizio) : [...this.serviziSelezionati, servizio];
    }

    hasServizioFilter(servizio: ServizioFiltro) {
        return this.serviziSelezionati.includes(servizio);
    }

    countByStato(stato: StatoRelazione) {
        return this.posti.filter((posto) => posto.statoRelazione === stato).length;
    }

    postiFiltrati() {
        const testo = this.filtroTesto.trim().toLowerCase();
        const luogo = this.filtroLuogo.trim().toLowerCase();

        return this.posti.filter((posto) => {
            const haystack = `${posto.nome} ${posto.indirizzo} ${posto.indirizzoNormalizzato} ${posto.citta} ${posto.regione} ${posto.email}`.toLowerCase();
            const matchTesto = !testo || haystack.includes(testo);
            const matchLuogo = !luogo || posto.citta.toLowerCase().includes(luogo) || posto.regione.toLowerCase().includes(luogo);
            const matchCapienza = !this.filtroCapienza || (posto.capienza != null && posto.capienza >= this.filtroCapienza);
            const matchTipologia = !this.filtroTipologia || posto.tipologia === this.filtroTipologia;
            const matchStato = !this.filtroStato || posto.statoRelazione === this.filtroStato;
            const matchServizi = this.serviziSelezionati.every((servizio) => posto.servizi[servizio]);
            return matchTesto && matchLuogo && matchCapienza && matchTipologia && matchStato && matchServizi;
        });
    }

    serviziAttivi(posto: PostoConvivenza) {
        const labels: Record<keyof ServiziPosto, string> = {
            camere: 'Camere',
            salaIncontri: 'Sala incontri',
            cucina: 'Cucina',
            parcheggio: 'Parcheggio',
            accessibilita: 'Accessibilita',
            spazioBambini: 'Spazio bambini'
        };

        return (Object.keys(posto.servizi) as (keyof ServiziPosto)[]).filter((servizio) => posto.servizi[servizio]).map((servizio) => labels[servizio]);
    }

    displayValue(value: string | null) {
        return value && value.trim() ? value : 'Da completare';
    }

    getRelazioneSeverity(stato: StatoRelazione) {
        switch (stato) {
            case 'Partner attivo':
                return 'success';
            case 'Interessato al progetto':
                return 'info';
            case 'Da verificare':
                return 'warn';
            case 'Non disponibile':
                return 'danger';
            default:
                return 'secondary';
        }
    }

    getRelazioneClass(stato: StatoRelazione) {
        switch (stato) {
            case 'Partner attivo':
                return 'relazione-partner';
            case 'Interessato al progetto':
                return 'relazione-interessato';
            case 'Da verificare':
                return 'relazione-verificare';
            case 'Non disponibile':
                return 'relazione-non-disponibile';
            default:
                return 'relazione-censito';
        }
    }
}
