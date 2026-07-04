import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import {
    CategoriaFotoStruttura,
    FotoStrutturaMock,
    PromoStrutturaMock,
    STRUTTURA_PROFILE_DEFAULT,
    StrutturaProfileMock,
    activePromo,
    fotoCopertina,
    markStrutturaAccess,
    normalizeStrutturaProfile,
    readProfileStatus,
    readStrutturaProfile,
    saveStrutturaProfile,
    statusLabelStruttura
} from './struttura-profile.storage';

const structurePageStyles = `
    .structure-entry {
        min-height: 100vh;
        display: grid;
        align-items: start;
        padding: clamp(1rem, 4vw, 3rem);
        background:
            linear-gradient(rgba(15, 23, 42, .48), rgba(15, 23, 42, .62)),
            url('/images/backgrounds/posti-convivenza-bg.jpg') center center / cover no-repeat fixed;
        color: #0f172a;
    }
    .entry-card,
    .editor-card {
        width: min(100%, 76rem);
        margin: 0 auto;
        padding: clamp(1.1rem, 3vw, 2rem);
        border: 1px solid rgba(255,255,255,.5);
        border-radius: 24px;
        background: rgba(255,255,255,.96);
        box-shadow: 0 24px 60px rgba(15,23,42,.25);
        backdrop-filter: blur(12px);
    }
    .entry-card { max-width: 42rem; align-self: center; display: grid; gap: 1rem; }
    header { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; }
    header span,
    .entry-card span,
    .eyebrow { color: #1d4ed8; font-size: .78rem; font-weight: 900; text-transform: uppercase; letter-spacing: .04em; }
    h1 { margin: .25rem 0 .45rem; color: #0f172a; font-size: clamp(1.8rem, 4vw, 3rem); line-height: 1.05; }
    h2, h3 { margin: .2rem 0 .35rem; color: #0f172a; }
    p { margin: 0; color: #334155; line-height: 1.55; font-weight: 650; }
    .actions,
    footer { display: flex; flex-wrap: wrap; gap: .75rem; margin-top: 1rem; justify-content: flex-end; }
    .back-row { display: flex; justify-content: flex-start; margin-bottom: 1rem; }
    .back-row a { min-height: 40px; }
    .hero-profile { display: grid; grid-template-columns: minmax(18rem, 28rem) 1fr; gap: 1rem; margin-top: 1rem; }
    .hero-profile img,
    .photo-card img,
    .preview-modal img { width: 100%; aspect-ratio: 16/9; object-fit: cover; border-radius: 18px; background: #e2e8f0; }
    .cover-placeholder,
    .upload-preview {
        display: grid;
        place-items: center;
        min-height: 12rem;
        border: 1px dashed #cbd5e1;
        border-radius: 18px;
        background: #f8fafc;
        color: #475569;
        font-weight: 850;
        text-align: center;
    }
    .upload-preview img { width: 100%; aspect-ratio: 16/9; object-fit: cover; border-radius: 16px; }
    .file-input { min-height: 44px; padding: .75rem; border: 1px solid #cbd5e1; border-radius: 12px; background: #fff; }
    .metrics,
    .dashboard-cards,
    .photo-grid,
    .promo-list { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: .85rem; margin-top: 1rem; }
    .metric,
    .dashboard-card,
    .photo-card,
    .promo-card,
    .status-box {
        border: 1px solid #e2e8f0;
        border-radius: 16px;
        background: #fff;
        box-shadow: 0 12px 26px rgba(15,23,42,.08);
        padding: 1rem;
    }
    .metric span,
    dt { color: #475569; font-size: .78rem; font-weight: 850; text-transform: uppercase; }
    .metric strong,
    dd { color: #0f172a; font-weight: 900; }
    .dashboard-card { display: grid; gap: .5rem; min-height: 10rem; color: #0f172a; text-decoration: none; }
    .dashboard-card i { color: #1d4ed8; font-size: 1.35rem; }
    .dashboard-card small { width: fit-content; padding: .25rem .5rem; border-radius: 999px; background: #eff6ff; color: #1e40af; font-weight: 850; }
    .form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .9rem; margin-top: 1rem; }
    label { display: grid; gap: .4rem; color: #1e293b; font-weight: 850; }
    input, textarea, p-select { width: 100%; }
    .span-2 { grid-column: span 2; }
    .checks { display: flex; flex-wrap: wrap; gap: .85rem; padding: .9rem; border-radius: 14px; background: #f8fafc; border: 1px solid #e2e8f0; }
    .checks label { display: flex; align-items: center; gap: .45rem; }
    .message,
    .status-box { margin-top: 1rem; }
    .status-box.info { background: #eff6ff; border-color: #bfdbfe; color: #1e3a8a; }
    .status-box.success { background: #ecfdf5; border-color: #bbf7d0; color: #065f46; }
    .status-box.danger { background: #fef2f2; border-color: #fecaca; color: #991b1b; }
    .status-box.warn { background: #fffbeb; border-color: #fde68a; color: #92400e; }
    dl { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .75rem; margin: 0; }
    dl div { padding: .85rem; border: 1px solid #e2e8f0; border-radius: 14px; background: #fff; }
    dd { margin: .2rem 0 0; overflow-wrap: anywhere; }
    .photo-card,
    .promo-card { display: grid; gap: .55rem; }
    .photo-actions { display: flex; flex-wrap: wrap; gap: .4rem; }
    .photo-actions button { min-height: 34px; }
    .badge { width: fit-content; padding: .28rem .55rem; border-radius: 999px; background: #dbeafe; color: #1e40af; font-size: .75rem; font-weight: 900; }
    .empty-state { padding: 1rem; border: 1px dashed #cbd5e1; border-radius: 14px; color: #475569; background: #f8fafc; text-align: center; }
    .preview-modal { position: fixed; inset: 0; z-index: 50; display: grid; place-items: center; padding: 1rem; background: rgba(15,23,42,.62); }
    .preview-modal article { width: min(56rem, 100%); display: grid; gap: .75rem; padding: 1rem; border-radius: 20px; background: #fff; box-shadow: 0 28px 70px rgba(0,0,0,.28); }
    @media (max-width: 980px) {
        .hero-profile,
        .metrics,
        .dashboard-cards,
        .photo-grid,
        .promo-list { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
    @media (max-width: 720px) {
        header,
        .hero-profile,
        .metrics,
        .dashboard-cards,
        .photo-grid,
        .promo-list,
        .form-grid,
        dl { grid-template-columns: 1fr; flex-direction: column; }
        .span-2 { grid-column: span 1; }
        .structure-entry { background-attachment: scroll; }
        footer a,
        footer button,
        .actions a,
        .actions button { width: 100%; justify-content: center; }
    }
`;

