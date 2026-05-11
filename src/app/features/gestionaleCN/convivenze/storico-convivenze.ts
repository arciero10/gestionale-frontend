import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { SelectModule } from 'primeng/select';
import { getCurrentCommunity } from '../data/community-selection.storage';

type StoricoConvivenza = {
    id: string | number;
    titolo: string;
    tipoConvivenza: string;
    categoriaConvivenza: string;
    soggettoOrganizzatore: string;
    comunitaDestinatariaNome: string;
    dataInizio: string;
    dataFine: string;
    stato: string;
    luogoTestuale: string;
    note?: string;
};

@Component({
    selector: 'app-storico-convivenze',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink, ButtonModule, TagModule, SelectModule],
    template: `
        <section class="history-page">
            <header class="page-head">
                <div>
                    <span>Archivio</span>
                    <h1>Storico convivenze</h1>
                    <p>Convivenze concluse con data fine precedente a oggi.</p>
                </div>
                <a pButton routerLink="/gestionale-cn/convivenze" label="Convivenze attive" icon="pi pi-calendar" outlined></a>
            </header>

            <section class="filters-card">
                <div>
                    <label for="search">Cerca</label>
                    <input id="search" type="search" [(ngModel)]="search" placeholder="Titolo, tipo, luogo" />
                </div>
                <div>
                    <label for="categoria">Categoria</label>
                    <p-select inputId="categoria" appendTo="body" panelStyleClass="modal-dropdown-panel" [options]="categorie" [(ngModel)]="categoriaFiltro" [showClear]="true" placeholder="Tutte"></p-select>
                </div>
            </section>

            @if (storicoFiltrato.length) {
                <section class="history-grid">
                    @for (convivenza of storicoFiltrato; track convivenza.id) {
                        <article class="history-card">
                            <div>
                                <span>{{ convivenza.categoriaConvivenza }}</span>
                                <h2>{{ convivenza.titolo }}</h2>
                                <p>{{ convivenza.tipoConvivenza }} · {{ convivenza.soggettoOrganizzatore }}</p>
                            </div>
                            <dl>
                                <div>
                                    <dt>Comunità</dt>
                                    <dd>{{ convivenza.comunitaDestinatariaNome }}</dd>
                                </div>
                                <div>
                                    <dt>Periodo</dt>
                                    <dd>{{ formatDateIt(convivenza.dataInizio) }} - {{ formatDateIt(convivenza.dataFine) }}</dd>
                                </div>
                                <div>
                                    <dt>Luogo</dt>
                                    <dd>{{ convivenza.luogoTestuale }}</dd>
                                </div>
                            </dl>
                            <p-tag value="Conclusa" severity="secondary"></p-tag>
                        </article>
                    }
                </section>
            } @else {
                <section class="empty-state">
                    <h2>Nessuna convivenza nello storico</h2>
                    <p>Quando una convivenza avrà data fine precedente a oggi, comparirà automaticamente qui.</p>
                </section>
            }
        </section>
    `,
    styles: [
        `
            .history-page {
                display: grid;
                gap: 1rem;
            }

            .page-head,
            .filters-card,
            .history-card,
            .empty-state {
                border: 1px solid rgba(255, 255, 255, .48);
                border-radius: 16px;
                background: rgba(255, 255, 255, .96);
                box-shadow: 0 16px 36px rgba(15, 23, 42, .14);
                backdrop-filter: blur(10px);
            }

            .page-head,
            .filters-card,
            .history-card,
            .empty-state {
                padding: 1rem;
            }

            .page-head {
                display: flex;
                justify-content: space-between;
                gap: 1rem;
                align-items: center;
            }

            .page-head span,
            .history-card span,
            label,
            dt {
                color: #334155;
                font-size: .8rem;
                font-weight: 900;
                text-transform: uppercase;
            }

            h1,
            h2 {
                margin: .15rem 0 .3rem;
                color: #0f172a;
            }

            p,
            dd {
                margin: 0;
                color: #334155;
                line-height: 1.45;
                font-weight: 650;
            }

            .filters-card {
                display: grid;
                grid-template-columns: minmax(0, 1fr) 16rem;
                gap: .85rem;
            }

            input,
            p-select {
                width: 100%;
            }

            input {
                min-height: 42px;
                border: 1px solid #cbd5e1;
                border-radius: 10px;
                padding: .6rem .75rem;
                color: #0f172a;
                font: inherit;
                background: rgba(255, 255, 255, .98);
            }

            .history-grid {
                display: grid;
                grid-template-columns: repeat(2, minmax(0, 1fr));
                gap: .85rem;
            }

            .history-card {
                display: grid;
                gap: .85rem;
            }

            dl {
                display: grid;
                grid-template-columns: repeat(3, minmax(0, 1fr));
                gap: .65rem;
                margin: 0;
            }

            dl div {
                border-radius: 12px;
                border: 1px solid #e2e8f0;
                background: rgba(248, 250, 252, .95);
                padding: .75rem;
            }

            a[pButton] {
                min-height: 42px;
                justify-content: center;
            }

            @media (max-width: 900px) {
                .history-grid,
                .filters-card {
                    grid-template-columns: 1fr;
                }

                dl {
                    grid-template-columns: 1fr;
                }
            }

            @media (max-width: 640px) {
                .page-head {
                    flex-direction: column;
                    align-items: stretch;
                }
            }
        `
    ]
})
export class StoricoConvivenze {
    private readonly community = getCurrentCommunity();
    search = '';
    categoriaFiltro: string | null = null;
    readonly categorie = ['Catechistica', 'Annuale', 'Comunitaria'];
    readonly storico = this.loadStorico();

