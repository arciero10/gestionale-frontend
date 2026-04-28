import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';

type RuoloComunita = 'Responsabile' | 'Corresponsabile' | 'Catechista' | 'Cantore' | 'Fratello';
type StatoMembro = 'Attivo' | 'Temporaneamente assente' | 'Da contattare';
type AccessoApp = 'Nessuno' | 'Invitato' | 'Attivo' | 'In attesa';

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

            <section class="community-data">
                @for (item of datiComunita; track item.label) {
                    <div>
                        <span>{{ item.label }}</span>
                        <strong>{{ item.value }}</strong>
                    </div>
                }
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
                            <strong>Membri comunità</strong>
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

            <section class="member-cards" aria-label="Membri comunità">
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

                .page-heading button,
                .form-actions button,
                .card-actions button {
                    min-height: 44px;
                }

                .community-data,
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
    ruoli: RuoloComunita[] = ['Responsabile', 'Corresponsabile', 'Catechista', 'Cantore', 'Fratello'];
    statiMembro: StatoMembro[] = ['Attivo', 'Temporaneamente assente', 'Da contattare'];
    accessiApp: AccessoApp[] = ['Nessuno', 'Invitato', 'Attivo', 'In attesa'];

    datiComunita = [
        { label: 'Comunità', value: '3ª Comunità' },
        { label: 'Parrocchia', value: 'San Giovanni Battista' },
        { label: 'Settore', value: 'Roma Sud' },
        { label: 'Città', value: 'Roma' },
        { label: 'Responsabile', value: 'Mario Rossi' }
    ];

    membri: MembroComunita[] = [
        { id: 1, nome: 'Mario', cognome: 'Rossi', ruolo: 'Responsabile', telefono: '333 1234567', email: 'mario.rossi@example.com', statoMembro: 'Attivo', accessoApp: 'Attivo', note: 'Responsabile principale' },
        { id: 2, nome: 'Lucia', cognome: 'Bianchi', ruolo: 'Catechista', telefono: '333 7654321', email: '', statoMembro: 'Attivo', accessoApp: 'Nessuno', note: '' },
        { id: 3, nome: 'Paolo', cognome: 'Verdi', ruolo: 'Cantore', telefono: '', email: '', statoMembro: 'Da contattare', accessoApp: 'In attesa', note: 'Verificare disponibilità' }
    ];

    formVisibile = false;
    membroInModifica: MembroComunita | null = null;
    private prossimoId = 4;

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

    private creaFormVuoto(): Omit<MembroComunita, 'id'> {
        return {
            nome: '',
            cognome: '',
            ruolo: 'Fratello',
            telefono: '',
            email: '',
            statoMembro: 'Attivo',
            accessoApp: 'Nessuno',
            note: ''
        };
    }
}
