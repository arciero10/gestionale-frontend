import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DEMO_COMUNITA, DEMO_CONVIVENZE, DEMO_POSTI } from '../../demo/demo.mock';

type StatoConvivenza = 'Bozza' | 'Richiesta inviata' | 'Confermata' | 'Conclusa';
type StatoRichiestaStruttura = 'Non inviata' | 'In preparazione' | 'Inviata' | 'Confermata' | 'Rifiutata';

interface Convivenza {
    id: number;
    titolo: string;
    dataInizio: string;
    dataFine: string;
    stato: StatoConvivenza;
    comunita: string;
    partecipantiPrevisti: number;
    partecipantiConfermati: number;
    postoId: number | null;
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
    imports: [CommonModule, ButtonModule, TagModule],
    template: `
        <section class="convivenze-page">
            <header class="page-head">
                <div>
                    <h1>Convivenze</h1>
                    <p>Recap, dettaglio, partecipazioni aggregate e richieste alle strutture.</p>
                </div>
                <button pButton type="button" icon="pi pi-plus" label="Nuova convivenza"></button>
            </header>

            <div class="workspace">
                <aside class="list-panel">
                    @for (convivenza of convivenze; track convivenza.id) {
                        <button type="button" class="convivenza-item" [class.active]="convivenza.id === selected.id" (click)="select(convivenza)">
                            <span class="item-title">{{ convivenza.titolo }}</span>
                            <span class="item-meta">{{ convivenza.dataInizio }} - {{ convivenza.dataFine }}</span>
                            <span class="item-meta">{{ getPostoNome(convivenza) }}</span>
                            <span class="item-row">
                                <p-tag [value]="convivenza.stato" [severity]="getStatoSeverity(convivenza.stato)" />
                                <strong>{{ convivenza.partecipantiConfermati }}/{{ convivenza.partecipantiPrevisti }}</strong>
                            </span>
                        </button>
                    }
                </aside>

                <main class="detail-panel">
                    <div class="detail-card">
                        <div class="detail-head">
                            <div>
                                <span class="eyebrow">{{ selected.comunita }}</span>
                                <h2>{{ selected.titolo }}</h2>
                            </div>
                            <p-tag [value]="selected.stato" [severity]="getStatoSeverity(selected.stato)" />
                        </div>

                        <div class="detail-grid">
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
            </div>
        </section>
    `,
    styles: [
        `
            .convivenze-page { display: grid; gap: 1.5rem; }
            .page-head { display: flex; justify-content: space-between; gap: 1rem; align-items: center; }
            .page-head h1 { margin: 0 0 .35rem; font-size: 2rem; }
            .page-head p { margin: 0; color: #64748b; }
            .workspace { display: grid; grid-template-columns: 22rem minmax(0, 1fr); gap: 1.25rem; }
            .list-panel, .detail-card, .map-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 14px; box-shadow: 0 10px 26px rgba(15, 23, 42, .06); }
            .list-panel { padding: .75rem; display: grid; gap: .75rem; align-content: start; }
            .convivenza-item { width: 100%; min-height: 44px; text-align: left; border: 1px solid #e5e7eb; border-radius: 12px; background: #fafafa; padding: 1rem; cursor: pointer; display: grid; gap: .45rem; }
            .convivenza-item.active { border-color: #2f867c; background: #eefaf7; }
            .item-title { font-weight: 800; color: #111827; }
            .item-meta { color: #64748b; font-size: .9rem; }
            .item-row { display: flex; align-items: center; justify-content: space-between; gap: .75rem; }
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
            @media (max-width: 1024px) { .workspace, .detail-panel { grid-template-columns: 1fr; } .detail-grid, .needs-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
            @media (max-width: 767px) { .page-head { flex-direction: column; align-items: stretch; } .page-head button, .actions button { min-height: 44px; } .detail-grid, .needs-grid, .privacy-stats { grid-template-columns: 1fr; } .actions { flex-direction: column; } }
        `
    ]
})
export class Convivenze {
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);

    get isDemo() {
        const url = this.router.url.split('?')[0].split('#')[0];
        return this.route.snapshot.data['demo'] === true || url === '/demo' || url.startsWith('/demo/');
    }

    posti: PostoSintesi[] = this.isDemo ? DEMO_POSTI.map((posto, index) => ({ id: index + 1, nome: posto.nome, citta: posto.citta, regione: posto.regione })) : [
        { id: 1, nome: 'Casa San Giuseppe', citta: 'Albano Laziale', regione: 'Lazio' },
        { id: 2, nome: 'Istituto Santa Marta', citta: 'Frascati', regione: 'Lazio' }
    ];

    convivenze: Convivenza[] = this.isDemo ? this.creaConvivenzeDemo() : [
        {
            id: 1,
            titolo: 'Convivenza Avvento',
            dataInizio: '2026-12-05',
            dataFine: '2026-12-08',
            stato: 'Confermata',
            comunita: '3ª Comunità',
            partecipantiPrevisti: 42,
            partecipantiConfermati: 36,
            postoId: 1,
            luogoTestuale: 'Casa San Giuseppe',
            citta: 'Albano Laziale',
            note: 'Preparare richiesta pasti entro novembre.',
            statoRichiestaStruttura: 'Confermata',
            aggregati: { adulti: 30, bambini: 6, famiglieConBambini: 4, pastiSpeciali: 3, esigenzeAlloggio: 2, documentiRicevuti: 15, documentiRichiesti: 20, consensiMancanti: 2, consensiRaccolti: 34, consensiDaVerificare: 2, consensiNegatiRevocati: 0 }
        },
        {
            id: 2,
            titolo: 'Convivenza Quaresima',
            dataInizio: '2027-03-12',
            dataFine: '2027-03-14',
            stato: 'Bozza',
            comunita: '3ª Comunità',
            partecipantiPrevisti: 40,
            partecipantiConfermati: 18,
            postoId: null,
            luogoTestuale: 'Luogo non ancora assegnato',
            citta: 'Roma',
            note: 'Verificare disponibilità strutture zona Lazio.',
            statoRichiestaStruttura: 'Non inviata',
            aggregati: { adulti: 16, bambini: 2, famiglieConBambini: 1, pastiSpeciali: 1, esigenzeAlloggio: 1, documentiRicevuti: 4, documentiRichiesti: 18, consensiMancanti: 5, consensiRaccolti: 12, consensiDaVerificare: 5, consensiNegatiRevocati: 1 }
        }
    ];

    selected = this.convivenze[0];

    private creaConvivenzeDemo(): Convivenza[] {
        return DEMO_CONVIVENZE.map((convivenza, index) => ({
            id: index + 1,
            titolo: convivenza.titolo,
            dataInizio: convivenza.dataInizio,
            dataFine: convivenza.dataFine,
            stato: convivenza.stato as StatoConvivenza,
            comunita: DEMO_COMUNITA.nome,
            partecipantiPrevisti: 28 + index * 4,
            partecipantiConfermati: 18 + index * 3,
            postoId: index < 2 ? index + 1 : null,
            luogoTestuale: convivenza.luogo,
            citta: index === 2 ? 'Da assegnare' : DEMO_POSTI[index]?.citta ?? 'Roma',
            note: 'Dato dimostrativo per la demo pubblica.',
            statoRichiestaStruttura: index === 0 ? 'Confermata' : index === 1 ? 'Inviata' : 'Non inviata',
            aggregati: {
                adulti: 18 + index * 3,
                bambini: 4 + index,
                famiglieConBambini: 2 + index,
                pastiSpeciali: index + 1,
                esigenzeAlloggio: index,
                documentiRicevuti: 10 + index * 2,
                documentiRichiesti: 16 + index * 3,
                consensiMancanti: index + 1,
                consensiRaccolti: 14 + index * 2,
                consensiDaVerificare: index + 1,
                consensiNegatiRevocati: index === 2 ? 1 : 0
            }
        }));
    }

    select(convivenza: Convivenza) {
        this.selected = convivenza;
    }

    getPostoNome(convivenza: Convivenza) {
        const posto = this.posti.find((item) => item.id === convivenza.postoId);
        return posto ? posto.nome : 'Luogo non ancora assegnato';
    }

    getStatoSeverity(stato: StatoConvivenza) {
        switch (stato) {
            case 'Confermata':
                return 'success';
            case 'Richiesta inviata':
                return 'info';
            case 'Conclusa':
                return 'secondary';
            default:
                return 'warn';
        }
    }
}
