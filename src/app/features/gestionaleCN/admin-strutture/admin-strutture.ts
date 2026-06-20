import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import {
    CensimentoStrutturaMock,
    SAN_GAETANO_CENSIMENTO_LINK,
    SAN_GAETANO_CENSIMENTO_STORAGE_KEY,
    StrutturaSegnalataMock,
    readStruttureSegnalate,
    writeStruttureSegnalate
} from '../../strutture/strutture-censimento.mock';
import { ProfileStatus, readProfileStatus, readStrutturaProfile, saveStrutturaProfile, StrutturaProfileMock } from '../../strutture/struttura-profile.storage';

type StatoAdminStruttura = 'IN_ATTESA' | 'APPROVATA' | 'RIFIUTATA' | 'SOSPESA';

type AdminStrutturaItem = {
    id: string;
    nome: string;
    referente: string;
    citta: string;
    stato: StatoAdminStruttura;
    origine: 'Accreditamento struttura' | 'Censimento struttura' | 'Segnalazione comunità';
    data: string;
    dettaglio: string;
};

@Component({
    selector: 'app-admin-strutture',
    standalone: true,
    imports: [CommonModule, ButtonModule, TagModule],
    template: `
        <section class="admin-structures-page">
            <header class="page-head">
                <div>
                    <span>Admin piattaforma</span>
                    <h1>Gestione strutture Global Admin</h1>
                    <p>Controllo completo di accreditamenti, censimenti, sospensioni e pubblicazione delle strutture.</p>
                </div>
            </header>

            <section class="panel">
                <div class="section-title">
                    <div>
                        <span>Stati strutture</span>
                        <h2>Strutture amministrabili</h2>
                    </div>
                    <strong>{{ struttureAdmin.length }}</strong>
                </div>

                <div class="status-grid">
                    @for (stato of statiAdmin; track stato) {
                        <article class="status-card">
                            <span>{{ statoLabel(stato) }}</span>
                            <strong>{{ countByStatus(stato) }}</strong>
                        </article>
                    }
                </div>

                <div class="cards-grid admin-list">
                    @for (struttura of struttureAdmin; track struttura.id) {
                        <article>
                            <header>
                                <div>
                                    <h3>{{ struttura.nome }}</h3>
                                    <p>{{ struttura.citta || 'Città da completare' }} · {{ struttura.origine }}</p>
                                </div>
                                <p-tag [value]="statoLabel(struttura.stato)" [severity]="statusSeverity(struttura.stato)"></p-tag>
                            </header>
                            <dl>
                                <div><dt>Referente</dt><dd>{{ displayValue(struttura.referente) }}</dd></div>
                                <div><dt>Data</dt><dd>{{ formatDate(struttura.data) }}</dd></div>
                                <div class="span-2"><dt>Dettaglio</dt><dd>{{ struttura.dettaglio }}</dd></div>
                            </dl>
                            <footer>
                                <button pButton type="button" label="Approva" icon="pi pi-check" [disabled]="struttura.stato === 'APPROVATA'" (click)="approvaStruttura(struttura)"></button>
                                <button pButton type="button" label="Rifiuta" icon="pi pi-times" severity="danger" outlined [disabled]="struttura.stato === 'RIFIUTATA'" (click)="rifiutaStruttura(struttura)"></button>
                                <button pButton type="button" label="Sospendi" icon="pi pi-ban" severity="warn" outlined [disabled]="struttura.stato === 'SOSPESA'" (click)="sospendiStruttura(struttura)"></button>
                                <button pButton type="button" label="Riattiva" icon="pi pi-refresh" severity="secondary" outlined [disabled]="struttura.stato !== 'SOSPESA'" (click)="riattivaStruttura(struttura)"></button>
                                <button pButton type="button" label="Modifica" icon="pi pi-pencil" severity="secondary" outlined (click)="selezionaStruttura(struttura, 'modifica')"></button>
                                <button pButton type="button" label="Vedi dettaglio" icon="pi pi-eye" outlined (click)="selezionaStruttura(struttura, 'dettaglio')"></button>
                            </footer>
                        </article>
                    } @empty {
                        <div class="empty-state">Nessuna struttura da amministrare in localStorage/mock.</div>
                    }
                </div>

                @if (selectedAdminStruttura) {
                    <div class="mock-link detail-box">
                        <span>{{ selectedMode === 'modifica' ? 'Modifica mock' : 'Dettaglio struttura' }}</span>
                        <strong>{{ selectedAdminStruttura.nome }}</strong>
                        <p>{{ selectedAdminStruttura.dettaglio }}</p>
                    </div>
                }
            </section>

            <section class="panel">
                <div class="section-title">
                    <div>
                        <span>Workflow admin</span>
                        <h2>Segnalazioni ricevute</h2>
                    </div>
                    <strong>{{ segnalazioni.length }}</strong>
                </div>

                <div class="cards-grid">
                    @for (struttura of segnalazioni; track struttura.id) {
                        <article>
                            <header>
                                <div>
                                    <h3>{{ struttura.nomeStruttura }}</h3>
                                    <p>{{ struttura.indirizzo || 'Indirizzo da completare' }} · {{ struttura.citta || 'Città da completare' }}</p>
                                </div>
                                <p-tag [value]="struttura.stato" severity="info"></p-tag>
                            </header>
                            <dl>
                                <div><dt>Proposta da</dt><dd>{{ struttura.propostaDa }}</dd></div>
                                <div><dt>Comunità</dt><dd>{{ struttura.comunita }}</dd></div>
                                <div><dt>Referente</dt><dd>{{ displayValue(struttura.referente) }}</dd></div>
                                <div><dt>Telefono/email</dt><dd>{{ displayValue(struttura.telefono || struttura.email) }}</dd></div>
                                <div><dt>Origine</dt><dd>{{ struttura.origine }}</dd></div>
                                <div><dt>Token</dt><dd>{{ displayValue(struttura.tokenCensimento) }}</dd></div>
                            </dl>
                            @if (struttura.tokenCensimento) {
                                <div class="mock-link">
                                    <span>Link censimento</span>
                                    <code>{{ linkCensimento(struttura) }}</code>
                                </div>
                            }
                            <footer>
                                <button pButton type="button" label="Prepara invito censimento" icon="pi pi-envelope" outlined (click)="preparaInvito(struttura)"></button>
                                <button pButton type="button" label="Segna invito inviato" icon="pi pi-send" [disabled]="!struttura.tokenCensimento" (click)="segnaInvitoInviato(struttura)"></button>
                                <button pButton type="button" label="Scarta segnalazione" icon="pi pi-times" severity="danger" outlined (click)="scartaSegnalazione(struttura)"></button>
                            </footer>
                        </article>
                    } @empty {
                        <div class="empty-state">Nessuna segnalazione ricevuta.</div>
                    }
                </div>
            </section>

            <section class="panel">
                <div class="section-title">
                    <div>
                        <span>Verifica admin</span>
                        <h2>Censimenti ricevuti</h2>
                    </div>
                    <strong>{{ censimentoSanGaetano ? 1 : 0 }}</strong>
                </div>

                @if (censimentoSanGaetano) {
                    <article class="census-card">
                        <header>
                            <div>
                                <h3>{{ censimentoSanGaetano.nomeStruttura }}</h3>
                                <p>{{ censimentoSanGaetano.indirizzo }} · {{ censimentoSanGaetano.citta }}</p>
                            </div>
                            <div class="tag-stack">
                                <p-tag [value]="censimentoSanGaetano.statoVerifica" [severity]="censimentoSanGaetano.pubblicata ? 'success' : 'warn'"></p-tag>
                                <p-tag [value]="censimentoSanGaetano.pubblicata ? 'Pubblicata' : 'Non pubblicata'" [severity]="censimentoSanGaetano.pubblicata ? 'success' : 'secondary'"></p-tag>
                            </div>
                        </header>
                        <dl>
                            <div><dt>Referente</dt><dd>{{ displayValue(censimentoSanGaetano.referente) }}</dd></div>
                            <div><dt>Telefono</dt><dd>{{ displayValue(censimentoSanGaetano.telefono) }}</dd></div>
                            <div><dt>Email</dt><dd>{{ displayValue(censimentoSanGaetano.email) }}</dd></div>
                            <div><dt>Posti letto</dt><dd>{{ censimentoSanGaetano.capienzaPostiLetto ?? 'Da completare' }}</dd></div>
                            <div><dt>Data censimento</dt><dd>{{ formatDate(censimentoSanGaetano.dataInvio) }}</dd></div>
                            <div><dt>Stato disponibilità</dt><dd>{{ censimentoSanGaetano.statoDisponibilita }}</dd></div>
                        </dl>
                        <footer>
                            <button pButton type="button" label="Pubblica struttura" icon="pi pi-check" (click)="pubblicaCensimento()"></button>
                            <button pButton type="button" label="Sospendi" icon="pi pi-ban" severity="warn" outlined (click)="sospendiCensimento()"></button>
                            <button pButton type="button" label="Richiedi modifiche" icon="pi pi-pencil" severity="secondary" outlined (click)="richiediModifiche()"></button>
                        </footer>
                    </article>
                } @else {
                    <div class="empty-state">Nessun censimento struttura ricevuto.</div>
                }
            </section>
        </section>
    `,
    styles: [
        `
            .admin-structures-page { display: grid; gap: 1.25rem; }
            .page-head,
            .panel,
            .cards-grid article,
            .census-card {
                border: 1px solid rgba(255,255,255,.35);
                border-radius: 16px;
                background: rgba(255,255,255,.84);
                box-shadow: 0 16px 40px rgba(15,23,42,.14);
                backdrop-filter: blur(10px);
            }
            .page-head,
            .panel { padding: 1.15rem; }
            .page-head span,
            .section-title span { color: #64748b; font-size: .82rem; font-weight: 850; text-transform: uppercase; }
            h1,
            h2,
            h3 { margin: .2rem 0 .35rem; color: #111827; }
            p { margin: 0; color: #64748b; }
            .section-title { display: flex; justify-content: space-between; gap: 1rem; align-items: center; margin-bottom: 1rem; }
            .section-title strong { color: #0f3558; font-size: 1.35rem; }
            .cards-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .9rem; }
            .cards-grid article,
            .census-card { display: grid; gap: .9rem; padding: 1rem; background: rgba(255,255,255,.9); }
            article header { display: flex; justify-content: space-between; gap: 1rem; align-items: flex-start; }
            dl { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .65rem; margin: 0; }
            dt { color: #64748b; font-size: .8rem; }
            dd { margin: .15rem 0 0; color: #111827; font-weight: 800; overflow-wrap: anywhere; }
            .span-2 { grid-column: span 2; }
            footer { display: flex; flex-wrap: wrap; gap: .6rem; justify-content: flex-end; }
            .status-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: .75rem; margin-bottom: .9rem; }
            .status-card {
                display: grid;
                gap: .25rem;
                padding: .9rem;
                border: 1px solid #e2e8f0;
                border-radius: 14px;
                background: rgba(255,255,255,.96);
            }
            .status-card span { color: #475569; font-size: .8rem; font-weight: 850; text-transform: uppercase; }
            .status-card strong { color: #0f172a; font-size: 1.55rem; }
            .detail-box strong { color: #0f172a; }
            .detail-box p { color: #334155; }
            .mock-link {
                display: grid;
                gap: .25rem;
                padding: .75rem;
                border: 1px solid #bfdbfe;
                border-radius: 12px;
                background: #eff6ff;
            }
            .mock-link span { color: #1e40af; font-size: .8rem; font-weight: 850; }
            code { color: #111827; font-weight: 850; white-space: normal; overflow-wrap: anywhere; }
            .tag-stack { display: flex; flex-wrap: wrap; gap: .4rem; justify-content: flex-end; }
            .empty-state { padding: 1rem; border: 1px dashed #cbd5e1; border-radius: 12px; color: #64748b; text-align: center; }
            @media (max-width: 900px) {
                .cards-grid,
                .status-grid,
                dl { grid-template-columns: 1fr; }
                .span-2 { grid-column: span 1; }
                article header,
                .section-title { flex-direction: column; align-items: stretch; }
                footer button { width: 100%; }
            }
        `
    ]
})
export class AdminStrutture {
    segnalazioni = readStruttureSegnalate().filter((item) => item.stato !== 'Scartata');
    censimentoSanGaetano = this.readCensimentoSanGaetano();
    strutturaProfile = readStrutturaProfile();
    strutturaProfileStatus = readProfileStatus();
    selectedAdminStruttura: AdminStrutturaItem | null = null;
    selectedMode: 'modifica' | 'dettaglio' = 'dettaglio';
    readonly statiAdmin: StatoAdminStruttura[] = ['IN_ATTESA', 'APPROVATA', 'RIFIUTATA', 'SOSPESA'];