@Component({
    selector: 'app-area-strutture-home',
    standalone: true,
    imports: [CommonModule, RouterLink, ButtonModule],
    template: `
        <main class="structure-entry">
            <section class="entry-card">
                <span>Ingresso strutture</span>
                <h1>Area Strutture</h1>
                <p>Accredita o gestisci la tua struttura per ricevere richieste di disponibilità per convivenze, incontri e pellegrinaggi.</p>
                <div class="actions">
                    <a pButton routerLink="/area-strutture/accreditamento" label="Accredita la tua struttura" icon="pi pi-building"></a>
                    <a pButton routerLink="/area-strutture/accesso" label="Accedi come struttura" icon="pi pi-sign-in" outlined></a>
                </div>
            </section>
        </main>
    `,
    styles: [structurePageStyles]
})
export class AreaStruttureHome {}

@Component({
    selector: 'app-area-strutture-accesso',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink, ButtonModule, InputTextModule],
    template: `
        <main class="structure-entry">
            <section class="entry-card">
                <div class="back-row">
                    <a pButton routerLink="/area-strutture" label="Indietro" icon="pi pi-arrow-left" severity="secondary" outlined></a>
                </div>
                <span>Accesso simulato</span>
                <h1>Accesso struttura</h1>
                <p>Inserisci l'email del referente della struttura. In produzione riceverai un codice temporaneo via email. Per ora l'accesso e simulato in ambiente di test.</p>
                <label>
                    <span>Email referente</span>
                    <input pInputText type="email" [(ngModel)]="email" placeholder="referente@struttura.it" />
                </label>
                @if (message) {
                    <div class="status-box" [ngClass]="messageType">{{ message }}</div>
                }
                @if (showAccredita) {
                    <div class="actions">
                        <a pButton routerLink="/area-strutture/accreditamento" label="Accredita la struttura" icon="pi pi-building"></a>
                    </div>
                }
                <footer>
                    <a pButton routerLink="/area-strutture" label="Torna indietro" severity="secondary" outlined></a>
                    <button pButton type="button" label="Continua" icon="pi pi-arrow-right" (click)="continua()"></button>
                </footer>
            </section>
        </main>
    `,
    styles: [structurePageStyles]
})
export class AreaStruttureAccesso {
    private readonly router = inject(Router);
    email = '';
    message = '';
    messageType: 'info' | 'success' | 'danger' = 'info';
    showAccredita = false;

    continua() {
        const normalizedEmail = this.email.trim().toLowerCase();
        if (!normalizedEmail) {
            this.message = 'Inserisci l email del referente.';
            this.messageType = 'danger';
            this.showAccredita = false;
            return;
        }

        const profile = readStrutturaProfile();
        if (profile?.email?.trim().toLowerCase() === normalizedEmail) {
            // Produzione: accesso tramite Microsoft Entra External ID OTP/passwordless.
            markStrutturaAccess(profile);
            this.message = 'Profilo struttura trovato. Accesso simulato effettuato.';
            this.messageType = 'success';
            this.showAccredita = false;
            setTimeout(() => void this.router.navigateByUrl('/area-strutture/dashboard'), 350);
            return;
        }

        this.message = 'Nessun profilo struttura trovato per questa email. Puoi procedere con l accreditamento.';
        this.messageType = 'info';
        this.showAccredita = true;
    }
}

