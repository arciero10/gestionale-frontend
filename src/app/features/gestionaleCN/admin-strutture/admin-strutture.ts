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

@Component({
    selector: 'app-admin-strutture',
    standalone: true,
    imports: [CommonModule, ButtonModule, TagModule],
    template: `
        <section class="admin-structures-page">
            <header class="page-head">
                <div>
                    <span>Admin piattaforma</span>
                    <h1>Admin strutture</h1>
                    <p>Gestione mock delle segnalazioni, degli inviti formali al censimento e della pubblicazione.</p>
                </div>
            </header>

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
            footer { display: flex; flex-wrap: wrap; gap: .6rem; justify-content: flex-end; }
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
                dl { grid-template-columns: 1fr; }
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

    readonly defaultCensimentoLink = SAN_GAETANO_CENSIMENTO_LINK;
}
