import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import {
    StructureAccreditationResponse,
    StructureStatus,
    StruttureApiService
} from '../../strutture/strutture-api.service';

type StructureFilter = 'TUTTE' | 'IN_ATTESA' | 'APPROVATA' | 'RESPINTA';

@Component({
    selector: 'app-admin-strutture',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, SelectModule, TagModule],
    template: `
        <section class="admin-structures-page">
            <header class="page-header">
                <div>
                    <span class="eyebrow">Segreteria / Global Admin</span>
                    <h1>Strutture da approvare</h1>
                    <p>Verifica le strutture accreditate, approvale per il catalogo o respingile se i dati non sono sufficienti.</p>
                </div>
                <button pButton type="button" icon="pi pi-refresh" label="Aggiorna" [loading]="loading" (click)="loadStructures()"></button>
            </header>

            @if (message) {
                <div class="feedback" [class.error]="messageType === 'error'">{{ message }}</div>
            }

            <section class="summary-grid" aria-label="Riepilogo strutture">
                <button type="button" class="summary-card" [class.active]="filter === 'TUTTE'" (click)="setFilter('TUTTE')">
                    <span>Totale</span>
                    <strong>{{ structures.length }}</strong>
                </button>
                <button type="button" class="summary-card pending" [class.active]="filter === 'IN_ATTESA'" (click)="setFilter('IN_ATTESA')">
                    <span>In attesa</span>
                    <strong>{{ countByStatus('IN_ATTESA') }}</strong>
                </button>
                <button type="button" class="summary-card approved" [class.active]="filter === 'APPROVATA'" (click)="setFilter('APPROVATA')">
                    <span>Approvate</span>
                    <strong>{{ countByStatus('APPROVATA') }}</strong>
                </button>
                <button type="button" class="summary-card rejected" [class.active]="filter === 'RESPINTA'" (click)="setFilter('RESPINTA')">
                    <span>Respinte</span>
                    <strong>{{ countByStatus('RESPINTA') }}</strong>
                </button>
            </section>

            <section class="toolbar-panel">
                <label>
                    <span>Cerca struttura</span>
                    <input pInputText [(ngModel)]="searchText" placeholder="Nome, città, regione, referente, email" />
                </label>
                <label>
                    <span>Filtro rapido</span>
                    <p-select [options]="filterOptions" [(ngModel)]="filter" optionLabel="label" optionValue="value" appendTo="body"></p-select>
                </label>
            </section>

            <section class="structures-panel">
                <div class="panel-head">
                    <div>
                        <span class="eyebrow">Elenco operativo</span>
                        <h2>Accreditamenti strutture</h2>
                    </div>
                    <strong>{{ filteredStructures.length }} risultati</strong>
                </div>

                @if (loading) {
                    <div class="empty-state">
                        <i class="pi pi-spin pi-spinner"></i>
                        <h3>Caricamento strutture</h3>
                        <p>Sto recuperando gli accreditamenti dall'API.</p>
                    </div>
                } @else {
                    <div class="table-shell">
                        @if (filteredStructures.length) {
                            <table>
                                <thead>
                                    <tr>
                                        <th>Struttura</th>
                                        <th>Referente</th>
                                        <th>Capienza</th>
                                        <th>Status</th>
                                        <th>Data richiesta</th>
                                        <th>Azioni</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    @for (structure of filteredStructures; track structure.id) {
                                        <tr>
                                            <td>
                                                <strong>{{ structure.name || 'Nome struttura mancante' }}</strong>
                                                <span>{{ displayPlace(structure) }}</span>
                                            </td>
                                            <td>
                                                <strong>{{ structure.referentName || 'Referente da completare' }}</strong>
                                                <span>{{ structure.email || 'Email mancante' }}</span>
                                                <span>{{ structure.phone || 'Telefono mancante' }}</span>
                                            </td>
                                            <td>
                                                <strong>{{ structure.capacity || 0 }} persone</strong>
                                                <span>{{ structure.beds || 0 }} posti letto</span>
                                            </td>
                                            <td>
                                                <p-tag [value]="statusLabel(structure.status)" [severity]="statusSeverity(structure.status)"></p-tag>
                                            </td>
                                            <td>{{ formatDate(structure.createdAt) }}</td>
                                            <td>
                                                <div class="row-actions">
                                                    <button pButton type="button" label="Dettaglio" icon="pi pi-eye" size="small" outlined (click)="selectStructure(structure)"></button>
                                                    <button pButton type="button" label="Approva" icon="pi pi-check" size="small" [disabled]="structure.status === 'APPROVATA' || isActionLoading(structure)" [loading]="isActionLoading(structure)" (click)="approve(structure)"></button>
                                                    <button pButton type="button" label="Respingi" icon="pi pi-times" size="small" severity="danger" outlined [disabled]="structure.status === 'RESPINTA' || isActionLoading(structure)" (click)="openReject(structure)"></button>
                                                </div>
                                            </td>
                                        </tr>
                                    }
                                </tbody>
                            </table>
                        } @else {
                            <div class="empty-state">
                                <i class="pi pi-building"></i>
                                <h3>Nessuna struttura disponibile</h3>
                                <p>Non ci sono accreditamenti con i filtri selezionati.</p>
                            </div>
                        }
                    </div>
                }
            </section>

            @if (selectedStructure) {
                <section class="detail-panel">
                    <header>
                        <div>
                            <span class="eyebrow">Dettaglio struttura</span>
                            <h2>{{ selectedStructure.name }}</h2>
                            <p>{{ displayPlace(selectedStructure) }}</p>
                        </div>
                        <button pButton type="button" icon="pi pi-times" label="Chiudi" severity="secondary" outlined (click)="selectedStructure = null"></button>
                    </header>

                    <dl>
                        <div><dt>Tipo</dt><dd>{{ selectedStructure.type || 'Da completare' }}</dd></div>
                        <div><dt>Status</dt><dd>{{ statusLabel(selectedStructure.status) }}</dd></div>
                        <div><dt>Referente</dt><dd>{{ selectedStructure.referentName || 'Da completare' }}</dd></div>
                        <div><dt>Email</dt><dd>{{ selectedStructure.email || 'Da completare' }}</dd></div>
                        <div><dt>Telefono</dt><dd>{{ selectedStructure.phone || 'Da completare' }}</dd></div>
                        <div><dt>Indirizzo</dt><dd>{{ selectedStructure.address || 'Da completare' }}</dd></div>
                        <div><dt>Capienza</dt><dd>{{ selectedStructure.capacity || 0 }}</dd></div>
                        <div><dt>Posti letto</dt><dd>{{ selectedStructure.beds || 0 }}</dd></div>
                        <div><dt>Camere</dt><dd>{{ selectedStructure.rooms || 0 }}</dd></div>
                        <div><dt>Sale</dt><dd>{{ selectedStructure.halls || 0 }}</dd></div>
                        <div class="span-2"><dt>Descrizione</dt><dd>{{ selectedStructure.description || 'Da completare' }}</dd></div>
                        <div class="span-2"><dt>Tariffe indicative</dt><dd>{{ selectedStructure.indicativeRates || 'Da completare' }}</dd></div>
                        <div><dt>Caparra</dt><dd>{{ selectedStructure.depositConditions || 'Da completare' }}</dd></div>
                        <div><dt>Cancellazione</dt><dd>{{ selectedStructure.cancellationConditions || 'Da completare' }}</dd></div>
                    </dl>

                    <div class="service-tags">
                        @for (service of services(selectedStructure); track service) {
                            <span>{{ service }}</span>
                        }
                    </div>
                </section>
            }

            @if (rejectTarget) {
                <section class="reject-panel">
                    <header>
                        <div>
                            <span class="eyebrow">Respingi accreditamento</span>
                            <h2>{{ rejectTarget.name }}</h2>
                            <p>Il motivo è opzionale in questa fase test, ma utile alla segreteria.</p>
                        </div>
                    </header>
                    <label>
                        <span>Motivo respingimento</span>
                        <input pInputText [(ngModel)]="rejectReason" placeholder="Dati incompleti" />
                    </label>
                    <footer>
                        <button pButton type="button" label="Annulla" severity="secondary" outlined (click)="closeReject()"></button>
                        <button pButton type="button" label="Conferma respingimento" icon="pi pi-times" severity="danger" [loading]="isActionLoading(rejectTarget)" (click)="reject()"></button>
                    </footer>
                </section>
            }
        </section>
    `,
    styles: [
        `
            .admin-structures-page { display: grid; gap: 1rem; color: #0f172a; }
            .page-header, .summary-card, .toolbar-panel, .structures-panel, .detail-panel, .reject-panel {
                border: 1px solid rgba(226,232,240,.95);
                border-radius: 16px;
                background: rgba(255,255,255,.96);
                box-shadow: 0 14px 34px rgba(15,23,42,.1);
                padding: 1rem;
            }
            .page-header, .panel-head, .detail-panel header, .reject-panel header {
                display: flex;
                justify-content: space-between;
                gap: 1rem;
                align-items: flex-start;
            }
            .eyebrow {
                color: #1d4ed8;
                font-size: .76rem;
                font-weight: 900;
                letter-spacing: .04em;
                text-transform: uppercase;
            }
            h1, h2, h3 { margin: .15rem 0 .35rem; color: #0f172a; }
            h1 { font-size: clamp(1.55rem, 3vw, 2.2rem); }
            h2 { font-size: 1.15rem; }
            p, span { color: #334155; }
            .feedback {
                padding: .8rem 1rem;
                border-radius: 14px;
                color: #065f46;
                background: #d1fae5;
                border: 1px solid #a7f3d0;
                font-weight: 850;
            }
            .feedback.error { color: #991b1b; background: #fee2e2; border-color: #fecaca; }
            .summary-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: .8rem; }
            .summary-card {
                display: grid;
                gap: .25rem;
                text-align: left;
                cursor: pointer;
            }
            .summary-card span { font-size: .78rem; font-weight: 850; text-transform: uppercase; }
            .summary-card strong { font-size: 2rem; line-height: 1; color: #0f172a; }
            .summary-card.active { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,.14); }
            .summary-card.pending strong { color: #b45309; }
            .summary-card.approved strong { color: #047857; }
            .summary-card.rejected strong { color: #b91c1c; }
            .toolbar-panel { display: grid; grid-template-columns: minmax(0, 1fr) 16rem; gap: .85rem; }
            label { display: grid; gap: .35rem; color: #1e293b; font-weight: 850; }
            input, p-select { width: 100%; }
            .table-shell { overflow-x: auto; border-radius: 14px; border: 1px solid #e2e8f0; }
            table { width: 100%; border-collapse: collapse; min-width: 900px; background: #fff; }
            th, td { padding: .85rem; border-bottom: 1px solid #e2e8f0; text-align: left; vertical-align: top; }
            th { color: #334155; background: #f8fafc; font-size: .78rem; text-transform: uppercase; letter-spacing: .03em; }
            td strong { display: block; color: #0f172a; margin-bottom: .18rem; }
            td span { display: block; font-size: .88rem; line-height: 1.35; }
            .row-actions { display: flex; flex-wrap: wrap; gap: .4rem; }
            .empty-state {
                display: grid;
                place-items: center;
                gap: .35rem;
                padding: 2rem;
                text-align: center;
                color: #334155;
                background: #fff;
            }
            .empty-state i { color: #2563eb; font-size: 1.5rem; }
            dl { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .75rem; margin: 1rem 0 0; }
            dt { color: #475569; font-size: .78rem; font-weight: 850; }
            dd { margin: .1rem 0 0; color: #0f172a; font-weight: 800; overflow-wrap: anywhere; }
            .span-2 { grid-column: span 2; }
            .service-tags { display: flex; flex-wrap: wrap; gap: .45rem; margin-top: 1rem; }
            .service-tags span { padding: .35rem .6rem; border-radius: 999px; color: #1e40af; background: #eff6ff; font-size: .8rem; font-weight: 850; }
            .reject-panel { max-width: 760px; }
            .reject-panel footer { display: flex; justify-content: flex-end; gap: .6rem; margin-top: .85rem; }
            @media (max-width: 980px) {
                .summary-grid, .toolbar-panel, dl { grid-template-columns: 1fr 1fr; }
            }
            @media (max-width: 720px) {
                .page-header, .panel-head, .detail-panel header, .reject-panel header { flex-direction: column; align-items: stretch; }
                .summary-grid, .toolbar-panel, dl { grid-template-columns: 1fr; }
                .span-2 { grid-column: span 1; }
                .row-actions button, .reject-panel footer button { width: 100%; }
            }
        `
    ]
})
export class AdminStrutture implements OnInit {
    private readonly struttureApi = inject(StruttureApiService);