    get struttureAdmin(): AdminStrutturaItem[] {
        const items: AdminStrutturaItem[] = [];

        if (this.strutturaProfile) {
            items.push(this.toAdminItemFromProfile(this.strutturaProfile, this.strutturaProfileStatus));
        }

        if (this.censimentoSanGaetano) {
            items.push(this.toAdminItemFromCensimento(this.censimentoSanGaetano));
        }

        items.push(...readStruttureSegnalate().map((item) => this.toAdminItemFromSegnalazione(item)));

        return items;
    }

    preparaInvito(struttura: StrutturaSegnalataMock) {
        this.updateSegnalazione(struttura.id, {
            stato: 'Invito preparato',
            tokenCensimento: struttura.tokenCensimento || 'SG-2026-000001'
        });
    }

    segnaInvitoInviato(struttura: StrutturaSegnalataMock) {
        this.updateSegnalazione(struttura.id, {
            stato: 'Invito censimento inviato',
            invitoInviato: true,
            tokenCensimento: struttura.tokenCensimento || 'SG-2026-000001',
            dataInvito: new Date().toISOString()
        });
    }

    scartaSegnalazione(struttura: StrutturaSegnalataMock) {
        this.updateSegnalazione(struttura.id, {
            stato: 'Scartata',
            pubblicata: false,
            invitoInviato: false
        });
        this.segnalazioni = this.segnalazioni.filter((item) => item.id !== struttura.id);
    }

