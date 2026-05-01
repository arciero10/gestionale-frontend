import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { DEMO_COMUNITA, DEMO_CONVIVENZE, DEMO_POSTI } from '../../demo/demo.mock';
import { EQUIPE_CATECHISTI_PILOTA } from '../data/comunita-pilota.mock';
import { getCurrentCommunity } from '../data/community-selection.storage';
import {
    CategoriaConvivenza,
    SoggettoOrganizzatoreConvivenza,
    TIPI_CONVIVENZA_ANNUALE,
    TIPI_CONVIVENZA_CATECHISTICA,
    TipoConvivenza,
    isTipoConvivenzaCatechistica
} from '../data/tappe-cammino.mock';

type StatoConvivenza = 'Bozza' | 'In preparazione' | 'Richiesta inviata' | 'Confermata' | 'Conclusa';
type StatoRichiestaStruttura = 'Non inviata' | 'In preparazione' | 'Inviata' | 'Confermata' | 'Rifiutata';

interface Convivenza {
    id: number;
    titolo: string;
    categoriaConvivenza: CategoriaConvivenza;
    tipoConvivenza: TipoConvivenza;
    soggettoOrganizzatore: SoggettoOrganizzatoreConvivenza;
    equipeOrganizzatriceId: number | null;
    equipeOrganizzatriceNome: string;
    comunitaDestinatariaId: number | null;
    comunitaDestinatariaNome: string;
    strutturaId: number | null;
    dataInizio: string;
    dataFine: string;
    stato: StatoConvivenza;
    partecipantiPrevisti: number;
    partecipantiConfermati: number;
    luogoTestuale: string;
    citta: string;
    note: string;
    statoRichiestaStruttura: StatoRichiestaStruttura;
    aggregati: {
        adulti: number;
        bambini: number;
        famiglieConBambini: number;
        pastiSpeciali: number;
        esigenzeAlloggio: number;
        documentiRicevuti: number;
        documentiRichiesti: number;
        consensiMancanti: number;
        consensiRaccolti: number;
        consensiDaVerificare: number;
        consensiNegatiRevocati: number;
    };
}

interface PostoSintesi {
    id: number;
    nome: string;
    citta: string;
    regione: string;
}

