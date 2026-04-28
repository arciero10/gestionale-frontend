import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { POSTI_CONVIVENZA_MOCK, StatoRelazione } from '../data/posti-convivenza.mock';

@Component({
    selector: 'app-posti-convivenza-mappa',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink, ButtonModule, InputTextModule, TagModule],
    template: `
        <section class="map-page">
            <header class="page-head">
                <div>
                    <h1>Mappa posti di convivenza</h1>
                    <p>La mappa con tutti i luoghi censiti sara integrata in una fase successiva.</p>
                </div>
                <a pButton routerLink="/gestionale-cn/posti-convivenza" icon="pi pi-list" label="Torna all'elenco" outlined></a>
            </header>

            <section class="map-shell">
                <div class="future-map">
                    <i class="pi pi-map"></i>
                    <h2>Vista geografica in preparazione</h2>
                    <p>Qui saranno visualizzati i pin dei posti censiti con filtro per stato relazione, capienza e servizi disponibili.</p>
                </div>
                <aside class="legend">
                    <h3>Legenda stati</h3>
                    @for (stato of statiRelazione; track stato) {
                        <div>
                            <p-tag [value]="stato" [severity]="getRelazioneSeverity(stato)" />
                            <strong>{{ countByStato(stato) }}</strong>
                        </div>
                    }
                </aside>
            </section>

            <section class="summary">
                <div class="summary-head">
                    <div>
                        <span>Posti censiti</span>
                        <strong>{{ posti.length }}</strong>
                    </div>
                    <input pInputText placeholder="Filtra riepilogo per nome, citta o regione" [(ngModel)]="filtro" />
                </div>

                <div class="summary-list">
                    @for (posto of postiFiltrati(); track posto.id) {
                        <article>
                            <div>
                                <h3>{{ posto.nome }}</h3>
                                <p>{{ posto.indirizzo || 'Indirizzo da completare' }} · {{ posto.citta }}, {{ posto.regione }}</p>
                            </div>
                            <p-tag [value]="posto.statoRelazione" [severity]="getRelazioneSeverity(posto.statoRelazione)" />
                        </article>
                    }
                </div>
            </section>
        </section>
    `,
    styles: [
        `
            .map-page { display: grid; gap: 1.5rem; }
            .page-head { display: flex; justify-content: space-between; gap: 1rem; align-items: center; }
            .page-head h1 { margin: 0 0 .35rem; font-size: 2rem; }
            .page-head p { margin: 0; color: #64748b; }
            .page-head a { min-height: 44px; }
            .map-shell { display: grid; grid-template-columns: minmax(0, 1fr) 20rem; gap: 1rem; }
            .future-map,
            .legend,
            .summary {
                background: #fff;
                border: 1px solid #e5e7eb;
                border-radius: 14px;
                box-shadow: 0 10px 26px rgba(15,23,42,.06);
            }
            .future-map {
                min-height: 24rem;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                gap: .65rem;
                padding: 2rem;
                text-align: center;
                color: #334155;
                background:
                    linear-gradient(135deg, rgba(248, 250, 252, .96), rgba(239, 246, 255, .92)),
                    repeating-linear-gradient(45deg, rgba(148, 163, 184, .12) 0 1px, transparent 1px 18px);
            }
            .future-map .pi { font-size: 2.4rem; color: #0f766e; }
            .future-map h2 { margin: 0; color: #111827; }
            .future-map p { max-width: 36rem; margin: 0; color: #64748b; }
            .legend { padding: 1rem; display: grid; gap: .75rem; align-content: start; }
            .legend h3 { margin: 0 0 .35rem; }
            .legend div { display: flex; justify-content: space-between; align-items: center; gap: 1rem; }
            .summary { padding: 1rem; }
            .summary-head { display: grid; grid-template-columns: 14rem minmax(0, 1fr); gap: 1rem; align-items: center; margin-bottom: 1rem; }
            .summary-head span { display: block; color: #64748b; font-size: .82rem; }
            .summary-head strong { display: block; color: #111827; font-size: 1.4rem; }
            .summary-list { display: grid; gap: .75rem; }
            .summary-list article { display: flex; justify-content: space-between; gap: 1rem; align-items: center; border: 1px solid #e5e7eb; border-radius: 12px; padding: .85rem; background: #fbfbf8; }
            .summary-list h3 { margin: 0 0 .25rem; font-size: 1rem; }
            .summary-list p { margin: 0; color: #64748b; }
            @media (max-width: 900px) {
                .page-head,
                .summary-list article { flex-direction: column; align-items: stretch; }
                .map-shell,
                .summary-head { grid-template-columns: 1fr; }
            }
        `
    ]
})
export class PostiConvivenzaMappa {
    readonly posti = POSTI_CONVIVENZA_MOCK;
    readonly statiRelazione: StatoRelazione[] = ['Da verificare', 'Censito internamente', 'Interessato al progetto', 'Partner attivo', 'Non disponibile'];
    filtro = '';

    countByStato(stato: StatoRelazione) {
        return this.posti.filter((posto) => posto.statoRelazione === stato).length;
    }

    postiFiltrati() {
        const filtro = this.filtro.trim().toLowerCase();
        if (!filtro) {
            return this.posti;
        }

        return this.posti.filter((posto) => `${posto.nome} ${posto.citta} ${posto.regione}`.toLowerCase().includes(filtro));
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
}
