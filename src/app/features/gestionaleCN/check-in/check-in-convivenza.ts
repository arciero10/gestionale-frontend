import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { CheckInConvivenzaAccess, CheckInPartecipanteMock, formatDateIt } from '../richieste-strutture/richieste-strutture.models';
import { RichiesteStruttureService } from '../richieste-strutture/richieste-strutture.service';

type FiltroCheckIn = 'tutti' | 'atteso' | 'arrivato' | 'assente';

@Component({
    selector: 'app-check-in-convivenza',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, SelectModule, TagModule],
    template: `
        <section class="check-in-page">
            @if (!accessoValido()) {
                <article class="invalid-card">
                    <i class="pi pi-lock"></i>
                    <h1>Link check-in non valido o scaduto.</h1>
                    <p>Verifica di aver aperto il link generato alla conferma della struttura.</p>
                </article>
            } @else {
                <header class="check-in-head">
                    <div>
                        <span>Check-in convivenza</span>
                        <h1>{{ convivenzaLabel }}</h1>
                        <p>{{ strutturaLabel }} · {{ dateLabel }}</p>
                    </div>
                    <p-tag value="Check-in abilitato" severity="success" />
                </header>

                <section class="qr-card">
                    <div>
                        <strong>Link check-in</strong>
                        <span>{{ accesso()?.url }}</span>
                    </div>
                    <div>
                        <strong>QR check-in</strong>
                        <code>{{ accesso()?.qrCodeValue }}</code>
                    </div>
                    <small>QR testuale mock: campo pronto per la futura generazione QR reale.</small>
                </section>

                <section class="toolbar-card">
                    <div>
                        <label for="search">Cerca partecipante</label>
                        <input id="search" pInputText type="search" [(ngModel)]="search" placeholder="Nome partecipante" />
                    </div>
                    <div>
                        <label for="filter">Stato</label>
                        <p-select inputId="filter" [options]="filtri" optionLabel="label" optionValue="value" [(ngModel)]="filtro" appendTo="body"></p-select>
                    </div>
                </section>

                <section class="participants-card">
                    <div class="panel-title">
                        <strong>Partecipanti mock</strong>
                        <span>{{ partecipantiFiltrati.length }} visibili</span>
                    </div>

                    @if (partecipantiFiltrati.length === 0) {
                        <div class="empty-state">Nessun partecipante corrisponde ai filtri selezionati.</div>
                    } @else {
                        @for (partecipante of partecipantiFiltrati; track partecipante.id) {
                            <article class="participant-row">
                                <div>
                                    <strong>{{ partecipante.nome }}</strong>
                                    <p-tag [value]="statoLabel(partecipante.stato)" [severity]="statoSeverity(partecipante.stato)" />
                                </div>
                                <div class="row-actions">
                                    <button pButton type="button" label="Segna arrivato" icon="pi pi-check" size="small" [disabled]="partecipante.stato === 'arrivato'" (click)="aggiornaStato(partecipante.id, 'arrivato')"></button>
                                    <button pButton type="button" label="Segna assente" icon="pi pi-times" severity="secondary" outlined size="small" [disabled]="partecipante.stato === 'assente'" (click)="aggiornaStato(partecipante.id, 'assente')"></button>
                                </div>
                            </article>
                        }
                    }
                </section>
            }
        </section>
    `,
    styles: [
        `
            .check-in-page {
                display: grid;
                gap: 1rem;
                color: #0f172a;
            }

            .check-in-head,
            .qr-card,
            .toolbar-card,
            .participants-card,
            .invalid-card {
                border: 1px solid rgba(226, 232, 240, .95);
                border-radius: 18px;
                background: rgba(255, 255, 255, .96);
                box-shadow: 0 18px 46px rgba(15, 23, 42, .18);
                color: #0f172a;
            }

            .check-in-head {
                display: flex;
                align-items: flex-start;
                justify-content: space-between;
                gap: 1rem;
                padding: 1.35rem;
            }

            .check-in-head span {
                display: block;
                color: #1d4ed8;
                font-size: .78rem;
                font-weight: 900;
                letter-spacing: .06em;
                text-transform: uppercase;
            }

            .check-in-head h1,
            .check-in-head p,
            .invalid-card h1,
            .invalid-card p {
                margin: 0;
            }

            .check-in-head h1 {
                margin-top: .25rem;
                font-size: clamp(1.5rem, 3vw, 2.35rem);
                color: #0f172a;
            }

            .check-in-head p,
            .invalid-card p {
                margin-top: .35rem;
                color: #334155;
                font-weight: 700;
            }

            .qr-card {
                display: grid;
                gap: .75rem;
                padding: 1rem;
            }

            .qr-card div {
                display: grid;
                gap: .25rem;
                padding: .8rem;
                border-radius: 12px;
                background: #f8fafc;
                border: 1px solid #e2e8f0;
                overflow-wrap: anywhere;
            }

            .qr-card strong,
            .toolbar-card label {
                color: #1e293b;
                font-weight: 900;
            }

            .qr-card code {
                width: fit-content;
                max-width: 100%;
                padding: .35rem .55rem;
                border-radius: 8px;
                background: #e0f2fe;
                color: #075985;
                overflow-wrap: anywhere;
            }

            .qr-card small {
                color: #475569;
                font-weight: 700;
            }

            .toolbar-card {
                display: grid;
                grid-template-columns: minmax(0, 1fr) minmax(180px, 260px);
                gap: .85rem;
                padding: 1rem;
            }

            .toolbar-card div {
                display: grid;
                gap: .35rem;
            }

            .toolbar-card input {
                width: 100%;
            }

            .participants-card {
                display: grid;
                gap: .75rem;
                padding: 1rem;
            }

            .panel-title {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 1rem;
                color: #0f172a;
            }

            .panel-title span {
                color: #475569;
                font-weight: 800;
            }

            .participant-row {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 1rem;
                padding: .85rem;
                border-radius: 14px;
                border: 1px solid #e2e8f0;
                background: #ffffff;
            }

            .participant-row > div:first-child,
            .row-actions {
                display: flex;
                align-items: center;
                gap: .65rem;
                flex-wrap: wrap;
            }

            .participant-row strong {
                color: #0f172a;
            }

            .empty-state,
            .invalid-card {
                padding: 1rem;
                text-align: center;
            }

            .invalid-card {
                display: grid;
                justify-items: center;
                gap: .5rem;
                padding: 2rem;
            }

            .invalid-card i {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 3rem;
                height: 3rem;
                border-radius: 999px;
                background: #fee2e2;
                color: #991b1b;
                font-size: 1.25rem;
            }

            @media (max-width: 767px) {
                .check-in-head,
                .participant-row {
                    flex-direction: column;
                    align-items: stretch;
                }

                .toolbar-card {
                    grid-template-columns: 1fr;
                }

                .row-actions button {
                    width: 100%;
                    min-height: 44px;
                }
            }
        `
    ]
})
export class CheckInConvivenza {
    private readonly route = inject(ActivatedRoute);
    private readonly service = inject(RichiesteStruttureService);