@Component({
    selector: 'app-area-strutture-dashboard',
    standalone: true,
    imports: [CommonModule, RouterLink, ButtonModule, TagModule],
    template: `
        <main class="structure-entry">
            <section class="editor-card">
                <div class="back-row">
                    <a pButton routerLink="/area-strutture" label="Indietro" icon="pi pi-arrow-left" severity="secondary" outlined></a>
                </div>
                @if (!profile) {
                    <header>
                        <div>
                            <span>Area Strutture</span>
                            <h1>Dashboard struttura</h1>
                            <p>Nessuna struttura accreditata su questo dispositivo.</p>
                        </div>
                    </header>
                    <div class="status-box info">
                        <strong>Nessuna struttura accreditata su questo dispositivo</strong>
                        <p>Avvia l'accreditamento per creare la scheda struttura.</p>
                    </div>
                    <div class="actions">
                        <a pButton routerLink="/area-strutture/accreditamento" label="Accredita la tua struttura" icon="pi pi-building"></a>
                    </div>
                } @else {
                    <header>
                        <div>
                            <span>Area Strutture</span>
                            <h1>{{ profile.nome }}</h1>
                            <p>{{ profile.citta }} / {{ profile.regione }} · {{ profile.tipo }}</p>
                        </div>
                        <p-tag [value]="statusLabel" [severity]="statusSeverity"></p-tag>
                    </header>

                    <div class="status-box" [ngClass]="statusClass">
                        <strong>{{ statusMessage }}</strong>
                    </div>

                    <div class="hero-profile">
                        @if (profile.foto.length) {
                            <img [src]="cover" alt="Foto copertina struttura" />
                        } @else {
                            <div class="cover-placeholder">Foto struttura da completare.</div>
                        }
                        <div class="metrics">
                            <div class="metric"><span>Capienza</span><strong>{{ profile.capienza ?? 'Da completare' }}</strong></div>
                            <div class="metric"><span>Posti letto</span><strong>{{ profile.postiLetto ?? 'Da completare' }}</strong></div>
                            <div class="metric"><span>Camere</span><strong>{{ profile.camere ?? 'Da completare' }}</strong></div>
                            <div class="metric"><span>Promo attive</span><strong>{{ promoAttive.length }}</strong></div>
                            <div class="metric"><span>Richieste ricevute</span><strong>0</strong></div>
                            <div class="metric"><span>Foto caricate</span><strong>{{ profile.foto.length }}</strong></div>
                        </div>
                    </div>

                    <div class="dashboard-cards">
                        @for (card of cards; track card.title) {
                            <a class="dashboard-card" [routerLink]="card.route">
                                <i class="pi" [ngClass]="card.icon"></i>
                                <strong>{{ card.title }}</strong>
                                <span>{{ card.text }}</span>
                                <small>{{ card.state }}</small>
                            </a>
                        }
                    </div>
                }
            </section>
        </main>
    `,
    styles: [structurePageStyles]
})
export class AreaStruttureDashboard {
    readonly profile = readStrutturaProfile();
    readonly status = readProfileStatus();
    readonly statusLabel = statusLabelStruttura(this.status);
    readonly promoAttive = activePromo(this.profile);

    get cover() {
        return fotoCopertina(this.profile);
    }

    get statusSeverity(): 'success' | 'secondary' | 'warn' | 'danger' {
        if (this.status === 'APPROVATA') return 'success';
        if (this.status === 'RESPINTA') return 'danger';
        if (this.status === 'SOSPESA') return 'secondary';
        return 'warn';
    }

    get statusClass() {
        if (this.status === 'APPROVATA') return 'success';
        if (this.status === 'RESPINTA') return 'danger';
        if (this.status === 'SOSPESA') return 'warn';
        return 'info';
    }

    get statusMessage() {
        if (this.status === 'APPROVATA') return 'Struttura approvata e visibile nel catalogo.';
        if (this.status === 'RESPINTA') return 'Accreditamento respinto. Contatta l’amministrazione.';
        if (this.status === 'SOSPESA') return 'Struttura sospesa temporaneamente.';
        return 'Il profilo è in attesa di approvazione da parte del Global Admin.';
    }

    get cards() {
        return [
            { title: 'Profilo struttura', text: 'Dati anagrafici, descrizione, capienza e condizioni.', icon: 'pi-id-card', route: '/area-strutture/profilo', state: this.profile ? 'Attivo' : 'Da completare' },
            { title: 'Foto struttura', text: 'Copertina, camere, sale, cappella, mensa ed esterni.', icon: 'pi-images', route: '/area-strutture/foto', state: this.profile?.foto.length ? 'Attivo' : 'Da completare' },
            { title: 'Offerte e promo', text: 'Promozioni e disponibilità commerciali.', icon: 'pi-tags', route: '/area-strutture/offerte', state: this.promoAttive.length ? 'Attivo' : 'Da completare' },
            { title: 'Richieste ricevute', text: 'Richieste di disponibilità dalle comunità.', icon: 'pi-inbox', route: '/area-strutture/richieste', state: 'In sviluppo' },
            { title: 'Stato accreditamento', text: 'Esito della verifica del Global Admin.', icon: 'pi-shield', route: '/area-strutture/profilo', state: this.statusLabel },
            { title: 'Dati da completare', text: 'Controlla eventuali informazioni mancanti.', icon: 'pi-list-check', route: '/area-strutture/profilo', state: this.datiMancanti ? 'Da completare' : 'Attivo' }
        ];
    }

    get datiMancanti() {
        return !this.profile?.email || !this.profile?.telefono || !this.profile?.descrizione;
    }
}