    pubblicaCensimento() {
        if (!this.censimentoSanGaetano) {
            return;
        }

        const aggiornata: CensimentoStrutturaMock = {
            ...this.censimentoSanGaetano,
            statoVerifica: 'Verificata',
            statoDisponibilita: 'Disponibile',
            pubblicata: true
        };

        // Fase futura API: PATCH /api/admin/strutture/{id}/pubblicazione con audit dell'admin piattaforma.
        localStorage.setItem(SAN_GAETANO_CENSIMENTO_STORAGE_KEY, JSON.stringify(aggiornata));
        this.censimentoSanGaetano = aggiornata;
        this.syncSegnalazioneDaCensimento(aggiornata);
    }

    sospendiCensimento() {
        if (!this.censimentoSanGaetano) {
            return;
        }

        const aggiornata: CensimentoStrutturaMock = {
            ...this.censimentoSanGaetano,
            statoVerifica: 'Sospesa',
            statoDisponibilita: 'Non disponibile',
            pubblicata: false
        };
        localStorage.setItem(SAN_GAETANO_CENSIMENTO_STORAGE_KEY, JSON.stringify(aggiornata));
        this.censimentoSanGaetano = aggiornata;
    }

    richiediModifiche() {
        if (!this.censimentoSanGaetano) {
            return;
        }

        const aggiornata: CensimentoStrutturaMock = {
            ...this.censimentoSanGaetano,
            statoVerifica: 'Da verificare',
            statoDisponibilita: 'Da verificare',
            pubblicata: false
        };
        localStorage.setItem(SAN_GAETANO_CENSIMENTO_STORAGE_KEY, JSON.stringify(aggiornata));
        this.censimentoSanGaetano = aggiornata;
    }