@Component({
    selector: 'app-convivenze',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, SelectModule, TagModule],
    template: `
        <section class="convivenze-page">
            <header class="page-head">
                <div>
                    <h1>Convivenze</h1>
                    <p>Convivenze ricevute dai catechisti, annuali della comunità e richieste alle strutture.</p>
                </div>
                <button pButton type="button" icon="pi pi-plus" label="Nuova convivenza" (click)="formNuovaConvivenzaVisibile = !formNuovaConvivenzaVisibile"></button>
            </header>

            @if (formNuovaConvivenzaVisibile) {
                <section class="new-convivenza-box">
                    <div class="form-intro">
                        <h2>Nuova convivenza</h2>
                        <p>Bozza front-end: per le convivenze catechistiche l'organizzatore è sempre l'equipe dei catechisti.</p>
                    </div>

                    <div>
                        <label for="categoriaNuovaConvivenza">Categoria convivenza</label>
                        <p-select inputId="categoriaNuovaConvivenza" appendTo="body" panelStyleClass="modal-dropdown-panel" [options]="categorieForm" [(ngModel)]="nuovaCategoria" (ngModelChange)="aggiornaDefaultTipo()"></p-select>
                    </div>

                    @if (nuovaCategoria === 'Catechistica') {
                        <div>
                            <label for="tipoCatechistico">Tipo catechistico</label>
                            <p-select inputId="tipoCatechistico" appendTo="body" panelStyleClass="modal-dropdown-panel" [options]="tipiCatechistici" [(ngModel)]="nuovoTipoCatechistico"></p-select>
                        </div>
                        <div>
                            <label>Equipe organizzatrice</label>
                            <div class="readonly-field">{{ equipeOrganizzatriceNome }}</div>
                        </div>
                        <div>
                            <label>Comunità destinataria</label>
                            <div class="readonly-field">{{ comunitaDestinatariaNome }}</div>
                        </div>
                    } @else {
                        <div>
                            <label for="tipoAnnuale">Tipo annuale/comunitario</label>
                            <p-select inputId="tipoAnnuale" appendTo="body" panelStyleClass="modal-dropdown-panel" [options]="tipiAnnuali" [(ngModel)]="nuovoTipoAnnuale"></p-select>
                        </div>
                        <div>
                            <label>Comunità</label>
                            <div class="readonly-field">{{ comunitaDestinatariaNome }}</div>
                        </div>
                    }

                    <div>
                        <label for="dataInizio">Data inizio</label>
                        <input id="dataInizio" type="date" [(ngModel)]="nuovaDataInizio" />
                    </div>
                    <div>
                        <label for="dataFine">Data fine</label>
                        <input id="dataFine" type="date" [(ngModel)]="nuovaDataFine" />
                    </div>
                    <div>
                        <label>Struttura</label>
                        <div class="readonly-field">Da assegnare</div>
                    </div>
                    <footer>
                        <button pButton type="button" label="Salva bozza mock" icon="pi pi-save" (click)="salvaNuovaConvivenza()"></button>
                    </footer>
                </section>
            }

            <section class="filters-card">
                <label for="tipoConvivenzaFiltro">Filtra per tipo convivenza / evento</label>
                <p-select inputId="tipoConvivenzaFiltro" appendTo="body" panelStyleClass="modal-dropdown-panel" [options]="tipiConvivenza" [(ngModel)]="tipoFiltro" [showClear]="true" placeholder="Tutti i tipi"></p-select>
            </section>

            <section class="section-block">
                <div class="section-title">
                    <div>
                        <span>Comunità destinataria</span>
                        <h2>Convivenze della comunità</h2>
                    </div>
                    <strong>{{ convivenzeDellaComunita.length }}</strong>
                </div>
                <div class="workspace">
                    <aside class="list-panel">
                        @for (convivenza of convivenzeDellaComunita; track convivenza.id) {
                            <button type="button" class="convivenza-item" [class.active]="selected && convivenza.id === selected.id" (click)="select(convivenza)">
                                <span class="item-title">{{ convivenza.titolo }}</span>
                                <span class="tipo-badge" [ngClass]="getTipoClass(convivenza)">{{ convivenza.tipoConvivenza }}</span>
                                <span class="item-meta">{{ convivenza.categoriaConvivenza }} · Organizzata da: {{ convivenza.soggettoOrganizzatore }}</span>
                                <span class="item-meta">{{ convivenza.dataInizio }} - {{ convivenza.dataFine }}</span>
                                <span class="item-meta">{{ getPostoNome(convivenza) }}</span>
                                <span class="item-row">
                                    <p-tag [value]="convivenza.stato" [severity]="getStatoSeverity(convivenza.stato)" />
                                    <strong>{{ convivenza.partecipantiConfermati }}/{{ convivenza.partecipantiPrevisti }}</strong>
                                </span>
                            </button>
                        }
                    </aside>

                    @if (selected) {
                    <main class="detail-panel">
                        <div class="detail-card">
                            <div class="detail-head">
                                <div>
                                    <span class="eyebrow">{{ selected.categoriaConvivenza === 'Catechistica' ? 'Convivenza ricevuta dai catechisti' : 'Convivenza della comunità' }}</span>
                                    <h2>{{ selected.titolo }}</h2>
                                    <span class="tipo-badge" [ngClass]="getTipoClass(selected)">{{ selected.tipoConvivenza }}</span>
                                </div>
                                <p-tag [value]="selected.stato" [severity]="getStatoSeverity(selected.stato)" />
                            </div>

                            <div class="detail-grid">
                                <div><span>Categoria</span><strong>{{ selected.categoriaConvivenza }}</strong></div>
                                <div><span>Organizzata da</span><strong>{{ selected.soggettoOrganizzatore }}</strong></div>
                                <div><span>Equipe organizzatrice</span><strong>{{ selected.equipeOrganizzatriceNome || 'Non prevista' }}</strong></div>
                                <div><span>Comunità destinataria</span><strong>{{ selected.comunitaDestinatariaNome }}</strong></div>
                                <div><span>Periodo</span><strong>{{ selected.dataInizio }} - {{ selected.dataFine }}</strong></div>
                                <div><span>Posto assegnato</span><strong>{{ getPostoNome(selected) }}</strong></div>
                                <div><span>Partecipanti</span><strong>{{ selected.partecipantiConfermati }}/{{ selected.partecipantiPrevisti }}</strong></div>
                                <div><span>Richiesta struttura</span><strong>{{ selected.statoRichiestaStruttura }}</strong></div>
                            </div>

                            <section class="needs-box">
                                <h3>Partecipanti e necessità</h3>
                                <div class="needs-grid">
                                    <div><span>Adulti</span><strong>{{ selected.aggregati.adulti }}</strong></div>
                                    <div><span>Bambini</span><strong>{{ selected.aggregati.bambini }}</strong></div>
                                    <div><span>Famiglie con bambini</span><strong>{{ selected.aggregati.famiglieConBambini }}</strong></div>
                                    <div><span>Pasti speciali</span><strong>{{ selected.aggregati.pastiSpeciali }}</strong></div>
                                    <div><span>Esigenze alloggio</span><strong>{{ selected.aggregati.esigenzeAlloggio }}</strong></div>
                                    <div><span>Documenti ricevuti</span><strong>{{ selected.aggregati.documentiRicevuti }}/{{ selected.aggregati.documentiRichiesti }}</strong></div>
                                    <div><span>Consensi da verificare</span><strong>{{ selected.aggregati.consensiMancanti }}</strong></div>
                                </div>
                            </section>

                            <section class="privacy-box">
                                <h3>Verifica consensi</h3>
                                <p>Prima di inviare dati a una struttura, controlla che i partecipanti abbiano fornito il consenso necessario alla condivisione dei dati utili all’organizzazione.</p>
                                <div class="privacy-stats">
                                    <div><span>Consensi raccolti</span><strong>{{ selected.aggregati.consensiRaccolti }}</strong></div>
                                    <div><span>Da verificare</span><strong>{{ selected.aggregati.consensiDaVerificare }}</strong></div>
                                    <div><span>Negati/revocati</span><strong>{{ selected.aggregati.consensiNegatiRevocati }}</strong></div>
                                </div>
                            </section>

                            <div class="actions">
                                <button pButton type="button" label="Modifica" icon="pi pi-pencil" outlined></button>
                                <button pButton type="button" label="Assegna posto" icon="pi pi-building" outlined></button>
                                <button pButton type="button" label="Prepara richiesta struttura" icon="pi pi-send"></button>
                            </div>
                        </div>

                        <aside class="map-card">
                            <div class="map-placeholder">
                                <i class="pi pi-map-marker"></i>
                                <h3>Mappa luogo convivenza</h3>
                                <strong>{{ getPostoNome(selected) }}</strong>
                                <span>{{ selected.citta || selected.luogoTestuale }}</span>
                                <small>Google Maps sarà integrato in una fase successiva.</small>
                            </div>
                        </aside>
                    </main>
                    } @else {
                        <main class="detail-panel">
                            <div class="detail-card empty-state">
                                <h2>Nessuna convivenza ancora programmata</h2>
                                <p>Questa comunità non ha ancora convivenze associate. Puoi crearne una dal form “Nuova convivenza”.</p>
                            </div>
                        </main>
                    }
                </div>
            </section>

            @if (currentUserIsEquipe) {
                <section class="section-block">
                    <div class="section-title">
                        <div>
                            <span>Equipe dei catechisti</span>
                            <h2>Convivenze organizzate dall'equipe</h2>
                        </div>
                        <strong>{{ convivenzeOrganizzateEquipe.length }}</strong>
                    </div>
                    <div class="team-grid">
                        @for (convivenza of convivenzeOrganizzateEquipe; track convivenza.id) {
                            <article>
                                <span class="tipo-badge tipo-tappa">{{ convivenza.tipoConvivenza }}</span>
                                <h3>{{ convivenza.titolo }}</h3>
                                <dl>
                                    <div><dt>Equipe organizzatrice</dt><dd>{{ convivenza.equipeOrganizzatriceNome }}</dd></div>
                                    <div><dt>Comunità destinataria</dt><dd>{{ convivenza.comunitaDestinatariaNome }}</dd></div>
                                    <div><dt>Stato richiesta struttura</dt><dd>{{ convivenza.statoRichiestaStruttura }}</dd></div>
                                    <div><dt>Date</dt><dd>{{ convivenza.dataInizio }} - {{ convivenza.dataFine }}</dd></div>
                                    <div><dt>Struttura</dt><dd>{{ getPostoNome(convivenza) }}</dd></div>
                                </dl>
                            </article>
                        }
                    </div>
                </section>
            }
        </section>
    `,
    styles: [
        `
            .convivenze-page { display: grid; gap: 1.5rem; }
            .page-head { display: flex; justify-content: space-between; gap: 1rem; align-items: center; }
            .page-head h1 { margin: 0 0 .35rem; font-size: 2rem; }
            .page-head p { margin: 0; color: #64748b; }
            .new-convivenza-box, .filters-card, .section-block { background: #fff; border: 1px solid #e5e7eb; border-radius: 14px; box-shadow: 0 10px 26px rgba(15, 23, 42, .06); padding: 1rem; }
            .new-convivenza-box { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1rem; align-items: end; }
            .new-convivenza-box .form-intro, .new-convivenza-box footer { grid-column: 1 / -1; }
            .new-convivenza-box h2 { margin: 0 0 .25rem; font-size: 1.1rem; }
            .new-convivenza-box p { margin: 0; color: #64748b; }
            .new-convivenza-box label, .filters-card label { display: block; margin-bottom: .4rem; color: #475569; font-weight: 800; }
            .new-convivenza-box input, .new-convivenza-box p-select, .filters-card p-select { width: 100%; }
            .readonly-field { min-height: 42px; display: flex; align-items: center; padding: .55rem .75rem; border-radius: 10px; border: 1px solid #e5e7eb; background: #f8fafc; color: #334155; font-weight: 800; }
            .filters-card { max-width: 25rem; }
            .section-title { display: flex; justify-content: space-between; align-items: center; gap: 1rem; margin-bottom: 1rem; }
            .section-title span { color: #64748b; font-weight: 800; font-size: .85rem; }
            .section-title h2 { margin: .15rem 0 0; }
            .section-title strong { font-size: 1.35rem; color: #0f3558; }
            .workspace { display: grid; grid-template-columns: 22rem minmax(0, 1fr); gap: 1.25rem; }
            .list-panel, .detail-card, .map-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 14px; box-shadow: 0 10px 26px rgba(15, 23, 42, .06); }
            .list-panel { padding: .75rem; display: grid; gap: .75rem; align-content: start; }
            .convivenza-item { width: 100%; min-height: 44px; text-align: left; border: 1px solid #e5e7eb; border-radius: 12px; background: #fafafa; padding: 1rem; cursor: pointer; display: grid; gap: .45rem; }
            .convivenza-item.active { border-color: #2f867c; background: #eefaf7; }
            .item-title { font-weight: 800; color: #111827; }
            .item-meta { color: #64748b; font-size: .9rem; }
            .item-row { display: flex; align-items: center; justify-content: space-between; gap: .75rem; }
            .tipo-badge { display: inline-flex; width: fit-content; align-items: center; min-height: 1.7rem; padding: .18rem .55rem; border-radius: 999px; border: 1px solid transparent; font-size: .78rem; font-weight: 800; }
            .tipo-tappa { background: #eef2ff; color: #3730a3; border-color: #c7d2fe; }
            .tipo-ordinaria { background: #ccfbf1; color: #115e59; border-color: #99f6e4; }
            .detail-panel { display: grid; grid-template-columns: minmax(0, 1fr) 20rem; gap: 1.25rem; }
            .detail-card, .map-card { padding: 1.25rem; }
            .detail-head { display: flex; justify-content: space-between; gap: 1rem; align-items: flex-start; margin-bottom: 1rem; }
            .eyebrow { color: #64748b; font-weight: 700; font-size: .85rem; }
            .detail-head h2 { margin: .2rem 0 0; font-size: 1.5rem; }
            .detail-grid, .needs-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: .85rem; }
            .detail-grid div, .needs-grid div, .privacy-box { border: 1px solid #e5e7eb; border-radius: 12px; padding: .85rem; background: #fbfbf8; }
            .detail-grid span, .needs-grid span { display: block; color: #64748b; font-size: .82rem; }
            .detail-grid strong, .needs-grid strong { display: block; margin-top: .25rem; color: #111827; }
            .needs-box h3, .privacy-box h3 { margin: 1.25rem 0 .85rem; }
            .privacy-box p { margin: 0; color: #4b5563; line-height: 1.5; }
            .privacy-stats { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: .75rem; margin-top: .85rem; }
            .privacy-stats div { padding: .75rem; border-radius: 10px; background: #fff; border: 1px solid #e5e7eb; }
            .privacy-stats span { display: block; color: #64748b; font-size: .82rem; }
            .privacy-stats strong { display: block; margin-top: .2rem; color: #111827; font-size: 1.15rem; }
            .actions { display: flex; flex-wrap: wrap; gap: .75rem; margin-top: 1.25rem; justify-content: flex-end; }
            .map-placeholder { min-height: 100%; border: 1px dashed #9ca3af; border-radius: 12px; background: #f8fafc; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; gap: .5rem; padding: 1.5rem; color: #334155; }
            .map-placeholder .pi { font-size: 2rem; color: #2f867c; }
            .map-placeholder h3 { margin: 0; }
            .map-placeholder small { color: #64748b; }
            .team-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: .9rem; }
            .team-grid article { display: grid; gap: .75rem; padding: 1rem; border: 1px solid #e5e7eb; border-radius: 12px; background: #fbfbf8; }
            .team-grid h3 { margin: 0; color: #111827; }
            .team-grid dl { display: grid; gap: .55rem; margin: 0; }
            .team-grid dt { color: #64748b; font-size: .8rem; }
            .team-grid dd { margin: .15rem 0 0; color: #111827; font-weight: 800; }
            @media (max-width: 1024px) { .workspace, .detail-panel, .new-convivenza-box, .team-grid { grid-template-columns: 1fr; } .detail-grid, .needs-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
            @media (max-width: 767px) { .page-head, .section-title { flex-direction: column; align-items: stretch; } .page-head button, .actions button, .new-convivenza-box footer button { min-height: 44px; width: 100%; } .detail-grid, .needs-grid, .privacy-stats { grid-template-columns: 1fr; } .actions { flex-direction: column; } }
        `
    ]
})
export class Convivenze {
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly currentCommunity = getCurrentCommunity();
    readonly categorieForm: CategoriaConvivenza[] = ['Catechistica', 'Annuale', 'Comunitaria', 'Organizzativa'];
    readonly tipiCatechistici = [...TIPI_CONVIVENZA_CATECHISTICA];
    readonly tipiAnnuali = [...TIPI_CONVIVENZA_ANNUALE];
    readonly tipiConvivenza = [...TIPI_CONVIVENZA_CATECHISTICA, ...TIPI_CONVIVENZA_ANNUALE];
    readonly currentUserIsEquipe = true;
    tipoFiltro: TipoConvivenza | null = null;
    nuovaCategoria: CategoriaConvivenza = 'Catechistica';
    nuovoTipoCatechistico = this.tipiCatechistici[0];
    nuovoTipoAnnuale = this.tipiAnnuali[0];
    nuovaDataInizio = '2027-03-12';
    nuovaDataFine = '2027-03-14';
    formNuovaConvivenzaVisibile = false;