@Component({
    selector: 'app-area-strutture-accreditamento',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink, ButtonModule, CheckboxModule, InputTextModule, SelectModule, TextareaModule],
    template: `
        <main class="structure-entry">
            <form class="editor-card" (ngSubmit)="submit()">
                <div class="back-row">
                    <a pButton routerLink="/area-strutture" label="Indietro" icon="pi pi-arrow-left" severity="secondary" outlined></a>
                </div>
                <header>
                    <div>
                        <span>Accreditamento struttura</span>
                        <h1>Dati della struttura</h1>
                        <p>Compila la scheda. Il profilo resterà in attesa di approvazione prima della pubblicazione operativa.</p>
                    </div>
                </header>
                <ng-container *ngTemplateOutlet="formTemplate"></ng-container>
                @if (message) { <div class="message status-box info">{{ message }}</div> }
                <footer>
                    <a pButton routerLink="/area-strutture" label="Indietro" icon="pi pi-arrow-left" severity="secondary" outlined></a>
                    <button pButton type="submit" label="Salva e vai alla dashboard" icon="pi pi-check"></button>
                </footer>
            </form>
        </main>

        <ng-template #formTemplate>
            <div class="form-grid">
                <label><span>Nome</span><input pInputText name="nome" [(ngModel)]="form.nome" required /></label>
                <label><span>Tipo</span><p-select name="tipo" [options]="tipiStruttura" [(ngModel)]="form.tipo" appendTo="body"></p-select></label>
                <label class="span-2"><span>Descrizione</span><textarea pTextarea name="descrizione" rows="4" [(ngModel)]="form.descrizione"></textarea></label>
                <label class="span-2"><span>Indirizzo</span><input pInputText name="indirizzo" [(ngModel)]="form.indirizzo" /></label>
                <label><span>Città</span><input pInputText name="citta" [(ngModel)]="form.citta" /></label>
                <label><span>Regione</span><input pInputText name="regione" [(ngModel)]="form.regione" /></label>
                <label><span>Referente</span><input pInputText name="referente" [(ngModel)]="form.referente" /></label>
                <label><span>Email</span><input pInputText type="email" name="email" [(ngModel)]="form.email" /></label>
                <label><span>Telefono</span><input pInputText name="telefono" [(ngModel)]="form.telefono" /></label>
                <label><span>Capienza</span><input pInputText type="number" name="capienza" [(ngModel)]="form.capienza" /></label>
                <label><span>Posti letto</span><input pInputText type="number" name="postiLetto" [(ngModel)]="form.postiLetto" /></label>
                <label><span>Camere</span><input pInputText type="number" name="camere" [(ngModel)]="form.camere" /></label>
                <label class="span-2"><span>Sale</span><input pInputText name="sale" [(ngModel)]="form.sale" /></label>
                <label class="span-2"><span>Tariffe indicative</span><textarea pTextarea name="tariffeIndicative" rows="3" [(ngModel)]="form.tariffeIndicative"></textarea></label>
                <label><span>Condizioni caparra</span><input pInputText name="condizioniCaparra" [(ngModel)]="form.condizioniCaparra" /></label>
                <label><span>Condizioni cancellazione</span><input pInputText name="condizioniCancellazione" [(ngModel)]="form.condizioniCancellazione" /></label>
                <div class="checks span-2">
                    <label><p-checkbox name="cappella" [(ngModel)]="form.cappella" [binary]="true"></p-checkbox><span>Cappella</span></label>
                    <label><p-checkbox name="mensa" [(ngModel)]="form.mensa" [binary]="true"></p-checkbox><span>Mensa</span></label>
                    <label><p-checkbox name="cucinaInterna" [(ngModel)]="form.cucinaInterna" [binary]="true"></p-checkbox><span>Cucina interna</span></label>
                    <label><p-checkbox name="parcheggio" [(ngModel)]="form.parcheggio" [binary]="true"></p-checkbox><span>Parcheggio</span></label>
                    <label><p-checkbox name="accessibilitaDisabili" [(ngModel)]="form.accessibilitaDisabili" [binary]="true"></p-checkbox><span>Accessibilità disabili</span></label>
                    <label><p-checkbox name="spaziEsterni" [(ngModel)]="form.spaziEsterni" [binary]="true"></p-checkbox><span>Spazi esterni</span></label>
                    <label><p-checkbox name="famiglieConBambini" [(ngModel)]="form.famiglieConBambini" [binary]="true"></p-checkbox><span>Famiglie con bambini</span></label>
                </div>
            </div>
        </ng-template>
    `,
    styles: [structurePageStyles]
})
export class AreaStruttureAccreditamento {
    private readonly router = inject(Router);
    readonly tipiStruttura = ['Casa di convivenza', 'Istituto religioso', 'Santuario', 'Casa per ferie', 'Albergo', 'Struttura di accoglienza', 'Altro'];
    form: StrutturaProfileMock = normalizeStrutturaProfile({ ...STRUTTURA_PROFILE_DEFAULT, ...(readStrutturaProfile() ?? {}) });
    message = '';

    submit() {
        if (!this.form.nome.trim()) {
            this.message = 'Inserisci il nome della struttura.';
            return;
        }
        saveStrutturaProfile(this.form, 'IN_ATTESA');
        this.message = 'Profilo salvato. La struttura è in attesa di approvazione.';
        setTimeout(() => void this.router.navigateByUrl('/area-strutture/dashboard'), 400);
    }
}