    readonly filterOptions: { label: string; value: StructureFilter }[] = [
        { label: 'Tutte', value: 'TUTTE' },
        { label: 'In attesa', value: 'IN_ATTESA' },
        { label: 'Approvate', value: 'APPROVATA' },
        { label: 'Respinte', value: 'RESPINTA' }
    ];

    structures: StructureAccreditationResponse[] = [];
    filter: StructureFilter = 'TUTTE';
    searchText = '';
    loading = false;
    message = '';
    messageType: 'success' | 'error' = 'success';
    selectedStructure: StructureAccreditationResponse | null = null;
    rejectTarget: StructureAccreditationResponse | null = null;
    rejectReason = 'Dati incompleti';
    actionLoadingId: number | null = null;

    ngOnInit(): void {
        this.loadStructures();
    }

    get filteredStructures(): StructureAccreditationResponse[] {
        const text = this.searchText.trim().toLowerCase();
        return this.structures.filter((structure) => {
            const matchStatus = this.filter === 'TUTTE' || structure.status === this.filter;
            const haystack = `${structure.name} ${structure.city} ${structure.region} ${structure.referentName} ${structure.email} ${structure.phone}`.toLowerCase();
            return matchStatus && (!text || haystack.includes(text));
        });
    }

    loadStructures(): void {
        this.loading = true;
        this.struttureApi.getAdminStructures().subscribe({
            next: (structures) => {
                this.structures = [...structures].sort((a, b) => this.toTime(b.createdAt) - this.toTime(a.createdAt));
                this.loading = false;
                this.clearInvalidSelection();
            },
            error: () => {
                this.loading = false;
                this.showMessage("Non riesco a caricare le strutture dall'API. Riprova tra poco.", 'error');
            }
        });
    }