    get isDemo() {
        const url = this.router.url.split('?')[0].split('#')[0];
        return this.route.snapshot.data['demo'] === true || url === '/demo' || url.startsWith('/demo/');
    }

    get equipeOrganizzatriceNome() {
        return this.isDemo ? 'Equipe demo' : EQUIPE_CATECHISTI_PILOTA.nomeEquipe;
    }

    get comunitaDestinatariaNome() {
        return this.isDemo ? DEMO_COMUNITA.nome : `${this.currentCommunity.nomeComunita} – ${this.currentCommunity.parrocchiaNome}`;
    }

    posti: PostoSintesi[] = this.isDemo ? DEMO_POSTI.map((posto, index) => ({ id: index + 1, nome: posto.nome, citta: posto.citta, regione: posto.regione })) : [
        { id: 1, nome: 'Casa San Giuseppe', citta: 'Albano Laziale', regione: 'Lazio' },
        { id: 2, nome: 'Istituto Santa Marta', citta: 'Frascati', regione: 'Lazio' }
    ];

    convivenze: Convivenza[] = this.isDemo ? this.creaConvivenzeDemo() : this.currentCommunity.isPilot ? this.creaConvivenzePilota() : [];
    selected: Convivenza | null = this.convivenze[0] ?? null;

    get convivenzeFiltrate() {
        return this.tipoFiltro ? this.convivenze.filter((convivenza) => convivenza.tipoConvivenza === this.tipoFiltro) : this.convivenze;
    }