@Component({
    selector: 'app-area-strutture-profilo',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink, ButtonModule, CheckboxModule, InputTextModule, SelectModule, TagModule, TextareaModule],
    template: `
        <main class="structure-entry">
            <section class="editor-card">
                <div class="back-row">
                    <a pButton routerLink="/area-strutture/dashboard" label="Torna alla dashboard" icon="pi pi-arrow-left" severity="secondary" outlined></a>
                </div>
                <header>
                    <div>
                        <span>Area Strutture</span>
                        <h1>Profilo struttura</h1>
                        <p>Gestisci dati, servizi, condizioni e recapiti della struttura.</p>
                    </div>
                    <p-tag [value]="statusLabel" [severity]="statusSeverity"></p-tag>
                </header>

                @if (!editMode) {
                    <div class="hero-profile">
                        @if (profile.foto.length) {
                            <img [src]="cover" alt="Foto copertina struttura" />
                        } @else {
                            <div class="cover-placeholder">Nessuna foto copertina caricata.</div>
                        }
                        <dl>
                            <div><dt>Nome</dt><dd>{{ profile.nome }}</dd></div>
                            <div><dt>Tipo</dt><dd>{{ profile.tipo }}</dd></div>
                            <div><dt>Città / Regione</dt><dd>{{ profile.citta }} / {{ profile.regione }}</dd></div>
                            <div><dt>Referente</dt><dd>{{ profile.referente || 'Da completare' }}</dd></div>
                            <div><dt>Email</dt><dd>{{ profile.email || 'Da completare' }}</dd></div>
                            <div><dt>Telefono</dt><dd>{{ profile.telefono || 'Da completare' }}</dd></div>
                            <div><dt>Capienza</dt><dd>{{ profile.capienza ?? 'Da completare' }}</dd></div>
                            <div><dt>Posti letto</dt><dd>{{ profile.postiLetto ?? 'Da completare' }}</dd></div>
                            <div class="span-2"><dt>Descrizione</dt><dd>{{ profile.descrizione || 'Da completare' }}</dd></div>
                        </dl>
                    </div>
                    <div class="actions">
                        <button pButton type="button" label="Modifica dati" icon="pi pi-pencil" (click)="startEdit()"></button>
                        <a pButton routerLink="/area-strutture/dashboard" label="Vai alla dashboard" icon="pi pi-th-large" outlined></a>
                        <a pButton routerLink="/area-strutture/foto" label="Gestisci foto" icon="pi pi-images" outlined></a>
                        <a pButton routerLink="/area-strutture/richieste" label="Vai alle richieste" icon="pi pi-inbox" outlined></a>
                    </div>
                } @else {
                    <div class="form-grid">
                        <label><span>Nome</span><input pInputText [(ngModel)]="draft.nome" /></label>
                        <label><span>Tipo</span><p-select [options]="tipiStruttura" [(ngModel)]="draft.tipo" appendTo="body"></p-select></label>
                        <label class="span-2"><span>Descrizione</span><textarea pTextarea rows="4" [(ngModel)]="draft.descrizione"></textarea></label>
                        <label class="span-2"><span>Indirizzo</span><input pInputText [(ngModel)]="draft.indirizzo" /></label>
                        <label><span>Città</span><input pInputText [(ngModel)]="draft.citta" /></label>
                        <label><span>Regione</span><input pInputText [(ngModel)]="draft.regione" /></label>
                        <label><span>Referente</span><input pInputText [(ngModel)]="draft.referente" /></label>
                        <label><span>Email</span><input pInputText type="email" [(ngModel)]="draft.email" /></label>
                        <label><span>Telefono</span><input pInputText [(ngModel)]="draft.telefono" /></label>
                        <label><span>Capienza</span><input pInputText type="number" [(ngModel)]="draft.capienza" /></label>
                        <label><span>Posti letto</span><input pInputText type="number" [(ngModel)]="draft.postiLetto" /></label>
                        <label><span>Camere</span><input pInputText type="number" [(ngModel)]="draft.camere" /></label>
                        <label class="span-2"><span>Sale</span><input pInputText [(ngModel)]="draft.sale" /></label>
                        <label class="span-2"><span>Tariffe indicative</span><textarea pTextarea rows="3" [(ngModel)]="draft.tariffeIndicative"></textarea></label>
                        <label><span>Condizioni caparra</span><input pInputText [(ngModel)]="draft.condizioniCaparra" /></label>
                        <label><span>Condizioni cancellazione</span><input pInputText [(ngModel)]="draft.condizioniCancellazione" /></label>
                    </div>
                    <div class="checks">
                        <label><p-checkbox [(ngModel)]="draft.cappella" [binary]="true"></p-checkbox><span>Cappella</span></label>
                        <label><p-checkbox [(ngModel)]="draft.mensa" [binary]="true"></p-checkbox><span>Mensa</span></label>
                        <label><p-checkbox [(ngModel)]="draft.cucinaInterna" [binary]="true"></p-checkbox><span>Cucina interna</span></label>
                        <label><p-checkbox [(ngModel)]="draft.parcheggio" [binary]="true"></p-checkbox><span>Parcheggio</span></label>
                        <label><p-checkbox [(ngModel)]="draft.accessibilitaDisabili" [binary]="true"></p-checkbox><span>Accessibilità disabili</span></label>
                        <label><p-checkbox [(ngModel)]="draft.spaziEsterni" [binary]="true"></p-checkbox><span>Spazi esterni</span></label>
                        <label><p-checkbox [(ngModel)]="draft.famiglieConBambini" [binary]="true"></p-checkbox><span>Famiglie con bambini</span></label>
                    </div>
                    <footer>
                        <button pButton type="button" label="Annulla" severity="secondary" outlined (click)="cancelEdit()"></button>
                        <button pButton type="button" label="Salva modifiche" icon="pi pi-save" (click)="saveEdit()"></button>
                    </footer>
                }

                @if (message) { <div class="message status-box success">{{ message }}</div> }
            </section>
        </main>
    `,
    styles: [structurePageStyles]
})
export class AreaStruttureProfilo {
    readonly tipiStruttura = ['Casa di convivenza', 'Istituto religioso', 'Santuario', 'Casa per ferie', 'Albergo', 'Struttura di accoglienza', 'Altro'];
    profile: StrutturaProfileMock = readStrutturaProfile() ?? normalizeStrutturaProfile(STRUTTURA_PROFILE_DEFAULT);
    draft: StrutturaProfileMock = normalizeStrutturaProfile(this.profile);
    status = readProfileStatus();
    statusLabel = statusLabelStruttura(this.status);
    editMode = false;
    message = '';