    setFilter(filter: StructureFilter): void {
        this.filter = filter;
    }

    countByStatus(status: StructureStatus): number {
        return this.structures.filter((structure) => structure.status === status).length;
    }

    selectStructure(structure: StructureAccreditationResponse): void {
        this.selectedStructure = structure;
        this.rejectTarget = null;
    }

    approve(structure: StructureAccreditationResponse): void {
        this.actionLoadingId = structure.id;
        this.struttureApi.approveStructure(structure.id).subscribe({
            next: (updated) => {
                this.replaceStructure(updated);
                this.actionLoadingId = null;
                this.showMessage('Struttura approvata correttamente', 'success');
            },
            error: () => {
                this.actionLoadingId = null;
                this.showMessage('Approvazione non riuscita. Riprova.', 'error');
            }
        });
    }

    openReject(structure: StructureAccreditationResponse): void {
        this.rejectTarget = structure;
        this.selectedStructure = structure;
        this.rejectReason = structure.rejectionReason || 'Dati incompleti';
    }

    closeReject(): void {
        this.rejectTarget = null;
        this.rejectReason = 'Dati incompleti';
    }

    reject(): void {
        if (!this.rejectTarget) {
            return;
        }

        this.actionLoadingId = this.rejectTarget.id;
        this.struttureApi.rejectStructure(this.rejectTarget.id, this.rejectReason).subscribe({
            next: (updated) => {
                this.replaceStructure(updated);
                this.actionLoadingId = null;
                this.closeReject();
                this.showMessage('Struttura respinta', 'success');
            },
            error: () => {
                this.actionLoadingId = null;
                this.showMessage('Respinta non riuscita. Riprova.', 'error');
            }
        });
    }

