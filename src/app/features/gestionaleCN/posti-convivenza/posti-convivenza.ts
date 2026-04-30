import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, OnDestroy, inject, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import L from 'leaflet';
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

type ServizioFiltro = keyof Pick<ServiziPosto, 'salaIncontri' | 'cucina' | 'parcheggio' | 'accessibilita' | 'spazioBambini'>;

@Component({
    selector: 'app-posti-convivenza',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink, ButtonModule, InputTextModule, SelectModule, TagModule],
    template: `
        <section class="posti-page">
            <header class="page-head">
                <div>
                    <h1>Posti di Convivenza</h1>
                    <p>Censimento operativo delle strutture, con mappa interattiva e richiesta collegata al posto selezionato.</p>
                </div>
                <div class="head-actions">
                    <a pButton [routerLink]="mappaRoute" icon="pi pi-map" label="Vista mappa futura" outlined></a>
                    <button pButton type="button" icon="pi pi-plus" label="Nuovo posto"></button>
                </div>
            </header>

            <section class="stats">
                <div><span>Totale posti</span><strong>{{ posti.length }}</strong></div>
                <div><span>Filtrati</span><strong>{{ postiFiltrati().length }}</strong></div>
                @for (stato of statiDisponibilita; track stato) {
                    <div><span>{{ stato }}</span><strong>{{ countByDisponibilita(stato) }}</strong></div>
                }
            </section>

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
                        <div class="result-count">{{ postiFiltrati().length }} strutture</div>
                        @for (posto of postiFiltrati(); track posto.id) {
                            <button type="button" class="posto-item" [class.active]="posto.id === selected.id" (click)="select(posto, true)">
                                <span class="posto-title">{{ posto.nome }}</span>
                                <span class="posto-meta">{{ posto.tipo }} · {{ posto.zona || posto.citta }}</span>
                                <span class="posto-address">{{ posto.indirizzo || 'Indirizzo da completare' }}</span>
                                <span class="posto-capacity">Capienza: {{ posto.capienza ?? 'Da completare' }}</span>
                                <span class="badges">
                                    <span class="local-badge">{{ posto.tipo }}</span>
                                    <span class="local-badge" [ngClass]="getDisponibilitaClass(posto.statoDisponibilita)">{{ posto.statoDisponibilita }}</span>
                                </span>
                            </button>
                        } @empty {
                            <div class="empty-state">Nessun posto corrisponde ai filtri selezionati.</div>
                        }
                    </section>
                </aside>

                <main class="map-panel">
                    <div class="map-shell">
                        <div #mapContainer class="interactive-map" aria-label="Mappa strutture censite"></div>
                    </div>

                    <section class="detail-card">
                        <div class="detail-head">
                            <div>
                                <span class="eyebrow">{{ selected.tipo }}</span>
                                <h2>{{ selected.nome }}</h2>
                                <p>{{ selected.indirizzo }} · {{ selected.citta }}</p>
                            </div>
                            <p-tag [value]="selected.statoDisponibilita" [severity]="getDisponibilitaSeverity(selected.statoDisponibilita)" />
                        </div>

                        @if (!selected.email) {
                            <div class="email-warning"><i class="pi pi-exclamation-triangle"></i><span>Email struttura mancante.</span></div>
                        }

                        <dl class="detail-grid">
                            <div><dt>Zona</dt><dd>{{ displayValue(selected.zona) }}</dd></div>
                            <div><dt>Tipo</dt><dd>{{ selected.tipo }}</dd></div>
                            <div><dt>Capienza</dt><dd>{{ selected.capienza ?? 'Da completare' }}</dd></div>
                            <div><dt>Referente</dt><dd>{{ displayValue(selected.referente) }}</dd></div>
                            <div><dt>Telefono</dt><dd>{{ displayValue(selected.telefono) }}</dd></div>
                            <div><dt>Email</dt><dd>{{ displayValue(selected.email) }}</dd></div>
                            <div><dt>Stato verifica</dt><dd>{{ selected.statoDisponibilita }}</dd></div>
                            <div><dt>Coordinate</dt><dd>{{ selected.lat }}, {{ selected.lng }}</dd></div>
                        </dl>

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
                            <button pButton type="button" label="Invia richiesta" icon="pi pi-send" (click)="apriNuovaRichiesta(selected)"></button>
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
            .posti-page { display: grid; gap: 1.25rem; }
            .page-head { display: flex; justify-content: space-between; gap: 1rem; align-items: center; }
            .page-head h1 { margin: 0 0 .35rem; font-size: 2rem; color: #111827; }
            .page-head p { margin: 0; color: #64748b; }
            .head-actions { display: flex; flex-wrap: wrap; gap: .75rem; justify-content: flex-end; }
            .head-actions a,
            .head-actions button { min-height: 44px; }
            .stats { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: .75rem; }
            .stats div,
            .filters,
            .list-panel,
            .map-shell,
            .detail-card {
                background: #fff;
                border: 1px solid #e5e7eb;
                border-radius: 14px;
                box-shadow: 0 10px 26px rgba(15,23,42,.06);
            }
            .stats div { padding: .9rem; }
            .stats span { display: block; color: #64748b; font-size: .82rem; }
            .stats strong { display: block; margin-top: .2rem; color: #111827; font-size: 1.2rem; }
            .map-layout { display: grid; grid-template-columns: minmax(20rem, 35%) minmax(0, 65%); gap: 1.25rem; align-items: start; }
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
            .list-panel { padding: .75rem; display: grid; gap: .75rem; align-content: start; max-height: 650px; overflow: auto; }
            .result-count { color: #64748b; font-weight: 800; padding: .25rem .25rem .4rem; }
            .posto-item {
                min-height: 128px;
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
            .empty-state {
                border: 1px dashed #cbd5e1;
                border-radius: 12px;
                padding: 1rem;
                color: #64748b;
                text-align: center;
            }
            .map-panel { display: grid; gap: 1rem; min-width: 0; }
            .map-shell { padding: .75rem; }
            .interactive-map {
                min-height: 650px;
                height: 650px;
                width: 100%;
                border-radius: 12px;
                overflow: hidden;
                background: #eef2f7;
            }
            :host ::ng-deep .leaflet-container { font-family: inherit; }
            :host ::ng-deep .structure-marker {
                width: 30px;
                height: 30px;
                border-radius: 999px;
                border: 3px solid #fff;
                background: #315f8f;
                box-shadow: 0 8px 20px rgba(15, 23, 42, .25);
            }
            :host ::ng-deep .structure-marker.selected { background: #b86f35; transform: scale(1.15); }
            .detail-card { padding: 1.1rem; }
            .detail-head { display: flex; justify-content: space-between; gap: 1rem; align-items: flex-start; margin-bottom: 1rem; }
            .eyebrow { color: #64748b; font-weight: 800; font-size: .85rem; }
            .detail-head h2 { margin: .2rem 0 .25rem; font-size: 1.45rem; color: #111827; }
            .detail-head p { margin: 0; color: #64748b; }
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
            .history h3 { margin: 1rem 0 .55rem; color: #111827; }
            .notes p,
            .history p { margin: 0; color: #4b5563; line-height: 1.5; }
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
            @media (max-width: 1200px) {
                .stats { grid-template-columns: repeat(3, minmax(0, 1fr)); }
                .map-layout { grid-template-columns: 1fr; }
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
                .stats,
                .detail-grid { grid-template-columns: 1fr; }
                .service-filter button { flex: 1 1 100%; justify-content: center; }
                .interactive-map { min-height: 360px; height: 420px; }
                .posto-item { min-height: auto; padding: 1rem; }
                .detail-head { flex-direction: column; }
            }
        `
    ]
})
export class PostiConvivenza implements AfterViewInit, OnDestroy {
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);

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
    readonly posti = this.isDemo ? this.creaPostiDemo() : POSTI_CONVIVENZA_MOCK;
    readonly tipi = Array.from(new Set(this.posti.map((posto) => posto.tipo)));
    readonly zone = Array.from(new Set(this.posti.map((posto) => posto.zona || posto.citta))).sort();

    filtroTesto = '';
    filtroZona: string | null = null;
    filtroCapienza: number | null = null;
    filtroTipo: TipoStrutturaMappa | null = null;
    filtroDisponibilita: StatoDisponibilitaPosto | null = null;
    serviziSelezionati: ServizioFiltro[] = [];
    selected = this.posti[0];

    private map: L.Map | null = null;
    private markerLayer: L.LayerGroup | null = null;

    get isDemo() {
        const url = this.router.url.split('?')[0].split('#')[0];
        return this.route.snapshot.data['demo'] === true || url === '/demo' || url.startsWith('/demo/');
    }

    get mappaRoute() {
        return this.isDemo ? '/demo/posti-convivenza/mappa' : '/gestionale-cn/posti-convivenza/mappa';
    }

    ngAfterViewInit() {
        this.initMap();
    }

    ngOnDestroy() {
        this.map?.remove();
        this.map = null;
    }

    select(posto: PostoConvivenza, centerMap = false) {
        this.selected = posto;
        this.aggiornaMappa(centerMap);
    }

    apriNuovaRichiesta(posto: PostoConvivenza) {
        this.router.navigate(['/gestionale-cn/richieste-strutture/nuova'], { queryParams: { strutturaId: posto.id } });
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

    displayValue(value: string | null) {
        return value && value.trim() ? value : 'Da completare';
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
        if (!this.map || !this.markerLayer) {
            return;
        }

        this.markerLayer.clearLayers();
        const filtrati = this.postiFiltrati();

        filtrati.forEach((posto) => {
            const marker = L.marker([posto.lat, posto.lng], { icon: this.markerIcon(posto.id === this.selected.id) })
                .bindTooltip(posto.nome, { direction: 'top' })
                .on('click', () => this.select(posto, false));
            marker.addTo(this.markerLayer!);
        });

        if (centerSelected) {
            this.map.setView([this.selected.lat, this.selected.lng], 14);
            return;
        }

        if (filtrati.length) {
            const bounds = L.latLngBounds(filtrati.map((posto) => [posto.lat, posto.lng] as [number, number]));
            this.map.fitBounds(bounds, { padding: [28, 28], maxZoom: 13 });
        }
    }

    private initMap() {
        if (!this.mapContainer || this.map) {
            return;
        }

        this.map = L.map(this.mapContainer.nativeElement, { zoomControl: true }).setView([this.selected.lat, this.selected.lng], 11);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; OpenStreetMap'
        }).addTo(this.map);
        this.markerLayer = L.layerGroup().addTo(this.map);
        this.aggiornaMappa(true);
        setTimeout(() => this.map?.invalidateSize(), 0);
    }

    private markerIcon(selected: boolean) {
        return L.divIcon({
            className: `structure-marker${selected ? ' selected' : ''}`,
            iconSize: [30, 30],
            iconAnchor: [15, 15]
        });
    }

    private creaPostiDemo(): PostoConvivenza[] {
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
                servizi: {
                    camere: true,
                    salaIncontri: true,
                    cucina: index !== 2,
                    parcheggio: index !== 1,
                    accessibilita: index === 0,
                    spazioBambini: index === 1
                },
                valutazioneInterna: index === 0 ? 'positivo' : 'non valutato'
            };
        });
    }
}