    get cover() { return fotoCopertina(this.profile); }
    get statusSeverity(): 'success' | 'secondary' | 'warn' | 'danger' {
        if (this.status === 'APPROVATA') return 'success';
        if (this.status === 'RESPINTA') return 'danger';
        if (this.status === 'SOSPESA') return 'secondary';
        return 'warn';
    }

    startEdit() {
        this.draft = normalizeStrutturaProfile(JSON.parse(JSON.stringify(this.profile)) as StrutturaProfileMock);
        this.editMode = true;
    }

    cancelEdit() {
        this.editMode = false;
        this.draft = normalizeStrutturaProfile(this.profile);
    }

    saveEdit() {
        this.profile = normalizeStrutturaProfile(this.draft);
        saveStrutturaProfile(this.profile, this.status);
        this.editMode = false;
        this.message = 'Modifiche salvate.';
    }
}

@Component({
    selector: 'app-area-strutture-foto',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink, ButtonModule, CheckboxModule, InputTextModule, SelectModule, TagModule],
    template: `
        <main class="structure-entry">
            <section class="editor-card">
                <div class="back-row">
                    <a pButton routerLink="/area-strutture/dashboard" label="Torna alla dashboard" icon="pi pi-arrow-left" severity="secondary" outlined></a>
                </div>
                <header>
                    <div>
                        <span>Area Strutture</span>
                        <h1>Foto struttura</h1>
                        <p>Gestisci una galleria completa con copertina, camere, sale, cappella, mensa, esterni e servizi.</p>
                    </div>
                    <a pButton routerLink="/area-strutture/dashboard" label="Dashboard" icon="pi pi-th-large" outlined></a>
                </header>

                <div class="form-grid">
                    <label><span>Categoria</span><p-select [options]="categorieFoto" [(ngModel)]="fotoCategoria" appendTo="body"></p-select></label>
                    <label><span>Imposta come copertina</span><p-checkbox [(ngModel)]="fotoIsCover" [binary]="true"></p-checkbox></label>
                    <label><span>File immagine</span><input class="file-input" type="file" accept="image/*" (change)="onFileSelected($event)" /></label>
                    <label><span>URL immagine alternativa</span><input pInputText [(ngModel)]="fotoUrl" placeholder="https://..." /></label>
                    <label class="span-2"><span>Descrizione</span><input pInputText [(ngModel)]="fotoDescrizione" /></label>
                    @if (pendingPreviewSrc) {
                        <div class="upload-preview span-2">
                            <img [src]="pendingPreviewSrc" alt="Anteprima foto da aggiungere" />
                        </div>
                    }
                </div>
                <footer>
                    <button pButton type="button" label="Aggiungi foto" icon="pi pi-plus" (click)="addFoto()"></button>
                </footer>
                @if (message) { <div class="message status-box" [ngClass]="messageType">{{ message }}</div> }

                @if (!profile.foto.length) {
                    <div class="empty-state">Nessuna foto caricata. Aggiungi una foto per iniziare la galleria.</div>
                }

                <div class="photo-grid">
                    @for (foto of profile.foto; track foto.id) {
                        <article class="photo-card">
                            <img [src]="photoSrc(foto)" [alt]="foto.descrizione" />
                            @if (foto.copertina || foto.isCover) { <span class="badge">Copertina</span> }
                            @if (editingPhotoId === foto.id) {
                                <p-select [options]="categorieFoto" [(ngModel)]="foto.categoria" appendTo="body"></p-select>
                                <input pInputText [(ngModel)]="foto.descrizione" />
                                <div class="photo-actions">
                                    <button pButton type="button" label="Salva" size="small" (click)="savePhotoEdit()"></button>
                                    <button pButton type="button" label="Annulla" size="small" severity="secondary" outlined (click)="editingPhotoId = null"></button>
                                </div>
                            } @else {
                                <strong>{{ foto.categoria }}</strong>
                                <span>{{ foto.descrizione }}</span>
                                <small>{{ formatPhotoDate(foto.createdAt) }}</small>
                                <div class="photo-actions">
                                    <button pButton type="button" label="Copertina" size="small" outlined (click)="setCover(foto)"></button>
                                    <button pButton type="button" label="Modifica" size="small" severity="secondary" outlined (click)="editingPhotoId = foto.id"></button>
                                    <button pButton type="button" label="Anteprima" size="small" outlined (click)="preview = foto"></button>
                                    <button pButton type="button" label="Elimina" size="small" severity="danger" outlined (click)="deleteFoto(foto)"></button>
                                </div>
                            }
                        </article>
                    }
                </div>
            </section>

            @if (preview) {
                <div class="preview-modal" (click)="preview = null">
                    <article (click)="$event.stopPropagation()">
                        <img [src]="photoSrc(preview)" [alt]="preview.descrizione" />
                        <strong>{{ preview.categoria }}</strong>
                        <p>{{ preview.descrizione }}</p>
                        <button pButton type="button" label="Chiudi anteprima" (click)="preview = null"></button>
                    </article>
                </div>
            }
        </main>
    `,
    styles: [structurePageStyles]
})
export class AreaStruttureFoto {
    readonly categorieFoto: CategoriaFotoStruttura[] = ['copertina', 'camere', 'sale', 'cappella', 'mensa', 'esterni', 'spazi comuni', 'servizi', 'altro'];
    profile: StrutturaProfileMock = readStrutturaProfile() ?? normalizeStrutturaProfile(STRUTTURA_PROFILE_DEFAULT);
    status = readProfileStatus();
    fotoCategoria: CategoriaFotoStruttura = 'copertina';
    fotoUrl = '';
    fotoDataUrl = '';
    fotoIsCover = true;
    fotoDescrizione = '';
    editingPhotoId: string | null = null;
    preview: FotoStrutturaMock | null = null;
    message = '';
    messageType: 'info' | 'success' | 'danger' = 'info';