    get convivenzeDellaComunita() {
        return this.convivenzeFiltrate.filter((convivenza) => convivenza.comunitaDestinatariaId === 1 || convivenza.soggettoOrganizzatore === 'Comunità');
    }

    get convivenzeOrganizzateEquipe() {
        return this.convivenzeFiltrate.filter((convivenza) => convivenza.soggettoOrganizzatore === 'Equipe dei catechisti');
    }

    aggiornaDefaultTipo() {
        if (this.nuovaCategoria === 'Catechistica') {
            this.nuovoTipoCatechistico = this.tipiCatechistici[0];
        } else {
            this.nuovoTipoAnnuale = this.nuovaCategoria === 'Organizzativa' ? 'Altro' : this.tipiAnnuali[0];
        }
    }

    salvaNuovaConvivenza() {
        const isCatechistica = this.nuovaCategoria === 'Catechistica';
        const tipo = isCatechistica ? this.nuovoTipoCatechistico : this.nuovoTipoAnnuale;
        const nuova: Convivenza = {
            id: Math.max(0, ...this.convivenze.map((convivenza) => convivenza.id)) + 1,
            titolo: isCatechistica ? `Passaggio ${tipo}` : `Convivenza ${tipo}`,
            categoriaConvivenza: this.nuovaCategoria,
            tipoConvivenza: tipo,
            soggettoOrganizzatore: isCatechistica ? 'Equipe dei catechisti' : 'Comunità',
            equipeOrganizzatriceId: isCatechistica ? 1 : null,
            equipeOrganizzatriceNome: isCatechistica ? this.equipeOrganizzatriceNome : '',
            comunitaDestinatariaId: 1,
            comunitaDestinatariaNome: this.comunitaDestinatariaNome,
            strutturaId: null,
            dataInizio: this.nuovaDataInizio,
            dataFine: this.nuovaDataFine,
            stato: isCatechistica ? 'In preparazione' : 'Bozza',
            partecipantiPrevisti: 40,
            partecipantiConfermati: 0,
            luogoTestuale: 'Luogo non ancora assegnato',
            citta: 'Roma',
            note: isCatechistica ? 'Convivenza catechistica organizzata dall’equipe dei catechisti.' : 'Convivenza della comunità.',
            statoRichiestaStruttura: 'In preparazione',
            aggregati: this.aggregatiVuoti()
        };
        this.convivenze = [nuova, ...this.convivenze];
        this.selected = nuova;
        this.formNuovaConvivenzaVisibile = false;
    }

