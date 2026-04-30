import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { DIOCESI_MOCK, NUMERI_COMUNITA, PARROCCHIE_MOCK, SETTORI_MOCK, Parrocchia, creaNomeComunitaVisualizzato, generaNomeComunita } from '../data/anagrafica-ecclesiale.mock';
import { saveSelectedCommunity } from '../data/community-selection.storage';

const PARROCCHIA_MANUALE_ID = -1;
type ModalitaOnboarding = 'guidata' | 'ricerca';

@Component({
    selector: 'app-onboarding-comunita',
    standalone: true,
    imports: [CommonModule, FormsModule, AutoCompleteModule, ButtonModule, InputTextModule, SelectModule],
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

                <div class="mode-switch" role="tablist" aria-label="Modalità scelta comunità">
                    <button type="button" [class.active]="modalita === 'guidata'" (click)="modalita = 'guidata'">Scelta guidata</button>
                    <button type="button" [class.active]="modalita === 'ricerca'" (click)="modalita = 'ricerca'">Cerca parrocchia</button>
                </div>

                <form class="community-form" (ngSubmit)="conferma()">
                    @if (modalita === 'guidata') {
                        <div class="guided-grid">
                            <div class="field">
                                <label for="diocesi">Diocesi</label>
                                <p-select inputId="diocesi" name="diocesi" appendTo="body" panelStyleClass="onboarding-dropdown-panel" [options]="diocesiOptions" optionLabel="nome" optionValue="id" [(ngModel)]="diocesiId" (ngModelChange)="onDiocesiChange()"></p-select>
                            </div>
                            <div class="field">
                                <label for="settore">Settore</label>
                                <p-select inputId="settore" name="settore" appendTo="body" panelStyleClass="onboarding-dropdown-panel" [options]="settoriFiltrati" optionLabel="nome" optionValue="id" [(ngModel)]="settoreId" (ngModelChange)="onSettoreChange()"></p-select>
                            </div>
                            <div class="field form-full">
                                <label for="parrocchiaGuidata">Parrocchia</label>
                                <p-select inputId="parrocchiaGuidata" name="parrocchiaGuidata" appendTo="body" panelStyleClass="onboarding-dropdown-panel" [options]="parrocchieGuidate" optionLabel="nome" optionValue="id" [(ngModel)]="parrocchiaId" (ngModelChange)="onParrocchiaGuidataChange()"></p-select>
                            </div>
                        </div>
                    } @else {
                        <div class="field">
                            <label for="parrocchiaRicerca">Cerca parrocchia</label>
                            <p-autocomplete
                                inputId="parrocchiaRicerca"
                                name="parrocchiaRicerca"
                                appendTo="body"
                                panelStyleClass="onboarding-dropdown-panel"
                                [suggestions]="parrocchieSuggerite"
                                optionLabel="nome"
                                [dropdown]="true"
                                [forceSelection]="true"
                                [(ngModel)]="parrocchiaSelezionata"
                                (completeMethod)="cercaParrocchie($event)"
                                (onSelect)="selezionaParrocchiaDaRicerca($event.value)"
                            ></p-autocomplete>
                            <small>Cerca per nome, comune o indirizzo.</small>
                        </div>
                    }

                    @if (parrocchiaManualeAttiva) {
                        <section class="manual-box">
                            <div class="field">
                                <label for="parrocchiaManuale">Nome parrocchia</label>
                                <input id="parrocchiaManuale" name="parrocchiaManuale" pInputText [(ngModel)]="parrocchiaManuale" required />
                            </div>
                            <div class="guided-grid">
                                <div class="field">
                                    <label for="diocesiManuale">Diocesi</label>
                                    <p-select inputId="diocesiManuale" name="diocesiManuale" appendTo="body" panelStyleClass="onboarding-dropdown-panel" [options]="diocesiOptions" optionLabel="nome" optionValue="id" [(ngModel)]="diocesiManualeId"></p-select>
                                </div>
                                <div class="field">
                                    <label for="settoreManuale">Settore</label>
                                    <p-select inputId="settoreManuale" name="settoreManuale" appendTo="body" panelStyleClass="onboarding-dropdown-panel" [options]="settoriManuali" [(ngModel)]="settoreManuale"></p-select>
                                </div>
                                <div class="field">
                                    <label for="comuneManuale">Comune</label>
                                    <input id="comuneManuale" name="comuneManuale" pInputText [(ngModel)]="comuneManuale" required />
                                </div>
                                <div class="field">
                                    <label for="indirizzoManuale">Indirizzo facoltativo</label>
                                    <input id="indirizzoManuale" name="indirizzoManuale" pInputText [(ngModel)]="indirizzoManuale" />
                                </div>
                            </div>
                            <p class="note">Se la parrocchia non è presente, sarà verificata dal responsabile.</p>
                        </section>
                    } @else {
                        <div class="readonly-grid">
                            <div>
                                <span>Settore:</span>
                                <strong>{{ settoreNome || 'Da completare' }}</strong>
                            </div>
                            <div>
                                <span>Diocesi:</span>
                                <strong>{{ diocesiNome || 'Da completare' }}</strong>
                            </div>
                        </div>
                    }

                    <div class="field">
                        <label for="numero">Numero comunità</label>
                        <p-select inputId="numero" name="numero" appendTo="body" panelStyleClass="onboarding-dropdown-panel" [options]="numeriComunita" [(ngModel)]="numeroComunita"></p-select>
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
            :host { display: block; }
            .onboarding-page {
                min-height: calc(100vh - 4rem);
                display: grid;
                place-items: center;
                padding: clamp(1rem, 3vw, 2rem);
                background: transparent;
            }
            .onboarding-card {
                width: min(100%, 760px);
                display: grid;
                gap: 1.25rem;
                padding: clamp(1.25rem, 3vw, 2rem);
                border-radius: 20px;
                background: #fff;
                border: 1px solid #e5e7eb;
                box-shadow: 0 18px 45px rgba(15, 23, 42, 0.1);
            }
            .page-intro { display: grid; gap: 0.45rem; text-align: center; }
            .page-intro h1,
            .page-intro p { margin: 0; }
            .page-intro h1 { color: #0f2440; font-size: clamp(1.65rem, 3vw, 2.3rem); }
            .page-intro p,
            .page-intro small,
            .note,
            .field small { color: #64748b; line-height: 1.5; }
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
            .mode-switch {
                display: grid;
                grid-template-columns: repeat(2, minmax(0, 1fr));
                gap: .5rem;
                padding: .35rem;
                border-radius: 999px;
                background: #f1f5f9;
            }
            .mode-switch button {
                min-height: 42px;
                border: 0;
                border-radius: 999px;
                background: transparent;
                color: #475569;
                font-weight: 850;
                cursor: pointer;
            }
            .mode-switch button.active {
                background: #17335f;
                color: #fff;
                box-shadow: 0 10px 22px rgba(15, 23, 42, .14);
            }
            .community-form { display: grid; gap: 1rem; }
            .guided-grid {
                display: grid;
                grid-template-columns: repeat(2, minmax(0, 1fr));
                gap: .85rem;
            }
            .field,
            .manual-box,
            .preview-box { display: grid; gap: 0.4rem; }
            .form-full { grid-column: 1 / -1; }
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
            .preview-box strong {
                color: #0f2440;
                font-size: 1rem;
            }
            .preview-box { background: #eff6ff; border-color: #bfdbfe; }
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
            :host ::ng-deep .onboarding-dropdown-panel { z-index: 12000 !important; }
            @media (max-width: 767px) {
                .onboarding-page { place-items: start stretch; }
                .guided-grid,
                .readonly-grid,
                .mode-switch { grid-template-columns: 1fr; border-radius: 18px; }
            }
        `
    ]
})
export class OnboardingComunita {
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);

    readonly isPreview = this.route.snapshot.data['preview'] === true;
    readonly diocesiOptions = DIOCESI_MOCK;
    readonly numeriComunita = NUMERI_COMUNITA;
    readonly settoriManuali = ['Nord', 'Sud', 'Est', 'Ovest', 'Centro', 'Da verificare', 'Non applicabile'];
    readonly parrocchiaManualeOption: Parrocchia = {
        id: PARROCCHIA_MANUALE_ID,
        nome: 'Parrocchia non presente in elenco',
        diocesiId: 1,
        settoreId: 7,
        note: '',
        nomeNormalizzato: 'parrocchia non presente in elenco',
        diocesiNome: 'Diocesi di Roma',
        settoreNome: 'Da verificare',
        provincia: '',
        comune: '',
        indirizzo: '',
        fonte: 'Inserita utente',
        statoVerifica: 'Inserita manualmente'
    };

    modalita: ModalitaOnboarding = 'guidata';
    diocesiId = 1;
    settoreId = 2;
    parrocchiaId = 24;
    parrocchiaSelezionata: Parrocchia = PARROCCHIE_MOCK.find((parrocchia) => parrocchia.id === 24) ?? PARROCCHIE_MOCK[0];
    parrocchieSuggerite: Parrocchia[] = [...PARROCCHIE_MOCK, this.parrocchiaManualeOption];
    numeroComunita = 3;
    parrocchiaManuale = '';
    diocesiManualeId = 1;
    settoreManuale = 'Da verificare';
    comuneManuale = '';
    indirizzoManuale = '';
    messaggio = '';

    get settoriFiltrati() {
        return SETTORI_MOCK.filter((settore) => settore.diocesiId === this.diocesiId);
    }

    get parrocchieGuidate() {
        return [...PARROCCHIE_MOCK.filter((parrocchia) => parrocchia.diocesiId === this.diocesiId && parrocchia.settoreId === this.settoreId), this.parrocchiaManualeOption];
    }

    get parrocchiaManualeAttiva() {
        return this.parrocchiaId === PARROCCHIA_MANUALE_ID || this.parrocchiaSelezionata?.id === PARROCCHIA_MANUALE_ID;
    }

    get parrocchia() {
        return PARROCCHIE_MOCK.find((parrocchia) => parrocchia.id === this.parrocchiaId) ?? this.parrocchiaSelezionata ?? PARROCCHIE_MOCK[0];
    }

    get settoreNome() {
        if (this.parrocchiaManualeAttiva) {
            return this.settoreManuale.trim();
        }

        return SETTORI_MOCK.find((settore) => settore.id === this.parrocchia.settoreId)?.nome ?? '';
    }

    get diocesiNome() {
        if (this.parrocchiaManualeAttiva) {
            return DIOCESI_MOCK.find((diocesi) => diocesi.id === this.diocesiManualeId)?.nome ?? '';
        }

        return DIOCESI_MOCK.find((diocesi) => diocesi.id === this.parrocchia.diocesiId)?.nome ?? '';
    }

    get parrocchiaNome() {
        return this.parrocchiaManualeAttiva ? this.parrocchiaManuale.trim() : this.parrocchia.nome;
    }

    get previewComunita() {
        const nome = this.parrocchiaNome || 'Parrocchia da inserire';
        return this.settoreNome ? creaNomeComunitaVisualizzato(this.numeroComunita, nome, this.settoreNome) : `${generaNomeComunita(this.numeroComunita)} – ${nome}`;
    }

    onDiocesiChange() {
        const primoSettore = this.settoriFiltrati[0];
        this.settoreId = primoSettore?.id ?? 7;
        this.onSettoreChange();
    }

    onSettoreChange() {
        const primaParrocchia = this.parrocchieGuidate.find((parrocchia) => parrocchia.id !== PARROCCHIA_MANUALE_ID);
        this.parrocchiaId = primaParrocchia?.id ?? PARROCCHIA_MANUALE_ID;
        this.onParrocchiaGuidataChange();
    }

    onParrocchiaGuidataChange() {
        const selected = this.parrocchieGuidate.find((parrocchia) => parrocchia.id === this.parrocchiaId);
        this.parrocchiaSelezionata = selected ?? this.parrocchiaManualeOption;
    }

    cercaParrocchie(event: { query: string }) {
        const query = event.query.trim().toLowerCase();
        const risultati = query
            ? PARROCCHIE_MOCK.filter((parrocchia) => `${parrocchia.nome} ${parrocchia.comune} ${parrocchia.indirizzo}`.toLowerCase().includes(query))
            : [...PARROCCHIE_MOCK];
        this.parrocchieSuggerite = [...risultati, this.parrocchiaManualeOption];
    }

    selezionaParrocchiaDaRicerca(parrocchia: Parrocchia) {
        this.parrocchiaSelezionata = parrocchia;
        this.parrocchiaId = parrocchia.id;
        if (parrocchia.id !== PARROCCHIA_MANUALE_ID) {
            this.diocesiId = parrocchia.diocesiId;
            this.settoreId = parrocchia.settoreId;
        }
    }

    conferma() {
        if (this.parrocchiaManualeAttiva && !this.parrocchiaNome) {
            this.messaggio = 'Inserisci il nome della parrocchia';
            return;
        }

        if (this.parrocchiaManualeAttiva && !this.comuneManuale.trim()) {
            this.messaggio = 'Inserisci il comune della parrocchia';
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
            settoreId: this.parrocchiaManualeAttiva ? 7 : this.parrocchia.settoreId,
            settoreNome: this.settoreNome,
            diocesiId: this.parrocchiaManualeAttiva ? this.diocesiManualeId : this.parrocchia.diocesiId,
            diocesiNome: this.diocesiNome
        });

        this.router.navigateByUrl('/gestionale-cn/dashboard', { replaceUrl: true });
    }
}