    get pendingPreviewSrc() {
        return this.fotoUrl.trim() || this.fotoDataUrl;
    }

    onFileSelected(event: Event) {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) {
            this.fotoDataUrl = '';
            return;
        }

        if (!file.type.startsWith('image/')) {
            this.showMessage('Seleziona un file immagine.', 'danger');
            input.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            this.fotoDataUrl = typeof reader.result === 'string' ? reader.result : '';
        };
        reader.onerror = () => this.showMessage('Impossibile leggere il file selezionato.', 'danger');
        reader.readAsDataURL(file);
    }

    addFoto() {
        const src = this.fotoUrl.trim() || this.fotoDataUrl;
        if (!src) {
            this.showMessage('Carica un file o inserisci un URL immagine.', 'danger');
            return;
        }

        const isFirst = this.profile.foto.length === 0;
        const isCover = isFirst || this.fotoCategoria === 'copertina' || this.fotoIsCover;
        const foto: FotoStrutturaMock = {
            id: `foto-${Date.now()}`,
            categoria: this.fotoCategoria,
            url: this.fotoUrl.trim() || this.fotoDataUrl,
            dataUrl: this.fotoUrl.trim() ? '' : this.fotoDataUrl,
            descrizione: this.fotoDescrizione.trim() || this.fotoCategoria,
            copertina: isCover,
            isCover,
            createdAt: new Date().toISOString()
        };
        const nextFoto = foto.isCover ? this.profile.foto.map((item) => ({ ...item, copertina: false, isCover: false })) : this.profile.foto;
        this.profile = normalizeStrutturaProfile({ ...this.profile, foto: [foto, ...nextFoto] });
        this.persist();
        this.fotoUrl = '';
        this.fotoDataUrl = '';
        this.fotoDescrizione = '';
        this.fotoCategoria = 'copertina';
        this.fotoIsCover = this.profile.foto.length === 0;
        this.showMessage('Foto aggiunta.', 'success');
    }

    setCover(foto: FotoStrutturaMock) {
        this.profile = normalizeStrutturaProfile({ ...this.profile, foto: this.profile.foto.map((item) => ({ ...item, copertina: item.id === foto.id, isCover: item.id === foto.id })) });
        this.persist();
        this.showMessage('Copertina aggiornata.', 'success');
    }

    savePhotoEdit() {
        const edited = this.profile.foto.find((item) => item.id === this.editingPhotoId);
        if (edited?.categoria === 'copertina') {
            this.profile = normalizeStrutturaProfile({
                ...this.profile,
                foto: this.profile.foto.map((item) => ({
                    ...item,
                    copertina: item.id === edited.id,
                    isCover: item.id === edited.id
                }))
            });
        }
        this.profile = normalizeStrutturaProfile(this.profile);
        this.persist();
        this.editingPhotoId = null;
        this.showMessage('Modifiche foto salvate.', 'success');
    }

    deleteFoto(foto: FotoStrutturaMock) {
        if (!confirm('Eliminare questa foto?')) {
            return;
        }
        const remaining = this.profile.foto.filter((item) => item.id !== foto.id);
        if (foto.copertina || foto.isCover) {
            remaining[0] = remaining[0] ? { ...remaining[0], copertina: true, isCover: true } : remaining[0];
        }
        this.profile = normalizeStrutturaProfile({ ...this.profile, foto: remaining.filter(Boolean) as FotoStrutturaMock[] });
        this.persist();
        this.preview = null;
        this.showMessage('Foto eliminata.', 'success');
    }

    photoSrc(foto: FotoStrutturaMock | null) {
        return foto?.dataUrl || foto?.url || '/images/backgrounds/posti-convivenza-bg.jpg';
    }

    formatPhotoDate(value: string | undefined) {
        if (!value) {
            return '';
        }
        try {
            return new Intl.DateTimeFormat('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(value));
        } catch {
            return value;
        }
    }

    private persist() {
        saveStrutturaProfile(this.profile, this.status);
    }

    private showMessage(message: string, type: 'info' | 'success' | 'danger') {
        this.message = message;
        this.messageType = type;
    }
}