    select(convivenza: Convivenza) {
        this.selected = convivenza;
    }

    getPostoNome(convivenza: Convivenza) {
        const posto = this.posti.find((item) => item.id === convivenza.strutturaId);
        return posto ? posto.nome : 'Luogo non ancora assegnato';
    }

    getStatoSeverity(stato: StatoConvivenza) {
        switch (stato) {
            case 'Confermata':
                return 'success';
            case 'Richiesta inviata':
            case 'In preparazione':
                return 'info';
            case 'Conclusa':
                return 'secondary';
            default:
                return 'warn';
        }
    }

    getTipoClass(convivenza: Convivenza) {
        return isTipoConvivenzaCatechistica(convivenza.tipoConvivenza) ? 'tipo-tappa' : 'tipo-ordinaria';
    }

    private creaConvivenzePilota(): Convivenza[] {
        return [
            {
                ...this.baseConvivenza(1, 'Passaggio 2° Scrutinio', 'Catechistica', '2° Scrutinio', 'Equipe dei catechisti', 'In preparazione'),
                equipeOrganizzatriceId: 1,
                equipeOrganizzatriceNome: EQUIPE_CATECHISTI_PILOTA.nomeEquipe,
                strutturaId: null,
                dataInizio: '2027-03-12',
                dataFine: '2027-03-14',
                statoRichiestaStruttura: 'Non inviata',
                note: 'Convivenza catechistica ricevuta dalla comunità figlia.'
            },
            {
                ...this.baseConvivenza(2, 'Convivenza di Riporto', 'Annuale', 'Riporto', 'Comunità', 'Bozza'),
                dataInizio: '2027-10-18',
                dataFine: '2027-10-19',
                statoRichiestaStruttura: 'In preparazione'
            },
            {
                ...this.baseConvivenza(3, 'Convivenza di Pentecoste', 'Annuale', 'Pentecoste', 'Comunità', 'Richiesta inviata'),
                strutturaId: 2,
                dataInizio: '2027-05-22',
                dataFine: '2027-05-24',
                statoRichiestaStruttura: 'Inviata',
                partecipantiConfermati: 22
            },
            {
                ...this.baseConvivenza(4, 'Domenica di convivenza', 'Comunitaria', 'Domenica di convivenza', 'Comunità', 'Confermata'),
                strutturaId: 1,
                dataInizio: '2027-01-17',
                dataFine: '2027-01-17',
                partecipantiConfermati: 36,
                statoRichiestaStruttura: 'Confermata'
            }
        ];
    }