    isActionLoading(structure: StructureAccreditationResponse): boolean {
        return this.actionLoadingId === structure.id;
    }

    displayPlace(structure: StructureAccreditationResponse): string {
        const parts = [structure.city, structure.region].filter(Boolean);
        return parts.length ? parts.join(' / ') : 'Località da completare';
    }

    statusLabel(status: StructureStatus): string {
        const labels: Record<StructureStatus, string> = {
            IN_ATTESA: 'In attesa',
            APPROVATA: 'Approvata',
            RESPINTA: 'Respinta',
            SOSPESA: 'Sospesa'
        };
        return labels[status] ?? status;
    }

    statusSeverity(status: StructureStatus): 'success' | 'secondary' | 'warn' | 'danger' {
        const severities: Record<StructureStatus, 'success' | 'secondary' | 'warn' | 'danger'> = {
            IN_ATTESA: 'warn',
            APPROVATA: 'success',
            RESPINTA: 'danger',
            SOSPESA: 'secondary'
        };
        return severities[status] ?? 'secondary';
    }

    formatDate(value?: string | null): string {
        if (!value) {
            return 'Da completare';
        }

        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('it-IT').format(date);
    }

    services(structure: StructureAccreditationResponse): string[] {
        const services = [
            structure.hasChapel ? 'Cappella' : '',
            structure.hasCanteen ? 'Mensa' : '',
            structure.hasInternalKitchen ? 'Cucina interna' : '',
            structure.hasParking ? 'Parcheggio' : '',
            structure.hasDisabledAccess ? 'Accessibilità disabili' : '',
            structure.hasOutdoorSpaces ? 'Spazi esterni' : '',
            structure.acceptsFamiliesWithChildren ? 'Famiglie con bambini' : ''
        ].filter(Boolean);

        return services.length ? services : ['Servizi da completare'];
    }

    private replaceStructure(updated: StructureAccreditationResponse): void {
        this.structures = this.structures.map((structure) => structure.id === updated.id ? updated : structure);
        if (this.selectedStructure?.id === updated.id) {
            this.selectedStructure = updated;
        }
    }

    private clearInvalidSelection(): void {
        if (this.selectedStructure && !this.structures.some((structure) => structure.id === this.selectedStructure?.id)) {
            this.selectedStructure = null;
        }
    }

    private showMessage(message: string, type: 'success' | 'error'): void {
        this.message = message;
        this.messageType = type;
        window.setTimeout(() => {
            if (this.message === message) {
                this.message = '';
            }
        }, 4000);
    }

    private toTime(value?: string | null): number {
        if (!value) {
            return 0;
        }

        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? 0 : date.getTime();
    }
}