    approvaStruttura(struttura: AdminStrutturaItem) {
        this.updateAdminStruttura(struttura, 'APPROVATA');
    }

    rifiutaStruttura(struttura: AdminStrutturaItem) {
        this.updateAdminStruttura(struttura, 'RIFIUTATA');
    }

    sospendiStruttura(struttura: AdminStrutturaItem) {
        this.updateAdminStruttura(struttura, 'SOSPESA');
    }

    riattivaStruttura(struttura: AdminStrutturaItem) {
        this.updateAdminStruttura(struttura, 'APPROVATA');
    }

    selezionaStruttura(struttura: AdminStrutturaItem, mode: 'modifica' | 'dettaglio') {
        this.selectedAdminStruttura = struttura;
        this.selectedMode = mode;
    }

    countByStatus(stato: StatoAdminStruttura) {
        return this.struttureAdmin.filter((item) => item.stato === stato).length;
    }

    statoLabel(stato: StatoAdminStruttura) {
        const labels: Record<StatoAdminStruttura, string> = {
            IN_ATTESA: 'In attesa',
            APPROVATA: 'Approvata',
            RIFIUTATA: 'Respinta',
            SOSPESA: 'Sospesa'
        };
        return labels[stato];
    }

    statusSeverity(stato: StatoAdminStruttura): 'success' | 'secondary' | 'warn' | 'danger' {
        const severities: Record<StatoAdminStruttura, 'success' | 'secondary' | 'warn' | 'danger'> = {
            IN_ATTESA: 'warn',
            APPROVATA: 'success',
            RIFIUTATA: 'danger',
            SOSPESA: 'secondary'
        };
        return severities[stato];
    }