    private creaConvivenzeDemo(): Convivenza[] {
        return DEMO_CONVIVENZE.map((convivenza, index) => {
            const tipo = convivenza.tipoConvivenza as TipoConvivenza;
            const catechistica = isTipoConvivenzaCatechistica(tipo);
            return {
                ...this.baseConvivenza(index + 1, convivenza.titolo, catechistica ? 'Catechistica' : 'Annuale', tipo, catechistica ? 'Equipe dei catechisti' : 'Comunità', convivenza.stato as StatoConvivenza),
                equipeOrganizzatriceId: catechistica ? 1 : null,
                equipeOrganizzatriceNome: catechistica ? 'Equipe demo' : '',
                comunitaDestinatariaNome: DEMO_COMUNITA.nome,
                strutturaId: index < 2 ? index + 1 : null,
                dataInizio: convivenza.dataInizio,
                dataFine: convivenza.dataFine,
                luogoTestuale: convivenza.luogo,
                citta: index === 2 ? 'Da assegnare' : DEMO_POSTI[index]?.citta ?? 'Roma',
                note: 'Dato dimostrativo per la demo pubblica.',
                statoRichiestaStruttura: index === 0 ? 'Confermata' : index === 1 ? 'Inviata' : 'Non inviata',
                partecipantiPrevisti: 28 + index * 4,
                partecipantiConfermati: 18 + index * 3
            };
        });
    }

