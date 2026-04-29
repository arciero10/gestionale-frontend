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
import { COMUNITA_ATTIVA_MOCK, DIOCESI_MOCK, PARROCCHIE_MOCK, SETTORI_MOCK, generaNomeComunita } from '../data/anagrafica-ecclesiale.mock';
import { DEMO_COMUNITA, DEMO_MEMBRI } from '../../demo/demo.mock';

type RuoloComunita = 'Responsabile' | 'Corresponsabile' | 'Catechista' | 'Cantore' | 'Fratello';
type StatoMembro = 'Attivo' | 'Temporaneamente assente' | 'Da contattare';
type AccessoApp = 'Nessuno' | 'Invitato' | 'Attivo' | 'In attesa';
type ConsensoPrivacyStato = 'Da raccogliere' | 'Raccolto' | 'Negato' | 'Revocato';
type ConsensoPrivacyMetodo = 'Digitale' | 'Cartaceo' | 'Raccolto dal responsabile' | 'Non indicato';

interface MembroComunita {
    id: number;
    nome: string;
    cognome: string;
    ruolo: RuoloComunita;
    telefono: string;
    email: string;
    statoMembro: StatoMembro;
    accessoApp: AccessoApp;
    note: string;
    consensoPrivacyStato: ConsensoPrivacyStato;
    consensoPrivacyMetodo: ConsensoPrivacyMetodo;
    consensoPrivacyData: string;
    consensoPrivacyRaccoltoDa: string;
    consensoDatiParticolari: boolean;
    consensoCondivisioneStrutture: boolean;
    moduloPrivacyRicevuto: boolean;
    consensoNote: string;
}