    get storicoFiltrato() {
        const text = this.search.trim().toLowerCase();

        return this.storico.filter((convivenza) => {
            const matchesText = !text ||
                convivenza.titolo.toLowerCase().includes(text) ||
                convivenza.tipoConvivenza.toLowerCase().includes(text) ||
                convivenza.luogoTestuale.toLowerCase().includes(text);
            const matchesCategoria = !this.categoriaFiltro || convivenza.categoriaConvivenza === this.categoriaFiltro;
            return matchesText && matchesCategoria;
        });
    }

    formatDateIt(value: string): string {
        const [year, month, day] = value.split('-');
        return year && month && day ? `${day}-${month}-${year}` : value;
    }

    private loadStorico(): StoricoConvivenza[] {
        return [...this.defaultStorico(), ...this.localStorageConvivenze()].filter((convivenza) => this.isConclusa(convivenza.dataFine));
    }

    private defaultStorico(): StoricoConvivenza[] {
        const communityName = `${this.community.nomeComunita} – ${this.community.parrocchiaNome}`;

        return [
            {
                id: 'storico-riporto-2025',
                titolo: 'Convivenza di Riporto',
                tipoConvivenza: 'Riporto',
                categoriaConvivenza: 'Annuale',
                soggettoOrganizzatore: 'Comunità',
                comunitaDestinatariaNome: communityName,
                dataInizio: '2025-10-18',
                dataFine: '2025-10-19',
                stato: 'Confermata',
                luogoTestuale: 'Casa San Giuseppe'
            },
            {
                id: 'storico-domenicale-2026',
                titolo: 'Convivenza domenicale',
                tipoConvivenza: 'Convivenza domenicale',
                categoriaConvivenza: 'Comunitaria',
                soggettoOrganizzatore: 'Comunità',
                comunitaDestinatariaNome: communityName,
                dataInizio: '2026-01-18',
                dataFine: '2026-01-18',
                stato: 'Confermata',
                luogoTestuale: 'Parrocchia'
            }
        ];
    }

    private localStorageConvivenze(): StoricoConvivenza[] {
        const items: StoricoConvivenza[] = [];

        for (let index = 0; index < localStorage.length; index += 1) {
            const key = localStorage.key(index);

            if (!key?.startsWith('bozza-convivenza-')) {
                continue;
            }

            try {
                const value = JSON.parse(localStorage.getItem(key) ?? '') as StoricoConvivenza;
                items.push(value);
            } catch {
                // Ignore invalid mock records.
            }
        }

        return items;
    }

    private isConclusa(dataFine: string): boolean {
        if (!dataFine) {
            return false;
        }

        const [year, month, day] = dataFine.split('-').map(Number);
        const endDate = new Date(year, month - 1, day, 23, 59, 59, 999);
        return endDate.getTime() < Date.now();
    }
}