    private baseConvivenza(id: number, titolo: string, categoriaConvivenza: CategoriaConvivenza, tipoConvivenza: TipoConvivenza, soggettoOrganizzatore: SoggettoOrganizzatoreConvivenza, stato: StatoConvivenza): Convivenza {
        return {
            id,
            titolo,
            categoriaConvivenza,
            tipoConvivenza,
            soggettoOrganizzatore,
            equipeOrganizzatriceId: soggettoOrganizzatore === 'Equipe dei catechisti' ? 1 : null,
            equipeOrganizzatriceNome: soggettoOrganizzatore === 'Equipe dei catechisti' ? this.equipeOrganizzatriceNome : '',
            comunitaDestinatariaId: 1,
            comunitaDestinatariaNome: this.comunitaDestinatariaNome,
            strutturaId: null,
            dataInizio: '2027-03-12',
            dataFine: '2027-03-14',
            stato,
            partecipantiPrevisti: 42,
            partecipantiConfermati: 18,
            luogoTestuale: 'Luogo non ancora assegnato',
            citta: 'Roma',
            note: '',
            statoRichiestaStruttura: 'Non inviata',
            aggregati: { adulti: 30, bambini: 6, famiglieConBambini: 4, pastiSpeciali: 3, esigenzeAlloggio: 2, documentiRicevuti: 15, documentiRichiesti: 20, consensiMancanti: 2, consensiRaccolti: 34, consensiDaVerificare: 2, consensiNegatiRevocati: 0 }
        };
    }

    private aggregatiVuoti(): Convivenza['aggregati'] {
        return { adulti: 0, bambini: 0, famiglieConBambini: 0, pastiSpeciali: 0, esigenzeAlloggio: 0, documentiRicevuti: 0, documentiRichiesti: 0, consensiMancanti: 0, consensiRaccolti: 0, consensiDaVerificare: 0, consensiNegatiRevocati: 0 };
    }
}