@Component({
    selector: 'app-area-strutture-offerte',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink, ButtonModule, CheckboxModule, InputTextModule, TextareaModule],
    template: `
        <main class="structure-entry">
            <section class="editor-card">
                <div class="back-row">
                    <a pButton routerLink="/area-strutture/dashboard" label="Torna alla dashboard" icon="pi pi-arrow-left" severity="secondary" outlined></a>
                </div>
                <header>
                    <div>
                        <span>Area Strutture</span>
                        <h1>Offerte e promo</h1>
                        <p>Gestisci promo commerciali visibili nel catalogo Posti di Convivenza.</p>
                    </div>
                    <a pButton routerLink="/area-strutture/dashboard" label="Dashboard" icon="pi pi-th-large" outlined></a>
                </header>
                <div class="form-grid">
                    <label><span>Titolo promo</span><input pInputText [(ngModel)]="promoTitolo" placeholder="Sconto gruppi infrasettimanali" /></label>
                    <label><span>Attiva</span><p-checkbox [(ngModel)]="promoAttiva" [binary]="true"></p-checkbox></label>
                    <label><span>Valida dal</span><input pInputText type="date" [(ngModel)]="promoDal" /></label>
                    <label><span>Valida al</span><input pInputText type="date" [(ngModel)]="promoAl" /></label>
                    <label class="span-2"><span>Descrizione</span><textarea pTextarea rows="3" [(ngModel)]="promoDescrizione"></textarea></label>
                </div>
                <footer><button pButton type="button" label="Aggiungi promo" icon="pi pi-plus" (click)="addPromo()"></button></footer>
                <div class="promo-list">
                    @for (promo of profile.promo; track promo.id) {
                        <article class="promo-card"><strong>{{ promo.titolo }}</strong><span>{{ promo.descrizione }}</span><em>{{ promo.attiva ? 'Attiva' : 'Non attiva' }}</em></article>
                    } @empty {
                        <div class="empty-state">Nessuna promo inserita.</div>
                    }
                </div>
            </section>
        </main>
    `,
    styles: [structurePageStyles]
})
export class AreaStruttureOfferte {
    profile: StrutturaProfileMock = readStrutturaProfile() ?? normalizeStrutturaProfile(STRUTTURA_PROFILE_DEFAULT);
    status = readProfileStatus();
    promoTitolo = '';
    promoDescrizione = '';
    promoDal = '';
    promoAl = '';
    promoAttiva = true;

    addPromo() {
        if (!this.promoTitolo.trim()) return;
        const promo: PromoStrutturaMock = { id: `promo-${Date.now()}`, titolo: this.promoTitolo.trim(), descrizione: this.promoDescrizione.trim(), validaDal: this.promoDal, validaAl: this.promoAl, attiva: this.promoAttiva };
        this.profile = normalizeStrutturaProfile({ ...this.profile, promo: [promo, ...this.profile.promo] });
        saveStrutturaProfile(this.profile, this.status);
        this.promoTitolo = '';
        this.promoDescrizione = '';
        this.promoDal = '';
        this.promoAl = '';
        this.promoAttiva = true;
    }
}

@Component({
    selector: 'app-area-strutture-richieste',
    standalone: true,
    imports: [CommonModule, RouterLink, ButtonModule],
    template: `
        <main class="structure-entry">
            <section class="editor-card">
                <div class="back-row">
                    <a pButton routerLink="/area-strutture/dashboard" label="Torna alla dashboard" icon="pi pi-arrow-left" severity="secondary" outlined></a>
                </div>
                <header>
                    <div>
                        <span>Area Strutture</span>
                        <h1>Richieste ricevute</h1>
                        <p>Le richieste delle comunità compariranno qui quando il backend sarà attivo.</p>
                    </div>
                    <a pButton routerLink="/area-strutture/dashboard" label="Dashboard" icon="pi pi-th-large" outlined></a>
                </header>
                <div class="status-box info"><strong>Nessuna richiesta ricevuta</strong><p>Il flusso è pronto per localStorage/backend futuro.</p></div>
            </section>
        </main>
    `,
    styles: [structurePageStyles]
})
export class AreaStruttureRichieste {}

@Component({
    selector: 'app-area-strutture-attesa',
    standalone: true,
    imports: [CommonModule, RouterLink, ButtonModule],
    template: `
        <main class="structure-entry">
            <section class="editor-card">
                <div class="back-row">
                    <a pButton routerLink="/area-strutture/dashboard" label="Torna alla dashboard" icon="pi pi-arrow-left" severity="secondary" outlined></a>
                </div>
                <header>
                    <div>
                        <span>Area Strutture</span>
                        <h1>In attesa di approvazione</h1>
                        <p>Il profilo è in attesa di approvazione da parte del Global Admin.</p>
                    </div>
                    <a pButton routerLink="/area-strutture/dashboard" label="Dashboard" icon="pi pi-th-large" outlined></a>
                </header>
                <div class="status-box info"><strong>Stato accreditamento: {{ statusLabel }}</strong></div>
            </section>
        </main>
    `,
    styles: [structurePageStyles]
})
export class AreaStruttureInAttesa {
    readonly statusLabel = statusLabelStruttura(readProfileStatus());
}
