import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { COMUNITA_PILOTA, MEMBRI_COMUNITA_PILOTA, MembroComunitaPilota, RuoloComunitaPilota, ConsensoPrivacyPilota } from '../data/comunita-pilota.mock';
import { DEMO_COMUNITA, DEMO_MEMBRI } from '../../demo/demo.mock';

type StatoMembro = MembroComunitaPilota['statoMembro'];
type AccessoApp = MembroComunitaPilota['accessoApp'];
type MembroForm = Omit<MembroComunitaPilota, 'id' | 'nomeCompleto'>;

@Component({
    selector: 'app-comunita',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, SelectModule, TableModule, TagModule, TextareaModule],
    template: `
        <div class="community-page">
            <header class="page-heading">
                <div>
                    <h1>La tua Comunità</h1>
                    <p>Anagrafica comunità e gestione iniziale dei consensi.</p>
                </div>
                <button pButton type="button" [icon]="formVisibile ? 'pi pi-times' : 'pi pi-user-plus'" [label]="formVisibile ? 'Annulla' : 'Aggiungi membro'" (click)="toggleForm()"></button>
            </header>

            <section class="identity-card">
                <div>
                    <span>Comunità associata</span>
                    <h2>{{ nomeComunita }}</h2>
                    <p>{{ parrocchiaComunita }}</p>
                </div>
                <div class="identity-meta">
                    <strong>Settore {{ settoreComunita }}</strong>
                    <strong>{{ diocesiComunita }}</strong>
                    <small>{{ isDemo ? 'I dati mostrati sono dimostrativi.' : 'Questi dati sono visibili solo nell’ambiente autenticato.' }}</small>
                </div>
            </section>

            @if (messaggioPrivacy) {
                <section class="action-message">
                    <i class="pi pi-info-circle"></i>
                    <span>{{ messaggioPrivacy }}</span>
                </section>
            }

            @if (formVisibile) {
                <section class="card p-6">
                    <h2 class="form-title">{{ membroInModifica ? 'Modifica membro' : 'Aggiungi membro' }}</h2>
                    <form class="member-form" #membroForm="ngForm" (ngSubmit)="salvaMembro()">
                        <div>
                            <label for="nome">Nome</label>
                            <input id="nome" name="nome" pInputText [(ngModel)]="form.nome" required />
                        </div>
                        <div>
                            <label for="cognome">Cognome</label>
                            <input id="cognome" name="cognome" pInputText [(ngModel)]="form.cognome" required />
                        </div>
                        <div>
                            <label for="ruolo">Ruolo</label>
                            <p-select inputId="ruolo" name="ruolo" appendTo="body" [options]="ruoli" [(ngModel)]="form.ruolo" required></p-select>
                        </div>
                        <div>
                            <label for="accessoApp">Accesso app</label>
                            <p-select inputId="accessoApp" name="accessoApp" appendTo="body" [options]="accessiApp" [(ngModel)]="form.accessoApp"></p-select>
                        </div>
                        <div>
                            <label for="statoMembro">Stato</label>
                            <p-select inputId="statoMembro" name="statoMembro" appendTo="body" [options]="statiMembro" [(ngModel)]="form.statoMembro"></p-select>
                        </div>
                        <div>
                            <label for="consensoPrivacyStato">Privacy</label>
                            <p-select inputId="consensoPrivacyStato" name="consensoPrivacyStato" appendTo="body" [options]="statiPrivacy" [(ngModel)]="form.consensoPrivacyStato"></p-select>
                        </div>
                        <label class="check-row">
                            <input type="checkbox" name="moduloPrivacyInviato" [(ngModel)]="form.moduloPrivacyInviato" />
                            Modulo privacy inviato
                        </label>
                        <label class="check-row">
                            <input type="checkbox" name="moduloPrivacyRicevuto" [(ngModel)]="form.moduloPrivacyRicevuto" />
                            Modulo privacy ricevuto
                        </label>
                        <div class="form-notes">
                            <label for="note">Note</label>
                            <textarea id="note" name="note" pTextarea rows="3" [(ngModel)]="form.note"></textarea>
                        </div>
                        <div class="form-actions">
                            <button pButton type="button" label="Annulla" severity="secondary" outlined (click)="annullaForm()"></button>
                            <button pButton type="submit" icon="pi pi-check" [label]="membroInModifica ? 'Salva modifiche' : 'Salva membro'" [disabled]="membroForm.invalid"></button>
                        </div>
                    </form>
                </section>
            }

            <section class="controls-card">
                <div class="search-box">
                    <label for="ricerca">Cerca membro</label>
                    <input id="ricerca" pInputText type="search" placeholder="Nome o cognome" [(ngModel)]="ricerca" />
                </div>
                <div class="search-box">
                    <label for="filtroRuolo">Filtra ruolo</label>
                    <p-select inputId="filtroRuolo" appendTo="body" [options]="ruoliFiltro" [(ngModel)]="ruoloFiltro" [showClear]="true" placeholder="Tutti i ruoli"></p-select>
                </div>
                <div class="totals">
                    <strong>{{ membriFiltrati.length }}</strong>
                    <span>membri visualizzati su {{ membri.length }}</span>
                </div>
            </section>

            <section class="role-summary" aria-label="Conteggio per ruolo">
                @for (item of conteggiRuolo; track item.ruolo) {
                    <article>
                        <span>{{ item.ruolo }}</span>
                        <strong>{{ item.totale }}</strong>
                    </article>
                }
            </section>

            <section class="card member-table">
                <p-table [value]="membriFiltrati" dataKey="id" responsiveLayout="scroll" [paginator]="membriFiltrati.length > 12" [rows]="12">
                    <ng-template #caption>
                        <div class="table-caption">
                            <strong>Membri comunità</strong>
                            <span>{{ membri.length }} membri totali</span>
                        </div>
                    </ng-template>
                    <ng-template #header>
                        <tr>
                            <th>Nome</th>
                            <th>Cognome</th>
                            <th>Ruolo</th>
                            <th>Accesso app</th>
                            <th>Privacy</th>
                            <th>Stato</th>
                            <th class="text-right">Azioni</th>
                        </tr>
                    </ng-template>
                    <ng-template #body let-membro>
                        <tr>
                            <td>{{ membro.nome }}</td>
                            <td>{{ membro.cognome }}</td>
                            <td><p-tag [value]="membro.ruolo" [severity]="getRuoloSeverity(membro.ruolo)" /></td>
                            <td><p-tag [value]="membro.accessoApp" [severity]="getAccessoSeverity(membro.accessoApp)" /></td>
                            <td><p-tag [value]="membro.consensoPrivacyStato" [severity]="getPrivacySeverity(membro.consensoPrivacyStato)" /></td>
                            <td><p-tag [value]="membro.statoMembro" [severity]="getStatoSeverity(membro.statoMembro)" /></td>
                            <td>
                                <div class="row-actions">
                                    <button pButton type="button" label="Modifica ruolo" icon="pi pi-user-edit" severity="info" text (click)="modificaMembro(membro)"></button>
                                    <button pButton type="button" label="Modifica privacy" icon="pi pi-shield" severity="secondary" text (click)="modificaMembro(membro)"></button>
                                    <button pButton type="button" label="Invia modulo privacy" icon="pi pi-send" severity="success" text (click)="inviaModuloPrivacy(membro)"></button>
                                    <button pButton type="button" icon="pi pi-trash" severity="danger" text ariaLabel="Elimina" (click)="eliminaMembro(membro.id)"></button>
                                </div>
                            </td>
                        </tr>
                    </ng-template>
                    <ng-template #emptymessage>
                        <tr>
                            <td colspan="7">Nessun membro trovato con i filtri attuali.</td>
                        </tr>
                    </ng-template>
                </p-table>
            </section>

            <section class="member-cards" aria-label="Membri comunità">
                @for (membro of membriFiltrati; track membro.id) {
                    <article class="member-card">
                        <div class="member-card-head">
                            <div>
                                <strong>{{ membro.nomeCompleto }}</strong>
                                <span>{{ membro.ruolo }}</span>
                            </div>
                            <p-tag [value]="membro.statoMembro" [severity]="getStatoSeverity(membro.statoMembro)" />
                        </div>
                        <dl>
                            <div><dt>Accesso app</dt><dd>{{ membro.accessoApp }}</dd></div>
                            <div><dt>Privacy</dt><dd>{{ membro.consensoPrivacyStato }}</dd></div>
                            <div><dt>Modulo inviato</dt><dd>{{ membro.moduloPrivacyInviato ? 'Sì' : 'No' }}</dd></div>
                            <div><dt>Modulo ricevuto</dt><dd>{{ membro.moduloPrivacyRicevuto ? 'Sì' : 'No' }}</dd></div>
                        </dl>
                        <div class="card-actions">
                            <button pButton type="button" icon="pi pi-user-edit" label="Modifica ruolo" severity="info" outlined (click)="modificaMembro(membro)"></button>
                            <button pButton type="button" icon="pi pi-shield" label="Privacy" severity="secondary" outlined (click)="modificaMembro(membro)"></button>
                            <button pButton type="button" icon="pi pi-send" label="Invia modulo" severity="success" outlined (click)="inviaModuloPrivacy(membro)"></button>
                        </div>
                    </article>
                }
            </section>
        </div>
    `,
    styles: [
        `
            .community-page {
                display: grid;
                gap: 1.5rem;
            }

            .page-heading,
            .table-caption,
            .row-actions,
            .card-actions,
            .identity-card,
            .controls-card {
                display: flex;
                gap: 1rem;
            }

            .page-heading,
            .table-caption {
                justify-content: space-between;
                align-items: center;
            }

            .page-heading h1 {
                margin: 0 0 0.35rem;
                font-size: 2rem;
            }

            .page-heading p {
                margin: 0;
                color: #64748b;
            }

            .identity-card,
            .controls-card,
            .role-summary article,
            .member-card,
            .action-message {
                padding: 1rem;
                border-radius: 14px;
                background: #fff;
                border: 1px solid #e5e7eb;
                box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
            }

            .identity-card {
                justify-content: space-between;
                align-items: flex-start;
                background: #fbfbf8;
            }

            .identity-card span,
            .search-box label,
            .role-summary span,
            .member-card dt {
                color: #64748b;
                font-size: 0.82rem;
                font-weight: 700;
            }

            .identity-card h2 {
                margin: 0.25rem 0;
                color: #111827;
                font-size: 1.45rem;
            }

            .identity-card p,
            .identity-meta small {
                margin: 0;
                color: #64748b;
            }

            .identity-meta {
                display: grid;
                gap: 0.3rem;
                text-align: right;
            }

            .action-message {
                display: flex;
                align-items: center;
                gap: 0.65rem;
                color: #075985;
                background: #f0f9ff;
                border-color: #bae6fd;
                font-weight: 700;
            }

            .member-form {
                display: grid;
                grid-template-columns: repeat(3, minmax(0, 1fr));
                gap: 1rem;
            }

            .member-form div {
                display: grid;
                gap: 0.45rem;
            }

            .member-form label {
                color: #1f2937;
                font-weight: 700;
            }

            .member-form input,
            .member-form textarea,
            .member-form p-select,
            .search-box input,
            .search-box p-select {
                width: 100%;
            }

            .form-title {
                margin: 0 0 1rem;
                font-size: 1.25rem;
            }

            .form-notes,
            .form-actions {
                grid-column: 1 / -1;
            }

            .check-row {
                min-height: 44px;
                display: flex !important;
                align-items: center;
                gap: 0.55rem;
                color: #1f2937;
                font-weight: 700;
            }

            .form-actions {
                display: flex !important;
                justify-content: flex-end;
                grid-template-columns: none !important;
            }

            .controls-card {
                align-items: end;
                justify-content: space-between;
                flex-wrap: wrap;
            }

            .search-box {
                display: grid;
                gap: 0.4rem;
                min-width: min(100%, 260px);
            }

            .totals {
                display: grid;
                gap: 0.15rem;
                text-align: right;
            }

            .totals strong {
                font-size: 1.6rem;
                color: #111827;
            }

            .totals span {
                color: #64748b;
            }

            .role-summary {
                display: grid;
                grid-template-columns: repeat(7, minmax(0, 1fr));
                gap: 0.85rem;
            }

            .role-summary article {
                display: grid;
                gap: 0.2rem;
            }

            .role-summary strong {
                color: #111827;
                font-size: 1.35rem;
            }

            .row-actions {
                justify-content: flex-end;
                flex-wrap: wrap;
            }

            .member-cards {
                display: none;
            }

            .member-card-head {
                display: flex;
                justify-content: space-between;
                gap: 1rem;
                align-items: flex-start;
            }

            .member-card-head strong {
                display: block;
                font-size: 1.05rem;
            }

            .member-card-head span {
                color: #64748b;
            }

            .member-card dl {
                display: grid;
                gap: 0.75rem;
                margin: 1rem 0;
            }

            .member-card dd {
                margin: 0.2rem 0 0;
                color: #111827;
                font-weight: 700;
            }

            @media (max-width: 1024px) {
                .member-form {
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                }

                .role-summary {
                    grid-template-columns: repeat(3, minmax(0, 1fr));
                }
            }

            @media (max-width: 767px) {
                :host {
                    display: block;
                    overflow-x: hidden;
                }

                .page-heading,
                .identity-card,
                .controls-card {
                    flex-direction: column;
                    align-items: stretch;
                }

                .identity-meta,
                .totals {
                    text-align: left;
                }

                .member-form,
                .role-summary {
                    grid-template-columns: 1fr;
                }

                .member-table {
                    display: none;
                }

                .member-cards {
                    display: grid;
                    gap: 1rem;
                }

                .card-actions {
                    flex-direction: column;
                }

                .card-actions button,
                .page-heading button,
                .form-actions button {
                    width: 100%;
                    min-height: 44px;
                }
            }
        `
    ]
})
export class Comunita {
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);

    ruoli: RuoloComunitaPilota[] = ['Presbitero', 'Responsabile', 'Corresponsabile', 'Catechista', 'Cantore', 'Ostiario', 'Fratello'];
    ruoliFiltro: RuoloComunitaPilota[] = this.ruoli;
    statiMembro: StatoMembro[] = ['Attivo', 'Temporaneamente assente', 'Da contattare'];
    accessiApp: AccessoApp[] = ['Nessuno', 'Invitato', 'Attivo', 'In attesa'];
    statiPrivacy: ConsensoPrivacyPilota[] = ['Da inviare', 'Da raccogliere', 'Raccolto', 'Negato', 'Revocato'];

    ricerca = '';
    ruoloFiltro: RuoloComunitaPilota | null = null;
    formVisibile = false;
    membroInModifica: MembroComunitaPilota | null = null;
    messaggioPrivacy = '';

    membri: MembroComunitaPilota[] = this.isDemo ? this.creaMembriDemo() : MEMBRI_COMUNITA_PILOTA.map((membro) => ({ ...membro }));
    private prossimoId = this.membri.length + 1;
    form: MembroForm = this.creaFormVuoto();

    get isDemo() {
        const url = this.router.url.split('?')[0].split('#')[0];
        return this.route.snapshot.data['demo'] === true || url === '/demo' || url.startsWith('/demo/');
    }

    get nomeComunita() {
        return this.isDemo ? DEMO_COMUNITA.nome : COMUNITA_PILOTA.nomeVisualizzato;
    }

    get parrocchiaComunita() {
        return this.isDemo ? DEMO_COMUNITA.parrocchia : COMUNITA_PILOTA.parrocchia;
    }

    get settoreComunita() {
        return this.isDemo ? DEMO_COMUNITA.settore.replace(/^Settore\s+/i, '') : COMUNITA_PILOTA.settore;
    }

    get diocesiComunita() {
        return this.isDemo ? DEMO_COMUNITA.diocesi : COMUNITA_PILOTA.diocesi;
    }

    get membriFiltrati() {
        const query = this.ricerca.trim().toLowerCase();
        return this.membri.filter((membro) => {
            const matchQuery = !query || membro.nome.toLowerCase().includes(query) || membro.cognome.toLowerCase().includes(query) || membro.nomeCompleto.toLowerCase().includes(query);
            const matchRuolo = !this.ruoloFiltro || membro.ruolo === this.ruoloFiltro;
            return matchQuery && matchRuolo;
        });
    }

    get conteggiRuolo() {
        return this.ruoli.map((ruolo) => ({
            ruolo,
            totale: this.membri.filter((membro) => membro.ruolo === ruolo).length
        }));
    }

    toggleForm() {
        if (this.formVisibile) {
            this.annullaForm();
            return;
        }
        this.formVisibile = true;
    }

    salvaMembro() {
        const membro = {
            ...this.form,
            nome: this.form.nome.trim(),
            cognome: this.form.cognome.trim(),
            nomeCompleto: `${this.form.nome.trim()} ${this.form.cognome.trim()}`.trim(),
            note: this.form.note.trim()
        };

        if (this.membroInModifica) {
            this.membri = this.membri.map((item) => (item.id === this.membroInModifica?.id ? { ...membro, id: item.id } : item));
        } else {
            this.membri = [...this.membri, { ...membro, id: this.prossimoId++ }];
        }

        this.annullaForm();
    }

    modificaMembro(membro: MembroComunitaPilota) {
        this.membroInModifica = membro;
        this.form = {
            nome: membro.nome,
            cognome: membro.cognome,
            ruolo: membro.ruolo,
            accessoApp: membro.accessoApp,
            statoMembro: membro.statoMembro,
            consensoPrivacyStato: membro.consensoPrivacyStato,
            moduloPrivacyInviato: membro.moduloPrivacyInviato,
            moduloPrivacyRicevuto: membro.moduloPrivacyRicevuto,
            note: membro.note
        };
        this.formVisibile = true;
    }

    eliminaMembro(id: number) {
        this.membri = this.membri.filter((membro) => membro.id !== id);
        if (this.membroInModifica?.id === id) {
            this.annullaForm();
        }
    }

    inviaModuloPrivacy(membro: MembroComunitaPilota) {
        this.membri = this.membri.map((item) => (item.id === membro.id ? { ...item, moduloPrivacyInviato: true } : item));
        this.messaggioPrivacy = 'Invio modulo privacy predisposto. Sarà collegato al backend email in una fase successiva.';
    }

    annullaForm() {
        this.form = this.creaFormVuoto();
        this.membroInModifica = null;
        this.formVisibile = false;
    }

    getRuoloSeverity(ruolo: RuoloComunitaPilota) {
        switch (ruolo) {
            case 'Presbitero':
                return 'contrast';
            case 'Responsabile':
                return 'success';
            case 'Corresponsabile':
                return 'info';
            case 'Catechista':
                return 'warn';
            case 'Cantore':
            case 'Ostiario':
                return 'secondary';
            default:
                return 'secondary';
        }
    }

    getAccessoSeverity(accesso: AccessoApp) {
        switch (accesso) {
            case 'Attivo':
                return 'success';
            case 'Invitato':
                return 'info';
            case 'In attesa':
                return 'warn';
            default:
                return 'secondary';
        }
    }

    getStatoSeverity(stato: StatoMembro) {
        switch (stato) {
            case 'Attivo':
                return 'success';
            case 'Temporaneamente assente':
                return 'warn';
            default:
                return 'info';
        }
    }

    getPrivacySeverity(stato: ConsensoPrivacyPilota) {
        switch (stato) {
            case 'Raccolto':
                return 'success';
            case 'Da inviare':
            case 'Da raccogliere':
                return 'warn';
            case 'Negato':
            case 'Revocato':
                return 'danger';
            default:
                return 'secondary';
        }
    }

    private creaMembriDemo(): MembroComunitaPilota[] {
        return DEMO_MEMBRI.map((membro, index) => ({
            id: index + 1,
            nome: membro.nome,
            cognome: membro.cognome,
            nomeCompleto: `${membro.nome} ${membro.cognome}`,
            ruolo: membro.ruolo as RuoloComunitaPilota,
            accessoApp: membro.accessoApp as AccessoApp,
            statoMembro: membro.stato as StatoMembro,
            consensoPrivacyStato: membro.privacy as ConsensoPrivacyPilota,
            moduloPrivacyInviato: membro.privacy === 'Raccolto',
            moduloPrivacyRicevuto: membro.privacy === 'Raccolto',
            note: 'Dato dimostrativo'
        }));
    }

    private creaFormVuoto(): MembroForm {
        return {
            nome: '',
            cognome: '',
            ruolo: 'Fratello',
            accessoApp: 'Nessuno',
            statoMembro: 'Attivo',
            consensoPrivacyStato: 'Da inviare',
            moduloPrivacyInviato: false,
            moduloPrivacyRicevuto: false,
            note: ''
        };
    }
}