@Component({
    selector: 'app-comunita',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, SelectModule, TableModule, TagModule, TextareaModule],
    template: `
        <div class="community-page">
            <header class="page-heading">
                <div>
                    <h1>La tua Comunità</h1>
                    <p>Anagrafica comunità e accessi app opzionali.</p>
                </div>
                <button pButton type="button" [icon]="formVisibile ? 'pi pi-times' : 'pi pi-user-plus'" [label]="formVisibile ? 'Annulla' : 'Aggiungi membro'" (click)="toggleForm()"></button>
            </header>

            <section class="identity-card">
                <div class="identity-head">
                    <div>
                        <span>Comunità associata</span>
                        <h2>{{ nomeComunita }}</h2>
                    </div>
                    <small>Questa è la comunità associata al tuo profilo.</small>
                </div>

                <div class="identity-summary">
                    <div><span>Parrocchia</span><strong>{{ parrocchiaComunita }}</strong></div>
                    <div><span>Settore</span><strong>{{ settoreComunita }}</strong></div>
                    <div><span>Diocesi</span><strong>{{ diocesiComunita }}</strong></div>
                    <div><span>Responsabile</span><strong>{{ responsabileComunita }}</strong></div>
                </div>

                <p class="identity-note">Le modifiche all’associazione comunità saranno gestite da un responsabile autorizzato.</p>
            </section>

            <section class="community-data">
                @for (item of datiComunita; track item.label) {
                    <div>
                        <span>{{ item.label }}</span>
                        <strong>{{ item.value }}</strong>
                    </div>
                }
            </section>

            <section class="privacy-note">
                Il gestionale aiuta a tracciare lo stato dei consensi. Prima della produzione sarà necessario validare informativa privacy, modalità di raccolta consenso e ruoli autorizzativi.
            </section>

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
                            <label for="telefono">Telefono</label>
                            <input id="telefono" name="telefono" pInputText [(ngModel)]="form.telefono" />
                        </div>
                        <div>
                            <label for="email">Email</label>
                            <input id="email" name="email" type="email" pInputText [(ngModel)]="form.email" />
                        </div>
                        <div>
                            <label for="accessoApp">Accesso app</label>
                            <p-select inputId="accessoApp" name="accessoApp" appendTo="body" [options]="accessiApp" [(ngModel)]="form.accessoApp"></p-select>
                        </div>
                        <div>
                            <label for="statoMembro">Stato membro</label>
                            <p-select inputId="statoMembro" name="statoMembro" appendTo="body" [options]="statiMembro" [(ngModel)]="form.statoMembro"></p-select>
                        </div>
                        <div class="form-notes">
                            <label for="note">Note</label>
                            <textarea id="note" name="note" pTextarea rows="3" [(ngModel)]="form.note"></textarea>
                        </div>
                        <section class="privacy-form">
                            <div class="privacy-form-head">
                                <h3>Privacy e consensi</h3>
                                <p>Prima di condividere dati personali o particolari con strutture esterne è necessario verificare il consenso dell’interessato.</p>
                            </div>
                            @if (form.consensoPrivacyStato === 'Da raccogliere') {
                                <div class="privacy-alert warning">Consenso privacy da raccogliere prima di eventuali condivisioni.</div>
                            }
                            @if (form.consensoPrivacyStato === 'Negato' || form.consensoPrivacyStato === 'Revocato') {
                                <div class="privacy-alert danger">Consenso negato o revocato: i dati non devono essere condivisi con strutture esterne.</div>
                            }
                            <div>
                                <label for="consensoPrivacyStato">Stato consenso privacy</label>
                                <p-select inputId="consensoPrivacyStato" name="consensoPrivacyStato" appendTo="body" [options]="statiConsensoPrivacy" [(ngModel)]="form.consensoPrivacyStato"></p-select>
                            </div>
                            <div>
                                <label for="consensoPrivacyMetodo">Metodo consenso</label>
                                <p-select inputId="consensoPrivacyMetodo" name="consensoPrivacyMetodo" appendTo="body" [options]="metodiConsensoPrivacy" [(ngModel)]="form.consensoPrivacyMetodo"></p-select>
                            </div>
                            <div>
                                <label for="consensoPrivacyData">Data consenso</label>
                                <input id="consensoPrivacyData" name="consensoPrivacyData" type="date" pInputText [(ngModel)]="form.consensoPrivacyData" />
                            </div>
                            <div>
                                <label for="consensoPrivacyRaccoltoDa">Raccolto da</label>
                                <input id="consensoPrivacyRaccoltoDa" name="consensoPrivacyRaccoltoDa" pInputText [(ngModel)]="form.consensoPrivacyRaccoltoDa" />
                            </div>
                            <label class="check-row">
                                <input type="checkbox" name="consensoDatiParticolari" [(ngModel)]="form.consensoDatiParticolari" />
                                Consenso dati particolari
                            </label>
                            <label class="check-row">
                                <input type="checkbox" name="consensoCondivisioneStrutture" [(ngModel)]="form.consensoCondivisioneStrutture" />
                                Consenso condivisione dati con strutture
                            </label>
                            <label class="check-row">
                                <input type="checkbox" name="moduloPrivacyRicevuto" [(ngModel)]="form.moduloPrivacyRicevuto" />
                                Modulo privacy ricevuto
                            </label>
                            <div class="form-notes">
                                <label for="consensoNote">Note privacy</label>
                                <textarea id="consensoNote" name="consensoNote" pTextarea rows="3" [(ngModel)]="form.consensoNote"></textarea>
                            </div>
                        </section>
                        <div class="form-actions">
                            <button pButton type="button" label="Annulla" severity="secondary" outlined (click)="annullaForm()"></button>
                            <button pButton type="submit" icon="pi pi-check" [label]="membroInModifica ? 'Salva modifiche' : 'Salva membro'" [disabled]="membroForm.invalid"></button>
                        </div>
                    </form>
                </section>
            }

            <section class="card member-table">
                <p-table [value]="membri" dataKey="id" responsiveLayout="scroll" [paginator]="membri.length > 8" [rows]="8">
                    <ng-template #caption>
                        <div class="table-caption">
                            <strong>Membri comunitÃ </strong>
                            <span>{{ membri.length }} membri</span>
                        </div>
                    </ng-template>
                    <ng-template #header>
                        <tr>
                            <th>Nome</th>
                            <th>Cognome</th>
                            <th>Ruolo</th>
                            <th>Telefono</th>
                            <th>Email</th>
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
                            <td>{{ membro.telefono || '-' }}</td>
                            <td>{{ membro.email || '-' }}</td>
                            <td><p-tag [value]="membro.accessoApp" [severity]="getAccessoSeverity(membro.accessoApp)" /></td>
                            <td><p-tag [value]="membro.consensoPrivacyStato" [severity]="getPrivacySeverity(membro.consensoPrivacyStato)" /></td>
                            <td><p-tag [value]="membro.statoMembro" [severity]="getStatoSeverity(membro.statoMembro)" /></td>
                            <td>
                                <div class="row-actions">
                                    <p-button icon="pi pi-pencil" [text]="true" severity="info" ariaLabel="Modifica" (click)="modificaMembro(membro)" />
                                    <p-button icon="pi pi-trash" [text]="true" severity="danger" ariaLabel="Elimina" (click)="eliminaMembro(membro.id)" />
                                </div>
                            </td>
                        </tr>
                    </ng-template>
                </p-table>
            </section>

            <section class="member-cards" aria-label="Membri comunitÃ ">
                @for (membro of membri; track membro.id) {
                    <article class="member-card">
                        <div class="member-card-head">
                            <div>
                                <strong>{{ membro.nome }} {{ membro.cognome }}</strong>
                                <span>{{ membro.ruolo }}</span>
                            </div>
                            <p-tag [value]="membro.statoMembro" [severity]="getStatoSeverity(membro.statoMembro)" />
                        </div>
                        <dl>
                            <div><dt>Telefono</dt><dd>{{ membro.telefono || '-' }}</dd></div>
                            <div><dt>Email</dt><dd>{{ membro.email || '-' }}</dd></div>
                            <div><dt>Accesso app</dt><dd>{{ membro.accessoApp }}</dd></div>
                            <div><dt>Privacy</dt><dd>{{ membro.consensoPrivacyStato }}</dd></div>
                        </dl>
                        <div class="card-actions">
                            <button pButton type="button" icon="pi pi-pencil" label="Modifica" severity="info" outlined (click)="modificaMembro(membro)"></button>
                            <button pButton type="button" icon="pi pi-trash" label="Elimina" severity="danger" outlined (click)="eliminaMembro(membro.id)"></button>
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

            .page-heading {
                display: flex;
                justify-content: space-between;
                gap: 1rem;
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

            .community-data {
                display: grid;
                grid-template-columns: repeat(5, minmax(0, 1fr));
                gap: 1rem;
            }

            .identity-card {
                padding: 1.25rem;
                border-radius: 14px;
                background: #fff;
                border: 1px solid #e5e7eb;
                box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
                display: grid;
                gap: 1rem;
            }

            .identity-head {
                display: flex;
                justify-content: space-between;
                gap: 1rem;
                align-items: flex-start;
            }

            .identity-head span {
                display: block;
                margin-bottom: 0.3rem;
                color: #64748b;
                font-size: 0.82rem;
                font-weight: 700;
                text-transform: uppercase;
            }

            .identity-head h2 {
                margin: 0;
                color: #111827;
                font-size: 1.35rem;
            }

            .identity-head small {
                max-width: 24rem;
                color: #64748b;
                line-height: 1.45;
            }

            .identity-summary {
                display: grid;
                grid-template-columns: repeat(4, minmax(0, 1fr));
                gap: 1rem;
            }

            .identity-summary div {
                padding: 0.9rem;
                border-radius: 12px;
                background: #fbfbf8;
                border: 1px solid #e5e7eb;
                display: grid;
                gap: 0.25rem;
            }

            .identity-summary span {
                color: #64748b;
                font-size: 0.82rem;
            }

            .identity-summary strong {
                color: #111827;
            }

            .identity-note {
                margin: 0;
                color: #64748b;
                font-size: 0.9rem;
            }

            .privacy-note {
                padding: 0.85rem 1rem;
                border-radius: 12px;
                background: #f8fafc;
                border: 1px solid #e5e7eb;
                color: #64748b;
                font-size: 0.9rem;
                line-height: 1.5;
            }

            .community-data div,
            .member-card {
                padding: 1rem;
                border-radius: 12px;
                background: #fff;
                border: 1px solid #e5e7eb;
                box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
            }

            .community-data span,
            .member-card dt {
                display: block;
                color: #64748b;
                font-size: 0.82rem;
            }

            .community-data strong,
            .member-card dd {
                margin: 0.2rem 0 0;
                color: #111827;
                font-weight: 700;
            }

            .form-title {
                margin: 0 0 1rem;
                font-size: 1.25rem;
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
            .member-form p-select {
                width: 100%;
            }

            .form-notes {
                grid-column: 1 / -1;
            }

            .privacy-form {
                grid-column: 1 / -1;
                display: grid;
                grid-template-columns: repeat(3, minmax(0, 1fr));
                gap: 1rem;
                padding: 1rem;
                border-radius: 14px;
                border: 1px solid #e5e7eb;
                background: #fbfbf8;
            }

            .privacy-form-head,
            .privacy-alert {
                grid-column: 1 / -1;
            }

            .privacy-form-head h3 {
                margin: 0 0 0.35rem;
                color: #111827;
            }

            .privacy-form-head p {
                margin: 0;
                color: #64748b;
                line-height: 1.5;
            }

            .privacy-alert {
                padding: 0.75rem;
                border-radius: 12px;
                font-weight: 700;
            }

            .privacy-alert.warning {
                background: #fffbeb;
                color: #92400e;
                border: 1px solid #fde68a;
            }

            .privacy-alert.danger {
                background: #fef2f2;
                color: #991b1b;
                border: 1px solid #fecaca;
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
                grid-column: 1 / -1;
                display: flex !important;
                justify-content: flex-end;
                grid-template-columns: none !important;
                flex-direction: row;
            }

            .table-caption,
            .row-actions,
            .card-actions {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 0.5rem;
            }

            .row-actions {
                justify-content: flex-end;
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

            @media (max-width: 1024px) {
                .community-data,
                .identity-summary,
                .privacy-form,
                .member-form {
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                }
            }

            @media (max-width: 767px) {
                :host {
                    display: block;
                    overflow-x: hidden;
                }

                .page-heading {
                    align-items: stretch;
                    flex-direction: column;
                }

                .identity-head {
                    flex-direction: column;
                }

                .page-heading button,
                .form-actions button,
                .card-actions button {
                    min-height: 44px;
                }

                .community-data,
                .identity-summary,
                .privacy-form,
                .member-form {
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

                .card-actions button {
                    width: 100%;
                }
            }
        `
    ]
})
export class Comunita {
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);

    ruoli: RuoloComunita[] = ['Responsabile', 'Corresponsabile', 'Catechista', 'Cantore', 'Fratello'];
    statiMembro: StatoMembro[] = ['Attivo', 'Temporaneamente assente', 'Da contattare'];
    accessiApp: AccessoApp[] = ['Nessuno', 'Invitato', 'Attivo', 'In attesa'];
    statiConsensoPrivacy: ConsensoPrivacyStato[] = ['Da raccogliere', 'Raccolto', 'Negato', 'Revocato'];
    metodiConsensoPrivacy: ConsensoPrivacyMetodo[] = ['Digitale', 'Cartaceo', 'Raccolto dal responsabile', 'Non indicato'];
    diocesi = DIOCESI_MOCK;
    settori = SETTORI_MOCK;
    parrocchie = PARROCCHIE_MOCK;
    comunitaAttiva = { ...COMUNITA_ATTIVA_MOCK };

    get isDemo() {
        const url = this.router.url.split('?')[0].split('#')[0];
        return this.route.snapshot.data['demo'] === true || url === '/demo' || url.startsWith('/demo/');
    }

    get nomeComunita() {
        return this.isDemo ? DEMO_COMUNITA.nome : generaNomeComunita(this.comunitaAttiva.numero);
    }

    get diocesiSelezionata() {
        return this.diocesi.find((diocesi) => diocesi.id === this.comunitaAttiva.diocesiId);
    }

    get settoreSelezionato() {
        return this.settori.find((settore) => settore.id === this.comunitaAttiva.settoreId);
    }

    get parrocchiaSelezionata() {
        return this.parrocchie.find((parrocchia) => parrocchia.id === this.comunitaAttiva.parrocchiaId);
    }

    get datiComunita() {
        if (this.isDemo) {
            return [
                { label: 'Comunità', value: DEMO_COMUNITA.nome },
                { label: 'Parrocchia', value: DEMO_COMUNITA.parrocchia },
                { label: 'Settore', value: DEMO_COMUNITA.settore },
                { label: 'Diocesi', value: DEMO_COMUNITA.diocesi },
                { label: 'Responsabile', value: DEMO_COMUNITA.responsabile }
            ];
        }

        return [
            { label: 'Comunità', value: generaNomeComunita(this.comunitaAttiva.numero) },
            { label: 'Parrocchia', value: this.parrocchiaSelezionata?.nome ?? '-' },
            { label: 'Settore', value: this.settoreSelezionato ? `Settore ${this.settoreSelezionato.nome}` : '-' },
            { label: 'Diocesi', value: this.diocesiSelezionata?.nome ?? '-' },
            { label: 'Responsabile', value: this.comunitaAttiva.responsabilePrincipale }
        ];
    }

    get responsabileComunita() {
        return this.isDemo ? DEMO_COMUNITA.responsabile : this.comunitaAttiva.responsabilePrincipale;
    }

    get parrocchiaComunita() {
        return this.isDemo ? DEMO_COMUNITA.parrocchia : (this.parrocchiaSelezionata?.nome ?? '-');
    }

    get settoreComunita() {
        return this.isDemo ? DEMO_COMUNITA.settore : (this.settoreSelezionato ? `Settore ${this.settoreSelezionato.nome}` : '-');
    }

    get diocesiComunita() {
        return this.isDemo ? DEMO_COMUNITA.diocesi : (this.diocesiSelezionata?.nome ?? '-');
    }

    membri: MembroComunita[] = this.isDemo ? this.creaMembriDemo() : [
        { id: 1, nome: 'Mario', cognome: 'Rossi', ruolo: 'Responsabile', telefono: '333 1234567', email: 'mario.rossi@example.com', statoMembro: 'Attivo', accessoApp: 'Attivo', note: 'Responsabile principale', consensoPrivacyStato: 'Raccolto', consensoPrivacyMetodo: 'Digitale', consensoPrivacyData: '2026-04-12', consensoPrivacyRaccoltoDa: 'Segreteria', consensoDatiParticolari: true, consensoCondivisioneStrutture: true, moduloPrivacyRicevuto: true, consensoNote: 'Consenso completo mock.' },
        { id: 2, nome: 'Lucia', cognome: 'Bianchi', ruolo: 'Catechista', telefono: '333 7654321', email: '', statoMembro: 'Attivo', accessoApp: 'Nessuno', note: '', consensoPrivacyStato: 'Da raccogliere', consensoPrivacyMetodo: 'Non indicato', consensoPrivacyData: '', consensoPrivacyRaccoltoDa: '', consensoDatiParticolari: false, consensoCondivisioneStrutture: false, moduloPrivacyRicevuto: false, consensoNote: 'Da verificare al prossimo incontro.' },
        { id: 3, nome: 'Paolo', cognome: 'Verdi', ruolo: 'Cantore', telefono: '', email: '', statoMembro: 'Da contattare', accessoApp: 'In attesa', note: 'Verificare disponibilità', consensoPrivacyStato: 'Negato', consensoPrivacyMetodo: 'Cartaceo', consensoPrivacyData: '2026-03-20', consensoPrivacyRaccoltoDa: 'Mario Rossi', consensoDatiParticolari: false, consensoCondivisioneStrutture: false, moduloPrivacyRicevuto: true, consensoNote: 'Non condividere dati con strutture esterne.' }
    ];

    formVisibile = false;
    membroInModifica: MembroComunita | null = null;
    private prossimoId = this.isDemo ? DEMO_MEMBRI.length + 1 : 4;

    form: Omit<MembroComunita, 'id'> = this.creaFormVuoto();

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
            telefono: this.form.telefono.trim(),
            email: this.form.email.trim(),
            note: this.form.note.trim()
        };

        if (this.membroInModifica) {
            this.membri = this.membri.map((item) => (item.id === this.membroInModifica?.id ? { ...membro, id: item.id } : item));
        } else {
            this.membri = [...this.membri, { ...membro, id: this.prossimoId++ }];
        }

        this.annullaForm();
    }

    modificaMembro(membro: MembroComunita) {
        this.membroInModifica = membro;
        this.form = { ...membro };
        this.formVisibile = true;
    }

    eliminaMembro(id: number) {
        this.membri = this.membri.filter((membro) => membro.id !== id);
        if (this.membroInModifica?.id === id) {
            this.annullaForm();
        }
    }

    annullaForm() {
        this.form = this.creaFormVuoto();
        this.membroInModifica = null;
        this.formVisibile = false;
    }

    getRuoloSeverity(ruolo: RuoloComunita) {
        switch (ruolo) {
            case 'Responsabile':
                return 'success';
            case 'Corresponsabile':
                return 'info';
            case 'Catechista':
                return 'warn';
            case 'Cantore':
                return 'secondary';
            default:
                return 'contrast';
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

    getPrivacySeverity(stato: ConsensoPrivacyStato) {
        switch (stato) {
            case 'Raccolto':
                return 'success';
            case 'Da raccogliere':
                return 'warn';
            case 'Negato':
            case 'Revocato':
                return 'danger';
            default:
                return 'secondary';
        }
    }

    private creaMembriDemo(): MembroComunita[] {
        return DEMO_MEMBRI.map((membro, index) => ({
            id: index + 1,
            nome: membro.nome,
            cognome: membro.cognome,
            ruolo: membro.ruolo as RuoloComunita,
            telefono: '',
            email: '',
            statoMembro: membro.stato as StatoMembro,
            accessoApp: membro.accessoApp as AccessoApp,
            note: 'Dato dimostrativo',
            consensoPrivacyStato: membro.privacy as ConsensoPrivacyStato,
            consensoPrivacyMetodo: membro.privacy === 'Raccolto' ? 'Digitale' : 'Non indicato',
            consensoPrivacyData: membro.privacy === 'Raccolto' ? '2026-04-01' : '',
            consensoPrivacyRaccoltoDa: membro.privacy === 'Raccolto' ? 'Responsabile demo' : '',
            consensoDatiParticolari: membro.privacy === 'Raccolto',
            consensoCondivisioneStrutture: membro.privacy === 'Raccolto',
            moduloPrivacyRicevuto: membro.privacy === 'Raccolto',
            consensoNote: 'Dato privacy dimostrativo.'
        }));
    }

    private creaFormVuoto(): Omit<MembroComunita, 'id'> {
        return {
            nome: '',
            cognome: '',
            ruolo: 'Fratello',
            telefono: '',
            email: '',
            statoMembro: 'Attivo',
            accessoApp: 'Nessuno',
            note: '',
            consensoPrivacyStato: 'Da raccogliere',
            consensoPrivacyMetodo: 'Non indicato',
            consensoPrivacyData: '',
            consensoPrivacyRaccoltoDa: '',
            consensoDatiParticolari: false,
            consensoCondivisioneStrutture: false,
            moduloPrivacyRicevuto: false,
            consensoNote: ''
        };
    }
}