    readonly convivenzaId = this.route.snapshot.paramMap.get('convivenzaId') ?? '';
    readonly token = this.route.snapshot.queryParamMap.get('token');
    readonly accesso = signal<CheckInConvivenzaAccess | null>(this.service.getCheckInAccess(this.convivenzaId, this.token));
    readonly partecipanti = signal<CheckInPartecipanteMock[]>(this.accesso() ? this.service.getPartecipantiCheckIn(this.convivenzaId) : []);
    readonly accessoValido = computed(() => Boolean(this.accesso()));
    readonly formatDateIt = formatDateIt;
    search = '';
    filtro: FiltroCheckIn = 'tutti';

    readonly filtri: { label: string; value: FiltroCheckIn }[] = [
        { label: 'Tutti', value: 'tutti' },
        { label: 'Attesi', value: 'atteso' },
        { label: 'Arrivati', value: 'arrivato' },
        { label: 'Assenti', value: 'assente' }
    ];

    get partecipantiFiltrati(): CheckInPartecipanteMock[] {
        const query = this.search.trim().toLowerCase();
        return this.partecipanti().filter((partecipante) => {
            const matchSearch = !query || partecipante.nome.toLowerCase().includes(query);
            const matchFiltro = this.filtro === 'tutti' || partecipante.stato === this.filtro;
            return matchSearch && matchFiltro;
        });
    }

    get convivenzaLabel(): string {
        return this.service.getConvivenzaLabel(Number(this.convivenzaId));
    }

    get strutturaLabel(): string {
        const richiesta = this.service.getRichieste().find((item) => item.convivenzaId === Number(this.convivenzaId) && item.checkInAccess?.token === this.token);
        return richiesta ? this.service.getStrutturaLabel(richiesta.strutturaId) : 'Struttura confermata';
    }

    get dateLabel(): string {
        const convivenza = this.service.getConvivenzaById(Number(this.convivenzaId));
        return `dal ${formatDateIt(convivenza?.dataInizio) || 'Da completare'} al ${formatDateIt(convivenza?.dataFine) || 'Da completare'}`;
    }

    aggiornaStato(partecipanteId: string, stato: CheckInPartecipanteMock['stato']): void {
        this.partecipanti.set(this.service.aggiornaStatoPartecipanteCheckIn(this.convivenzaId, partecipanteId, stato));
    }

    statoLabel(stato: CheckInPartecipanteMock['stato']): string {
        switch (stato) {
            case 'arrivato':
                return 'Arrivato';
            case 'assente':
                return 'Assente';
            default:
                return 'Atteso';
        }
    }

    statoSeverity(stato: CheckInPartecipanteMock['stato']): 'success' | 'danger' | 'info' {
        switch (stato) {
            case 'arrivato':
                return 'success';
            case 'assente':
                return 'danger';
            default:
                return 'info';
        }
    }
}
