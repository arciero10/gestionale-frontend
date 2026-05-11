import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { DIOCESI_MOCK, NUMERI_COMUNITA, PARROCCHIE_MOCK, SETTORI_MOCK, Parrocchia, creaNomeComunitaVisualizzato, generaNomeComunita } from '../data/anagrafica-ecclesiale.mock';
import { ComunitaFigliaAssociata, saveSelectedCommunity } from '../data/community-selection.storage';
import { Carisma, PermessoOperativo, getPermessiByCarismi, normalizeCarismaForPermissions } from '../data/permessi-carisma.mock';
import { TAPPE_CAMMINO, TappaCammino } from '../data/tappe-cammino.mock';

const PARROCCHIA_MANUALE_ID = -1;
type ModalitaOnboarding = 'guidata' | 'ricerca';
type RuoloComunitario = '' | 'responsabile' | 'corresponsabile' | 'catechista' | 'cantore' | 'presbitero' | 'diacono' | 'lettore' | 'ostiario' | 'didascalo';
type FeedbackType = 'success' | 'error' | null;

interface ValidationError {
    field: string;
    label: string;
    message: string;
}

interface OnboardingPayload {
    numeroComunita: number;
    nomeComunita: string;
    parrocchiaId: number;
    parrocchiaNome: string;
    settoreId: number;
    settoreNome: string;
    diocesiId: number;
    diocesiNome: string;
    parrocchiaManuale: boolean;
    statoVerifica: 'Verificata' | 'Da verificare' | 'Inserita manualmente';
    dataSelezione: string;
    comune: string;
    indirizzo: string;
    tappaCammino: TappaCammino;
    ruoloComunitario: RuoloComunitario;
    carismi: Carisma[];
    permessiOperativi: PermessoOperativo[];
    isCatechista: boolean | null;
    comunitaFiglieAssociate: ComunitaFigliaAssociata[];
    previewComunita: string;
}

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

                @if (feedbackMessage) {
                    <div class="onboarding-feedback" [class.success]="feedbackType === 'success'" [class.error]="feedbackType === 'error'">
                        {{ feedbackMessage }}
                    </div>
                }

                <div class="mode-switch" role="tablist" aria-label="Modalità scelta comunità">
                    <button type="button" [class.active]="modalita === 'guidata'" (click)="modalita = 'guidata'">Scelta guidata</button>
                    <button type="button" [class.active]="modalita === 'ricerca'" (click)="modalita = 'ricerca'">Cerca parrocchia</button>
                </div>

                <form class="community-form" (ngSubmit)="isPreview ? simulaConferma() : confermaComunita()">
                    @if (modalita === 'guidata') {
                        <div class="guided-grid">
                            <div class="field" [class.field-error]="hasFieldError('diocesi')" data-validation-field="diocesi">
                                <label for="diocesi">Diocesi</label>
                                <p-select inputId="diocesi" name="diocesi" appendTo="body" panelStyleClass="onboarding-dropdown-panel" [options]="diocesiOptions" optionLabel="nome" optionValue="id" [(ngModel)]="diocesiId" (ngModelChange)="onDiocesiChange()"></p-select>
                                @if (getFieldErrorMessage('diocesi')) {
                                    <small class="field-error-message">{{ getFieldErrorMessage('diocesi') }}</small>
                                }
                            </div>

                            <div class="field" [class.field-error]="hasFieldError('settore')" data-validation-field="settore">
                                <label for="settore">Settore</label>
                                <p-select inputId="settore" name="settore" appendTo="body" panelStyleClass="onboarding-dropdown-panel" [options]="settoriFiltrati" optionLabel="nome" optionValue="id" [(ngModel)]="settoreId" (ngModelChange)="onSettoreChange()"></p-select>
                                @if (getFieldErrorMessage('settore')) {
                                    <small class="field-error-message">{{ getFieldErrorMessage('settore') }}</small>
                                }
                            </div>

                            <div class="field form-full" [class.field-error]="hasFieldError('parrocchia')" data-validation-field="parrocchia">
                                <label for="parrocchiaGuidata">Parrocchia</label>
                                <p-select inputId="parrocchiaGuidata" name="parrocchiaGuidata" appendTo="body" panelStyleClass="onboarding-dropdown-panel" [options]="parrocchieGuidate" optionLabel="nome" optionValue="id" [(ngModel)]="parrocchiaId" (ngModelChange)="onParrocchiaGuidataChange()"></p-select>
                                @if (getFieldErrorMessage('parrocchia')) {
                                    <small class="field-error-message">{{ getFieldErrorMessage('parrocchia') }}</small>
                                }
                            </div>
                        </div>
                    } @else {
                        <div class="field" [class.field-error]="hasFieldError('parrocchia')" data-validation-field="parrocchia">
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
                            @if (getFieldErrorMessage('parrocchia')) {
                                <small class="field-error-message">{{ getFieldErrorMessage('parrocchia') }}</small>
                            }
                        </div>
                    }

                    @if (parrocchiaManualeAttiva) {
                        <section class="manual-box">
                            <div class="field" [class.field-error]="hasFieldError('parrocchia')" data-validation-field="parrocchia">
                                <label for="parrocchiaManuale">Nome parrocchia</label>
                                <input id="parrocchiaManuale" name="parrocchiaManuale" pInputText [(ngModel)]="parrocchiaManuale" required />
                                @if (getFieldErrorMessage('parrocchia')) {
                                    <small class="field-error-message">{{ getFieldErrorMessage('parrocchia') }}</small>
                                }
                            </div>

                            <div class="guided-grid">
                                <div class="field" [class.field-error]="hasFieldError('diocesi')" data-validation-field="diocesi">
                                    <label for="diocesiManuale">Diocesi</label>
                                    <p-select inputId="diocesiManuale" name="diocesiManuale" appendTo="body" panelStyleClass="onboarding-dropdown-panel" [options]="diocesiOptions" optionLabel="nome" optionValue="id" [(ngModel)]="diocesiManualeId"></p-select>
                                    @if (getFieldErrorMessage('diocesi')) {
                                        <small class="field-error-message">{{ getFieldErrorMessage('diocesi') }}</small>
                                    }
                                </div>

                                <div class="field" [class.field-error]="hasFieldError('settore')" data-validation-field="settore">
                                    <label for="settoreManuale">Settore</label>
                                    <p-select inputId="settoreManuale" name="settoreManuale" appendTo="body" panelStyleClass="onboarding-dropdown-panel" [options]="settoriManuali" [(ngModel)]="settoreManuale"></p-select>
                                    @if (getFieldErrorMessage('settore')) {
                                        <small class="field-error-message">{{ getFieldErrorMessage('settore') }}</small>
                                    }
                                </div>

                                <div class="field" [class.field-error]="hasFieldError('comune')" data-validation-field="comune">
                                    <label for="comuneManuale">Comune</label>
                                    <input id="comuneManuale" name="comuneManuale" pInputText [(ngModel)]="comuneManuale" required />
                                    @if (getFieldErrorMessage('comune')) {
                                        <small class="field-error-message">{{ getFieldErrorMessage('comune') }}</small>
                                    }
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
                                <span>Settore:&nbsp;</span>
                                <strong>{{ settoreNome || 'Da completare' }}</strong>
                            </div>
                            <div>
                                <span>Diocesi:&nbsp;</span>
                                <strong>{{ diocesiNome || 'Da completare' }}</strong>
                            </div>
                        </div>
                    }

                    <div class="field" [class.field-error]="hasFieldError('numeroComunita')" data-validation-field="numeroComunita">
                        <label for="numero">Numero comunità</label>
                        <p-select inputId="numero" name="numero" appendTo="body" panelStyleClass="onboarding-dropdown-panel" [options]="numeriComunita" [(ngModel)]="numeroComunita"></p-select>
                        @if (getFieldErrorMessage('numeroComunita')) {
                            <small class="field-error-message">{{ getFieldErrorMessage('numeroComunita') }}</small>
                        }
                    </div>

                    <div class="field" [class.field-error]="hasFieldError('tappaCammino')" data-validation-field="tappaCammino">
                        <label for="tappaCammino">Tappa del Cammino</label>
                        <p-select inputId="tappaCammino" name="tappaCammino" appendTo="body" panelStyleClass="onboarding-dropdown-panel" [options]="tappeCammino" [(ngModel)]="tappaCammino"></p-select>
                        @if (getFieldErrorMessage('tappaCammino')) {
                            <small class="field-error-message">{{ getFieldErrorMessage('tappaCammino') }}</small>
                        }
                    </div>

                    <section class="role-box">
                        <div class="field" [class.field-error]="hasFieldError('carisma')" data-validation-field="carisma">
                            <label for="ruoloComunitario">Carisma nella comunità</label>
                            <p-select
                                inputId="ruoloComunitario"
                                name="ruoloComunitario"
                                appendTo="body"
                                panelStyleClass="onboarding-dropdown-panel"
                                [options]="carismiOnboarding"
                                optionLabel="label"
                                optionValue="value"
                                [(ngModel)]="ruoloComunitario"
                            ></p-select>
                            @if (getFieldErrorMessage('carisma')) {
                                <small class="field-error-message">{{ getFieldErrorMessage('carisma') }}</small>
                            }
                        </div>

                    </section>

                    <section class="catechist-box" [class.field-error]="hasFieldError('isCatechista') || hasFieldError('comunitaFiglia')" data-validation-field="isCatechista">
                        <div class="catechist-head">
                            <div>
                                <strong>Sei catechista di qualche comunità?</strong>
                                <span>Serve per abilitare le convivenze con comunità figlie.</span>
                            </div>

                            <div class="yes-no">
                                <button type="button" [class.active]="isCatechista === true" (click)="setCatechista(true)">Sì</button>
                                <button type="button" [class.active]="isCatechista === false" (click)="setCatechista(false)">No</button>
                            </div>
                        </div>
                        @if (getFieldErrorMessage('isCatechista')) {
                            <small class="field-error-message">{{ getFieldErrorMessage('isCatechista') }}</small>
                        }

                        @if (isCatechista === true) {
                            <aside class="child-community-panel" data-validation-field="comunitaFiglia">
                                <h3>Comunità figlie associate</h3>
                                <p>Indica una o più comunità che segui come catechista. Potrai usarle nelle convivenze catechistiche.</p>

                                <div class="guided-grid">
                                    <div class="field form-full">
                                        <label for="parrocchiaFiglia">Parrocchia comunità figlia</label>
                                        <p-select inputId="parrocchiaFiglia" name="parrocchiaFiglia" appendTo="body" panelStyleClass="onboarding-dropdown-panel" [options]="parrocchieFiglieOptions" optionLabel="nome" optionValue="id" [(ngModel)]="parrocchiaFigliaId" (ngModelChange)="onParrocchiaFigliaChange()"></p-select>
                                    </div>

                                    <div class="field">
                                        <label for="numeroComunitaFiglia">Numero comunità figlia</label>
                                        <p-select inputId="numeroComunitaFiglia" name="numeroComunitaFiglia" appendTo="body" panelStyleClass="onboarding-dropdown-panel" [options]="numeriComunita" [(ngModel)]="numeroComunitaFiglia"></p-select>
                                    </div>
                                </div>

                                <div class="preview-box child-preview">
                                    <span>Anteprima comunità figlia</span>
                                    <strong>{{ previewComunitaFiglia }}</strong>
                                </div>

                                <button type="button" class="add-child-btn" (click)="aggiungiComunitaFiglia()">Aggiungi comunità figlia</button>

                                @if (comunitaFiglieAssociate.length > 0) {
                                    <ul class="child-list">
                                        @for (comunita of comunitaFiglieAssociate; track comunita.parrocchiaId + '-' + comunita.numeroComunita; let index = $index) {
                                            <li>
                                                <span>{{ comunita.numeroComunita }}ª Comunità – {{ comunita.parrocchiaNome }}</span>
                                                <button type="button" class="remove-child-btn" (click)="rimuoviComunitaFiglia(index)">Rimuovi</button>
                                            </li>
                                        }
                                    </ul>
                                }
                                @if (getFieldErrorMessage('comunitaFiglia')) {
                                    <small class="field-error-message">{{ getFieldErrorMessage('comunitaFiglia') }}</small>
                                }
                            </aside>
                        }
                    </section>

                    <div class="preview-box">
                        <span>Preview comunità</span>
                        <strong>{{ previewComunita }}</strong>
                        <small>Tappa: {{ tappaCammino }}</small>
                    </div>

                    <p class="note">Questa scelta potrà essere verificata dal responsabile della comunità.</p>

                    @if (isPreview) {
                        <button pButton type="button" label="Simula conferma" icon="pi pi-check" (click)="simulaConferma()"></button>
                    } @else {
                        <button pButton type="button" label="Conferma comunità" icon="pi pi-check" (click)="confermaComunita()"></button>
                    }
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
                position: relative;
                z-index: 1;
                width: min(100%, 760px);
                max-height: calc(100vh - 4rem);
                overflow: auto;
                display: grid;
                gap: 1.25rem;
                padding: clamp(1.25rem, 3vw, 2rem);
                border-radius: 20px;
                background: rgba(255, 255, 255, .94);
                border: 1px solid #e5e7eb;
                box-shadow: 0 18px 45px rgba(15, 23, 42, 0.1);
                backdrop-filter: blur(10px);
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
            .note,
            .field small {
                color: #475569;
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

            .community-form {
                display: grid;
                gap: 1rem;
            }

            .community-form button {
                pointer-events: auto;
            }

            .guided-grid {
                display: grid;
                grid-template-columns: repeat(2, minmax(0, 1fr));
                gap: .85rem;
            }

            .field,
            .manual-box,
            .preview-box {
                display: grid;
                gap: 0.4rem;
            }

            .form-full {
                grid-column: 1 / -1;
            }

            .field-error {
                border-radius: 14px;
                outline: 2px solid rgba(220, 38, 38, .75);
                outline-offset: 3px;
                background: rgba(254, 242, 242, .84);
            }

            .field.field-error {
                padding: .45rem;
            }

            .field-error-message {
                color: #991b1b !important;
                font-weight: 800;
                line-height: 1.4;
            }

            :host ::ng-deep .field-error .p-select,
            :host ::ng-deep .field-error .p-autocomplete,
            :host ::ng-deep .field-error .p-inputtext,
            .field-error input {
                border-color: #dc2626 !important;
                background: #fff1f2 !important;
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

            .onboarding-feedback {
                padding: 0.85rem 1rem;
                border-radius: 14px;
                font-weight: 800;
                line-height: 1.45;
                pointer-events: auto;
            }

            .onboarding-feedback.success {
                color: #166534;
                background: #dcfce7;
                border: 1px solid #bbf7d0;
            }

            .onboarding-feedback.error {
                color: #991b1b;
                background: #fee2e2;
                border: 1px solid #fecaca;
            }

            .role-box,
            .catechist-box {
                display: grid;
                gap: .85rem;
                padding: 1rem;
                border-radius: 16px;
                background: rgba(248, 250, 252, .92);
                border: 1px solid #e5e7eb;
            }

            .role-box {
                grid-template-columns: repeat(2, minmax(0, 1fr));
                background: rgba(255, 255, 255, .92);
                border-color: #dbeafe;
            }

            .ambiti-grid {
                display: grid;
                gap: .5rem;
                padding: .75rem;
                border-radius: 12px;
                background: #f8fafc;
                border: 1px solid #e5e7eb;
            }

            .ambiti-grid label {
                display: flex;
                align-items: center;
                gap: .5rem;
                color: #0f2440;
                font-weight: 700;
            }

            .catechist-head {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 1rem;
            }

            .catechist-head div:first-child {
                display: grid;
                gap: .2rem;
            }

            .catechist-head strong {
                color: #0f2440;
            }

            .catechist-head span {
                color: #64748b;
                font-size: .9rem;
            }

            .yes-no {
                display: inline-grid;
                grid-template-columns: repeat(2, minmax(0, 1fr));
                gap: .35rem;
                padding: .25rem;
                border-radius: 999px;
                background: #e2e8f0;
            }

            .yes-no button {
                min-width: 72px;
                min-height: 36px;
                border: 0;
                border-radius: 999px;
                background: transparent;
                color: #475569;
                font-weight: 900;
                cursor: pointer;
            }

            .yes-no button.active {
                background: #17335f;
                color: #fff;
                box-shadow: 0 8px 18px rgba(15, 23, 42, .16);
            }

            .child-community-panel {
                display: grid;
                gap: .85rem;
                padding: 1rem;
                border-radius: 16px;
                background: #fff;
                border: 1px solid #dbeafe;
                box-shadow: 0 12px 28px rgba(15, 23, 42, .08);
            }

            .child-community-panel h3 {
                margin: 0;
                color: #0f2440;
            }

            .child-community-panel p {
                margin: 0;
                color: #64748b;
            }

            .child-preview {
                background: #f0fdf4;
                border-color: #bbf7d0;
            }

            .add-child-btn {
                margin-top: .5rem;
                background: #17335f;
                color: #fff;
                border: none;
                border-radius: 8px;
                padding: .55rem 1.1rem;
                font-weight: 800;
                cursor: pointer;
                box-shadow: 0 2px 8px rgba(15, 23, 42, .08);
            }

            .add-child-btn:hover {
                background: #1e4a79;
            }

            .child-list {
                margin: .7rem 0 0;
                padding: 0;
                list-style: none;
                display: grid;
                gap: .35rem;
            }

            .child-list li {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: .75rem;
                background: #f0fdf4;
                border: 1px solid #bbf7d0;
                border-radius: 8px;
                padding: .45rem .8rem;
                font-size: .98rem;
            }

            .remove-child-btn {
                background: #fff0f0;
                color: #b91c1c;
                border: 1px solid #fecaca;
                border-radius: 6px;
                padding: .25rem .7rem;
                font-weight: 700;
                cursor: pointer;
                white-space: nowrap;
            }

            .remove-child-btn:hover {
                background: #fee2e2;
            }

            :host ::ng-deep .onboarding-dropdown-panel {
                z-index: 12000 !important;
            }

            @media (max-width: 767px) {
                .onboarding-page {
                    place-items: start stretch;
                }

                .guided-grid,
                .readonly-grid,
                .mode-switch,
                .role-box {
                    grid-template-columns: 1fr;
                    border-radius: 18px;
                }

                .catechist-head {
                    align-items: stretch;
                    flex-direction: column;
                }

                .yes-no {
                    width: 100%;
                }

                .child-list li {
                    align-items: stretch;
                    flex-direction: column;
                }
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
    readonly tappeCammino = [...TAPPE_CAMMINO];
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

    readonly carismiOnboarding: Array<{ label: string; value: RuoloComunitario }> = [
        { label: 'Nessun carisma', value: '' },
        { label: 'Responsabile', value: 'responsabile' },
        { label: 'Corresponsabile', value: 'corresponsabile' },
        { label: 'Catechista', value: 'catechista' },
        { label: 'Cantore', value: 'cantore' },
        { label: 'Presbitero', value: 'presbitero' },
        { label: 'Diacono', value: 'diacono' },
        { label: 'Lettore', value: 'lettore' },
        { label: 'Ostiario', value: 'ostiario' },
        { label: 'Didascalo/a', value: 'didascalo' }
    ];

    readonly collaborazioneOptions = [
        { label: 'No', value: false },
        { label: 'Sì', value: true }
    ];

    modalita: ModalitaOnboarding = 'guidata';
    diocesiId = 1;
    settoreId = 2;
    parrocchiaId = 24;
    parrocchiaSelezionata: Parrocchia = PARROCCHIE_MOCK.find((parrocchia) => parrocchia.id === 24) ?? PARROCCHIE_MOCK[0];
    parrocchieSuggerite: Parrocchia[] = [...PARROCCHIE_MOCK, this.parrocchiaManualeOption];
    numeroComunita = 3;
    tappaCammino: TappaCammino = 'Precatecumenato';
    parrocchiaManuale = '';
    diocesiManualeId = 1;
    settoreManuale = 'Da verificare';
    comuneManuale = '';
    indirizzoManuale = '';
    messaggio = '';
    feedbackMessage: string | null = null;
    feedbackType: FeedbackType = null;
    submitAttempted = false;
    validationErrors: ValidationError[] = [];

    ruoloComunitario: RuoloComunitario = '';

    isCatechista: boolean | null = null;
    parrocchiaFigliaId = 24;
    numeroComunitaFiglia = 3;
    comunitaFiglieAssociate: ComunitaFigliaAssociata[] = [];

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

    get parrocchieFiglieOptions() {
        return PARROCCHIE_MOCK.filter((parrocchia) => parrocchia.id !== PARROCCHIA_MANUALE_ID);
    }

    get parrocchiaFiglia() {
        return PARROCCHIE_MOCK.find((parrocchia) => parrocchia.id === this.parrocchiaFigliaId) ?? this.parrocchieFiglieOptions[0];
    }

    get settoreFigliaNome() {
        return SETTORI_MOCK.find((settore) => settore.id === this.parrocchiaFiglia?.settoreId)?.nome ?? '';
    }

    get diocesiFigliaNome() {
        return DIOCESI_MOCK.find((diocesi) => diocesi.id === this.parrocchiaFiglia?.diocesiId)?.nome ?? '';
    }

    get previewComunitaFiglia() {
        const parrocchia = this.parrocchiaFiglia;
        const nome = parrocchia?.nome ?? 'Parrocchia da selezionare';
        return this.settoreFigliaNome ? creaNomeComunitaVisualizzato(this.numeroComunitaFiglia, nome, this.settoreFigliaNome) : `${generaNomeComunita(this.numeroComunitaFiglia)} – ${nome}`;
    }

    setCatechista(value: boolean) {
        this.isCatechista = value;
        this.messaggio = '';

        if (value) {
            this.ruoloComunitario = 'catechista';
            this.feedbackMessage = null;
            this.feedbackType = null;
        }
        this.validationErrors = this.validationErrors.filter((error) => error.field !== 'isCatechista' && error.field !== 'comunitaFiglia');

        if (!value) {
            this.parrocchiaFigliaId = 24;
            this.numeroComunitaFiglia = 3;
            this.comunitaFiglieAssociate = [];
        }
    }

    aggiungiComunitaFiglia() {
        const parrocchia = this.parrocchiaFiglia;

        if (!parrocchia || !this.numeroComunitaFiglia) {
            return;
        }

        const nuova: ComunitaFigliaAssociata = {
            numeroComunita: this.numeroComunitaFiglia,
            nomeComunita: generaNomeComunita(this.numeroComunitaFiglia),
            parrocchiaId: parrocchia.id,
            parrocchiaNome: parrocchia.nome,
            settoreId: parrocchia.settoreId,
            settoreNome: this.settoreFigliaNome,
            diocesiId: parrocchia.diocesiId,
            diocesiNome: this.diocesiFigliaNome,
            parrocchiaManuale: false
        };

        const giaPresente = this.comunitaFiglieAssociate.some((comunita) =>
            comunita.numeroComunita === nuova.numeroComunita &&
            comunita.parrocchiaId === nuova.parrocchiaId
        );

        if (giaPresente) {
            this.messaggio = 'Questa comunità figlia è già stata aggiunta';
            return;
        }

        this.comunitaFiglieAssociate = [...this.comunitaFiglieAssociate, nuova];
        this.validationErrors = this.validationErrors.filter((error) => error.field !== 'comunitaFiglia');
        this.messaggio = '';
    }

    rimuoviComunitaFiglia(index: number) {
        this.comunitaFiglieAssociate = this.comunitaFiglieAssociate.filter((_, currentIndex) => currentIndex !== index);
    }

    onParrocchiaFigliaChange() {
        const parrocchia = this.parrocchiaFiglia;
        if (!parrocchia) {
            this.parrocchiaFigliaId = this.parrocchieFiglieOptions[0]?.id ?? 24;
        }
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

    simulaConferma(): void {
        this.submitAttempted = true;

        const payload = this.buildOnboardingPayload();
        const validationErrors = this.validateOnboardingPayload(payload);
        this.validationErrors = validationErrors;

        if (validationErrors.length > 0) {
            this.feedbackMessage = this.buildValidationFeedback(validationErrors);
            this.feedbackType = 'error';
            this.messaggio = '';
            this.scrollToFirstError();
            return;
        }

        localStorage.setItem('onboarding_comunita_payload', JSON.stringify(payload));
        localStorage.setItem('onboarding_comunita_completed', 'true');
        this.validationErrors = [];

        this.feedbackMessage = 'Conferma simulata correttamente. La comunità è stata salvata localmente.';
        this.feedbackType = 'success';
        this.messaggio = '';

        window.setTimeout(() => {
            this.router.navigate(['/gestionale-cn/dashboard']);
        }, 600);
    }

    confermaComunita(): void {
        this.submitAttempted = true;

        const payload = this.buildOnboardingPayload();
        const errors = this.validateOnboardingPayload(payload);
        this.validationErrors = errors;

        if (errors.length) {
            this.feedbackType = 'error';
            this.feedbackMessage = this.buildValidationFeedback(errors);
            this.messaggio = '';
            this.scrollToFirstError();
            return;
        }

        localStorage.setItem('onboarding_comunita_payload', JSON.stringify(payload));
        localStorage.setItem('onboarding_comunita_completed', 'true');
        this.validationErrors = [];

        saveSelectedCommunity({
            communitySelected: true,
            numeroComunita: payload.numeroComunita,
            nomeComunita: payload.nomeComunita,
            parrocchiaId: payload.parrocchiaId,
            parrocchiaNome: payload.parrocchiaNome,
            settoreId: payload.settoreId,
            settoreNome: payload.settoreNome,
            diocesiId: payload.diocesiId,
            diocesiNome: payload.diocesiNome,
            parrocchiaManuale: payload.parrocchiaManuale,
            statoVerifica: payload.statoVerifica,
            dataSelezione: payload.dataSelezione,
            comune: payload.comune,
            indirizzo: payload.indirizzo,
            tappaCammino: payload.tappaCammino,
            isCatechista: payload.isCatechista === true,
            comunitaFiglieAssociate: payload.comunitaFiglieAssociate
        });

        localStorage.setItem('onboardingUserProfile', JSON.stringify({
            ruoloComunitario: payload.ruoloComunitario,
            carismi: payload.carismi,
            collaboraOrganizzazione: false,
            ambitiOperativi: [],
            permessiOperativi: payload.permessiOperativi,
            isCatechista: payload.isCatechista === true,
            communityPreview: payload.previewComunita,
            savedAt: payload.dataSelezione
        }));

        localStorage.setItem('onboardingCompleted', 'true');

        this.feedbackType = 'success';
        this.feedbackMessage = 'Comunità confermata correttamente.';
        this.messaggio = '';

        window.setTimeout(() => {
            this.router.navigate(['/gestionale-cn/dashboard']);
        }, 600);
    }

    private buildOnboardingPayload(): OnboardingPayload {
        const carismi = this.getCarismiSelezionati();

        return {
            numeroComunita: this.numeroComunita,
            nomeComunita: generaNomeComunita(this.numeroComunita),
            parrocchiaId: this.parrocchiaManualeAttiva ? PARROCCHIA_MANUALE_ID : this.parrocchia.id,
            parrocchiaNome: this.parrocchiaNome,
            settoreId: this.parrocchiaManualeAttiva ? 7 : this.parrocchia.settoreId,
            settoreNome: this.settoreNome,
            diocesiId: this.parrocchiaManualeAttiva ? this.diocesiManualeId : this.parrocchia.diocesiId,
            diocesiNome: this.diocesiNome,
            parrocchiaManuale: this.parrocchiaManualeAttiva,
            statoVerifica: this.parrocchiaManualeAttiva ? 'Inserita manualmente' : this.parrocchia.statoVerifica,
            dataSelezione: new Date().toISOString(),
            comune: this.parrocchiaManualeAttiva ? this.comuneManuale.trim() : this.parrocchia.comune,
            indirizzo: this.parrocchiaManualeAttiva ? this.indirizzoManuale.trim() : this.parrocchia.indirizzo,
            tappaCammino: this.tappaCammino,
            ruoloComunitario: this.ruoloComunitario,
            carismi,
            permessiOperativi: getPermessiByCarismi(carismi),
            isCatechista: this.isCatechista,
            comunitaFiglieAssociate: this.isCatechista === true ? this.comunitaFiglieAssociate : [],
            previewComunita: this.previewComunita
        };
    }

    hasFieldError(field: string): boolean {
        return this.validationErrors.some((error) => error.field === field);
    }

    getFieldErrorMessage(field: string): string {
        return this.validationErrors.find((error) => error.field === field)?.message ?? '';
    }

    private validateOnboardingPayload(payload: OnboardingPayload): ValidationError[] {
        const errors: ValidationError[] = [];

        if (!payload.diocesiNome.trim()) {
            errors.push({
                field: 'diocesi',
                label: 'Diocesi',
                message: 'Seleziona la diocesi.'
            });
        }

        if (!payload.settoreNome.trim()) {
            errors.push({
                field: 'settore',
                label: 'Settore',
                message: 'Seleziona il settore.'
            });
        }

        if (!payload.parrocchiaNome.trim()) {
            errors.push({
                field: 'parrocchia',
                label: 'Parrocchia',
                message: 'Seleziona o inserisci la parrocchia.'
            });
        }

        if (!payload.numeroComunita) {
            errors.push({
                field: 'numeroComunita',
                label: 'Numero comunità',
                message: 'Seleziona il numero della comunità.'
            });
        }

        if (!payload.tappaCammino) {
            errors.push({
                field: 'tappaCammino',
                label: 'Tappa del Cammino',
                message: 'Seleziona la tappa del Cammino.'
            });
        }

        if (payload.parrocchiaManuale && !payload.comune.trim()) {
            errors.push({
                field: 'comune',
                label: 'Comune',
                message: 'Inserisci il comune della parrocchia.'
            });
        }

        if (payload.isCatechista === null) {
            errors.push({
                field: 'isCatechista',
                label: 'Sei catechista di qualche comunità?',
                message: 'Indica se sei catechista di qualche comunità.'
            });
        }

        if (payload.isCatechista === true && payload.comunitaFiglieAssociate.length === 0) {
            errors.push({
                field: 'comunitaFiglia',
                label: 'Comunità figlia associata',
                message: 'Aggiungi almeno una comunità figlia associata.'
            });
        }

        return errors;
    }

    private buildValidationFeedback(errors: ValidationError[]): string {
        const labels = errors.map((error) => error.label);
        return labels.length === 1
            ? `Controlla il campo: ${labels[0]}`
            : `Controlla i campi: ${labels.join(', ')}`;
    }

    private scrollToFirstError(): void {
        window.setTimeout(() => {
            const firstError = this.validationErrors[0];
            const target = firstError
                ? document.querySelector<HTMLElement>(`[data-validation-field="${firstError.field}"]`)
                : document.querySelector<HTMLElement>('.field-error');

            target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
    }

    private getCarismiSelezionati(): Carisma[] {
        const carismi = new Set<Carisma>();
        carismi.add(normalizeCarismaForPermissions(this.ruoloComunitario));

        if (this.isCatechista === true) {
            carismi.add('catechista');
        }

        return Array.from(carismi);
    }

    conferma() {
        if (this.isPreview) {
            this.simulaConferma();
            return;
        }

        this.confermaComunita();
    }
}
