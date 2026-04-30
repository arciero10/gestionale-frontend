import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { DIOCESI_MOCK, NUMERI_COMUNITA, PARROCCHIE_MOCK, SETTORI_MOCK, creaNomeComunitaVisualizzato, generaNomeComunita } from '../data/anagrafica-ecclesiale.mock';
import { saveSelectedCommunity } from '../data/community-selection.storage';

const PARROCCHIA_MANUALE_ID = -1;

@Component({
    selector: 'app-onboarding-comunita',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, SelectModule],
    template: `
        <main class="onboarding-page">
            <section class="onboarding-card">
                <div class="page-intro">
                    @if (isPreview) {
                        <span class="preview-badge">Anteprima responsabile</span>
                    }
                    <h1>Associa la tua comunità</h1>
                    <p>Seleziona la comunità di appartenenza per accedere al gestionale corretto.</p>
                    @if (isPreview) {
                        <small>Questa è una simulazione del primo accesso utente. Nessuna scelta viene salvata per utenti reali.</small>
                    }
                </div>

                @if (messaggio) {
                    <div class="action-message">
                        <i class="pi pi-check-circle"></i>
                        <span>{{ messaggio }}</span>
                    </div>
                }

                <form class="community-form" (ngSubmit)="conferma()">
                    <div class="field">
                        <label for="parrocchia">Parrocchia</label>
                        <p-select
                            inputId="parrocchia"
                            name="parrocchia"
                            appendTo="body"
                            panelStyleClass="onboarding-dropdown-panel"
                            [options]="parrocchieOptions"
                            optionLabel="nome"
                            optionValue="id"
                            [(ngModel)]="parrocchiaId"
                        ></p-select>
                    </div>

                    @if (parrocchiaManualeAttiva) {
                        <div class="manual-box">
                            <div class="field">
                                <label for="parrocchiaManuale">Inserisci nome parrocchia</label>
                                <input id="parrocchiaManuale" name="parrocchiaManuale" pInputText [(ngModel)]="parrocchiaManuale" required />
                            </div>
                            <p class="note">Se la parrocchia non è presente, sarà verificata dal responsabile.</p>
                        </div>
                    }

                    <div class="field">
                        <label for="numero">Numero comunità</label>
                        <p-select inputId="numero" name="numero" appendTo="body" panelStyleClass="onboarding-dropdown-panel" [options]="numeriComunita" [(ngModel)]="numeroComunita"></p-select>
                    </div>

                    <div class="readonly-grid">
                        <div>
                            <span>Settore</span>
                            @if (parrocchiaManualeAttiva) {
                                <input name="settoreManuale" pInputText [(ngModel)]="settoreManuale" placeholder="Da verificare" />
                            } @else {
                                <strong>{{ settoreNome || 'Da completare' }}</strong>
                            }
                        </div>
                        <div>
                            <span>Diocesi</span>
                            @if (parrocchiaManualeAttiva) {
                                <input name="diocesiManuale" pInputText [(ngModel)]="diocesiManuale" />
                            } @else {
                                <strong>{{ diocesiNome || 'Da completare' }}</strong>
                            }
                        </div>
                    </div>

                    <div class="preview-box">
                        <span>Preview comunità</span>
                        <strong>{{ previewComunita }}</strong>
                    </div>

                    <p class="note">Questa scelta potrà essere verificata dal responsabile della comunità.</p>

                    <button pButton type="submit" [label]="isPreview ? 'Simula conferma' : 'Conferma comunità'" icon="pi pi-check"></button>
                </form>
            </section>
        </main>
    `,
    styles: [
        `
            :host {
                display: block;
            }

            .onboarding-page {
                min-height: calc(100vh - 4rem);
                display: grid;
                place-items: center;
                padding: clamp(1rem, 3vw, 2rem);
                background: #f5f7fb;
            }

            .onboarding-card {
                width: min(100%, 720px);
                display: grid;
                gap: 1.25rem;
                padding: clamp(1.25rem, 3vw, 2rem);
                border-radius: 20px;
                background: #fff;
                border: 1px solid #e5e7eb;
                box-shadow: 0 18px 45px rgba(15, 23, 42, 0.1);
            }

            .page-intro {
                display: grid;
                gap: 0.45rem;
                text-align: center;
            }

            .page-intro h1,
            .page-intro p {
                margin: 0;
            }

            .page-intro h1 {
                color: #0f2440;
                font-size: clamp(1.65rem, 3vw, 2.3rem);
            }

            .page-intro p,
            .page-intro small,
            .note {
                color: #64748b;
                line-height: 1.5;
            }

            .preview-badge {
                justify-self: center;
                display: inline-flex;
                align-items: center;
                min-height: 1.8rem;
                padding: 0.25rem 0.75rem;
                border-radius: 999px;
                background: #eef2ff;
                color: #3730a3;
                border: 1px solid #c7d2fe;
                font-size: 0.78rem;
                font-weight: 800;
                text-transform: uppercase;
            }

            .community-form {
                display: grid;
                gap: 1rem;
            }

            .field,
            .manual-box,
            .preview-box {
                display: grid;
                gap: 0.4rem;
            }

            .manual-box {
                padding: 0.85rem 1rem;
                border-radius: 14px;
                background: #fffbeb;
                border: 1px solid #fde68a;
            }

            label,
            .readonly-grid span,
            .preview-box span {
                color: #475569;
                font-size: 0.85rem;
                font-weight: 800;
            }

            .readonly-grid {
                display: grid;
                grid-template-columns: repeat(2, minmax(0, 1fr));
                gap: 0.75rem;
            }

            .readonly-grid div,
            .preview-box,
            .action-message {
                padding: 0.85rem 1rem;
                border-radius: 14px;
                background: #f8fafc;
                border: 1px solid #e5e7eb;
            }

            .readonly-grid strong,
            .readonly-grid input,
            .preview-box strong {
                color: #0f2440;
                font-size: 1rem;
            }

            .preview-box {
                background: #eff6ff;
                border-color: #bfdbfe;
            }

            .action-message {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 0.5rem;
                color: #166534;
                background: #dcfce7;
                border-color: #bbf7d0;
                font-weight: 800;
            }

            :host ::ng-deep .onboarding-dropdown-panel {
                z-index: 12000 !important;
            }

            @media (max-width: 767px) {
                .onboarding-page {
                    place-items: start stretch;
                }

                .readonly-grid {
                    grid-template-columns: 1fr;
                }
            }
        `
    ]
})
export class OnboardingComunita {
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);

    readonly isPreview = this.route.snapshot.data['preview'] === true;
    readonly parrocchieOptions = [...PARROCCHIE_MOCK, { id: PARROCCHIA_MANUALE_ID, nome: 'Parrocchia non presente in elenco', diocesiId: 1, settoreId: 0, note: '' }];
    readonly numeriComunita = NUMERI_COMUNITA;

    parrocchiaId = 24;
    numeroComunita = 3;
    parrocchiaManuale = '';
    settoreManuale = 'Da verificare';
    diocesiManuale = 'Diocesi di Roma';
    messaggio = '';

    get parrocchiaManualeAttiva() {
        return this.parrocchiaId === PARROCCHIA_MANUALE_ID;
    }

    get parrocchia() {
        return PARROCCHIE_MOCK.find((parrocchia) => parrocchia.id === this.parrocchiaId) ?? PARROCCHIE_MOCK.find((parrocchia) => parrocchia.id === 24) ?? PARROCCHIE_MOCK[0];
    }

    get settore() {
        return SETTORI_MOCK.find((settore) => settore.id === this.parrocchia?.settoreId);
    }

    get diocesi() {
        return DIOCESI_MOCK.find((diocesi) => diocesi.id === this.parrocchia?.diocesiId);
    }

    get settoreNome() {
        if (this.parrocchiaManualeAttiva) {
            return this.settoreManuale.trim();
        }

        return this.settore?.nome ?? '';
    }

    get diocesiNome() {
        if (this.parrocchiaManualeAttiva) {
            return this.diocesiManuale.trim();
        }

        return this.diocesi?.nome ?? '';
    }

    get parrocchiaNome() {
        return this.parrocchiaManualeAttiva ? this.parrocchiaManuale.trim() : this.parrocchia.nome;
    }

    get previewComunita() {
        if (this.parrocchiaManualeAttiva && !this.settoreNome) {
            return `${generaNomeComunita(this.numeroComunita)} – ${this.parrocchiaNome || 'Parrocchia da inserire'}`;
        }

        return creaNomeComunitaVisualizzato(this.numeroComunita, this.parrocchiaNome || 'Parrocchia da inserire', this.settoreNome);
    }

    conferma() {
        if (this.parrocchiaManualeAttiva && !this.parrocchiaNome) {
            this.messaggio = 'Inserisci il nome della parrocchia';
            return;
        }

        if (this.isPreview) {
            this.messaggio = 'Simulazione completata';
            return;
        }

        saveSelectedCommunity({
            numero: this.numeroComunita,
            nomeVisualizzato: generaNomeComunita(this.numeroComunita),
            parrocchiaId: this.parrocchiaManualeAttiva ? PARROCCHIA_MANUALE_ID : this.parrocchia.id,
            parrocchiaNome: this.parrocchiaNome,
            settoreId: this.parrocchiaManualeAttiva ? 0 : this.parrocchia.settoreId,
            settoreNome: this.settoreNome,
            diocesiId: this.parrocchiaManualeAttiva ? 1 : this.parrocchia.diocesiId,
            diocesiNome: this.diocesiNome
        });

        this.router.navigateByUrl('/gestionale-cn/dashboard', { replaceUrl: true });
    }
}