    linkCensimento(struttura: StrutturaSegnalataMock) {
        return `/strutture/censimento?token=${struttura.tokenCensimento || 'SG-2026-000001'}`;
    }

    displayValue(value: string | null | undefined) {
        return value && value.trim() ? value : 'Da completare';
    }

    formatDate(value: string) {
        if (!value) {
            return 'Da completare';
        }

        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
            return value;
        }

        return new Intl.DateTimeFormat('it-IT').format(date);
    }

    private updateSegnalazione(id: string, patch: Partial<StrutturaSegnalataMock>) {
        const all = readStruttureSegnalate();
        const updated = all.map((item) => (item.id === id ? { ...item, ...patch } : item));
        writeStruttureSegnalate(updated);
        this.segnalazioni = updated.filter((item) => item.stato !== 'Scartata');
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

    private syncSegnalazioneDaCensimento(censimento: CensimentoStrutturaMock) {
        const all = readStruttureSegnalate();
        const updated = all.map((item) =>
            item.tokenCensimento === censimento.tokenCensimento || item.nomeStruttura.trim().toLowerCase() === censimento.nomeStruttura.trim().toLowerCase()
                ? {
                      ...item,
                      stato: 'Censimento ricevuto' as const,
                      statoVerifica: censimento.statoVerifica,
                      statoDisponibilita: censimento.statoDisponibilita,
                      pubblicata: censimento.pubblicata
                  }
                : item
        );
        writeStruttureSegnalate(updated);
        this.segnalazioni = updated.filter((item) => item.stato !== 'Scartata');
    }

    private updateAdminStruttura(struttura: AdminStrutturaItem, stato: StatoAdminStruttura) {
        if (struttura.id === 'struttura-profile-local' && this.strutturaProfile) {
            saveStrutturaProfile(this.strutturaProfile, this.profileStatusFromAdmin(stato));
            this.strutturaProfileStatus = readProfileStatus();
        }

        if (struttura.id === 'censimento-san-gaetano' && this.censimentoSanGaetano) {
            const aggiornata: CensimentoStrutturaMock = {
                ...this.censimentoSanGaetano,
                pubblicata: stato === 'APPROVATA',
                statoVerifica: stato === 'APPROVATA' ? 'Verificata' : stato === 'SOSPESA' ? 'Sospesa' : 'Da verificare',
                statoDisponibilita: stato === 'APPROVATA' ? 'Disponibile' : 'Non disponibile'
            };
            localStorage.setItem(SAN_GAETANO_CENSIMENTO_STORAGE_KEY, JSON.stringify(aggiornata));
            this.censimentoSanGaetano = aggiornata;
        }

        if (struttura.id.startsWith('segnalazione-')) {
            const id = struttura.id.replace('segnalazione-', '');
            this.updateSegnalazione(id, {
                pubblicata: stato === 'APPROVATA',
                stato: stato === 'RIFIUTATA' ? 'Scartata' : 'Censimento ricevuto',
                statoVerifica: stato === 'APPROVATA' ? 'Verificata' : stato === 'SOSPESA' ? 'Sospesa' : 'Da verificare',
                statoDisponibilita: stato === 'APPROVATA' ? 'Disponibile' : 'Non disponibile'
            });
        }

        this.selectedAdminStruttura = null;
    }

    private profileStatusFromAdmin(stato: StatoAdminStruttura): ProfileStatus {
        const map: Record<StatoAdminStruttura, ProfileStatus> = {
            IN_ATTESA: 'IN_ATTESA',
            APPROVATA: 'APPROVATA',
            RIFIUTATA: 'RIFIUTATA',
            SOSPESA: 'SOSPESA'
        };
        return map[stato];
    }

    private toAdminItemFromProfile(profile: StrutturaProfileMock, status: ProfileStatus): AdminStrutturaItem {
        return {
            id: 'struttura-profile-local',
            nome: profile.nome,
            referente: profile.referente,
            citta: [profile.citta, profile.regione].filter(Boolean).join(' / '),
            stato: this.adminStatusFromProfile(status),
            origine: 'Accreditamento struttura',
            data: profile.updatedAt,
            dettaglio: profile.descrizione || 'Profilo struttura accreditato tramite Area Strutture.'
        };
    }

    private toAdminItemFromCensimento(censimento: CensimentoStrutturaMock): AdminStrutturaItem {
        return {
            id: 'censimento-san-gaetano',
            nome: censimento.nomeStruttura,
            referente: censimento.referente,
            citta: [censimento.citta, censimento.regione].filter(Boolean).join(' / '),
            stato: censimento.pubblicata ? 'APPROVATA' : censimento.statoVerifica === 'Sospesa' ? 'SOSPESA' : 'IN_ATTESA',
            origine: 'Censimento struttura',
            data: censimento.dataInvio,
            dettaglio: censimento.noteOrganizzative || 'Censimento struttura ricevuto e in attesa di verifica admin.'
        };
    }

    private toAdminItemFromSegnalazione(segnalazione: StrutturaSegnalataMock): AdminStrutturaItem {
        return {
            id: `segnalazione-${segnalazione.id}`,
            nome: segnalazione.nomeStruttura,
            referente: segnalazione.referente,
            citta: [segnalazione.citta, segnalazione.regione].filter(Boolean).join(' / '),
            stato: segnalazione.stato === 'Scartata' ? 'RIFIUTATA' : segnalazione.pubblicata ? 'APPROVATA' : segnalazione.statoVerifica === 'Sospesa' ? 'SOSPESA' : 'IN_ATTESA',
            origine: 'Segnalazione comunità',
            data: segnalazione.dataSegnalazione,
            dettaglio: segnalazione.note || 'Segnalazione proposta da comunità.'
        };
    }

    private adminStatusFromProfile(status: ProfileStatus): StatoAdminStruttura {
        const map: Record<ProfileStatus, StatoAdminStruttura> = {
            BOZZA: 'IN_ATTESA',
            IN_ATTESA: 'IN_ATTESA',
            APPROVATA: 'APPROVATA',
            RIFIUTATA: 'RIFIUTATA',
            SOSPESA: 'SOSPESA'
        };
        return map[status];
    }

    readonly defaultCensimentoLink = SAN_GAETANO_CENSIMENTO_LINK;
}
