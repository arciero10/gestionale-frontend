import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import {
    CategoriaFotoStruttura,
    FotoStrutturaMock,
    PromoStrutturaMock,
    STRUTTURA_PROFILE_DEFAULT,
    StrutturaProfileMock,
    activePromo,
    fotoCopertina,
    readProfileStatus,
    readStrutturaProfile,
    saveStrutturaProfile
} from './struttura-profile.storage';

const structurePageStyles = `
    .structure-entry {
        min-height: 100vh;
        display: grid;
        align-items: center;
        padding: clamp(1rem, 4vw, 3rem);
        background:
            linear-gradient(rgba(15, 23, 42, .42), rgba(15, 23, 42, .58)),
            url('/images/backgrounds/posti-convivenza-bg.jpg') center center / cover no-repeat fixed;
        color: #0f172a;
    }
    .structure-form-page { align-items: start; }
    .entry-card,
    .editor-card {
        width: min(100%, 68rem);
        margin: 0 auto;
        padding: clamp(1.2rem, 3vw, 2rem);
        border: 1px solid rgba(255,255,255,.45);
        border-radius: 22px;
        background: rgba(255,255,255,.94);
        box-shadow: 0 24px 60px rgba(15,23,42,.24);
        backdrop-filter: blur(12px);
    }
    .entry-card { max-width: 42rem; display: grid; gap: 1rem; }
    header span,
    .entry-card span { color: #1d4ed8; font-size: .78rem; font-weight: 850; text-transform: uppercase; }
    h1 { margin: .25rem 0 .45rem; color: #0f172a; font-size: clamp(1.8rem, 4vw, 3rem); line-height: 1.05; }
    p { margin: 0; color: #334155; line-height: 1.55; font-weight: 650; }
    .actions,
    footer { display: flex; flex-wrap: wrap; gap: .75rem; margin-top: 1rem; justify-content: flex-end; }
    .form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .9rem; margin-top: 1rem; }
    label { display: grid; gap: .4rem; color: #1e293b; font-weight: 800; }
    input, textarea, p-select { width: 100%; }
    .span-2 { grid-column: span 2; }
    .checks { display: flex; flex-wrap: wrap; gap: .85rem; padding: .9rem; border-radius: 14px; background: #f8fafc; border: 1px solid #e2e8f0; }
    .checks label { display: flex; align-items: center; gap: .45rem; }
    .message,
    .status-box { margin-top: 1rem; padding: .85rem 1rem; border-radius: 14px; background: #eff6ff; border: 1px solid #bfdbfe; color: #1e3a8a; font-weight: 800; }
    .profile-preview { display: grid; grid-template-columns: minmax(16rem, 22rem) 1fr; gap: 1rem; margin-top: 1rem; }
    .profile-preview img,
    .photo-grid img { width: 100%; aspect-ratio: 16/9; object-fit: cover; border-radius: 16px; background: #e2e8f0; }
    dl { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .75rem; margin: 0; }
    dl div,
    .photo-grid article,
    .promo-list article { padding: .85rem; border: 1px solid #e2e8f0; border-radius: 14px; background: #fff; }
    dt { color: #64748b; font-size: .82rem; }
    dd { margin: .2rem 0 0; color: #0f172a; font-weight: 850; }
    .photo-grid,
    .promo-list { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: .85rem; margin-top: 1rem; }
    .photo-grid article,
    .promo-list article { display: grid; gap: .45rem; }
    .photo-grid strong,
    .promo-list strong { color: #0f172a; }
    .photo-grid span,
    .promo-list span,
    .promo-list em { color: #475569; font-style: normal; }
    .dashboard-cards { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: .85rem; margin-top: 1rem; }
    .dashboard-card { display: grid; gap: .45rem; align-content: start; min-height: 9rem; padding: 1rem; border: 1px solid #e2e8f0; border-radius: 16px; background: #fff; color: #0f172a; text-decoration: none; box-shadow: 0 10px 22px rgba(15,23,42,.08); }
    .dashboard-card i { color: #1d4ed8; font-size: 1.35rem; }
    .dashboard-card strong { font-size: 1rem; }
    .dashboard-card span { color: #475569; line-height: 1.35; }
    @media (max-width: 760px) {
        .form-grid,
        .profile-preview,
        dl,
        .photo-grid,
        .promo-list,
        .dashboard-cards { grid-template-columns: 1fr; }
        .span-2 { grid-column: span 1; }
        .structure-entry { background-attachment: scroll; }
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
                <p>Accredita o gestisci la tua struttura per ricevere richieste di disponibilita per convivenze, incontri e pellegrinaggi.</p>
                <div class="actions">
                    <a pButton routerLink="/area-strutture/accreditamento" label="Accredita la tua struttura" icon="pi pi-building"></a>
                    <a pButton routerLink="/area-strutture/profilo" label="Accedi come struttura" icon="pi pi-sign-in" outlined></a>
                </div>
            </section>
        </main>
    `,
    styles: [structurePageStyles]
})
export class AreaStruttureHome {}

@Component({
    selector: 'app-area-strutture-dashboard',
    standalone: true,
    imports: [CommonModule, RouterLink, ButtonModule],
    template: `
        <main class="structure-entry structure-form-page">
            <section class="editor-card">
                <header>
                    <span>Area Strutture</span>
                    <h1>Dashboard struttura</h1>
                    <p>Gestisci profilo, foto, offerte e richieste ricevute dalla tua struttura.</p>
                </header>

                @if (!hasProfile) {
                    <div class="status-box">
                        <strong>Nessuna struttura accreditata su questo dispositivo</strong>
                        <p>Avvia l'accreditamento per creare la scheda struttura e accedere agli strumenti dedicati.</p>
                    </div>
                    <div class="actions">
                        <a pButton routerLink="/area-strutture/accreditamento" label="Accredita la tua struttura" icon="pi pi-building"></a>
                    </div>
                } @else {
                    <div class="profile-preview">
                        <img [src]="cover" alt="Foto copertina struttura" />
                        <dl>
                            <div><dt>Nome struttura</dt><dd>{{ profile?.nome }}</dd></div>
                            <div><dt>Stato accreditamento</dt><dd>{{ statusLabel }}</dd></div>
                            <div><dt>Citta / Regione</dt><dd>{{ profile?.citta }} / {{ profile?.regione }}</dd></div>
                            <div><dt>Capienza</dt><dd>{{ profile?.capienza ?? 'Da completare' }}</dd></div>
                            <div><dt>Posti letto</dt><dd>{{ profile?.postiLetto ?? 'Da completare' }}</dd></div>
                            <div><dt>Promo attive</dt><dd>{{ promoAttive.length }}</dd></div>
                        </dl>
                    </div>

                    <div class="dashboard-cards">
                        @for (card of cards; track card.title) {
                            <a class="dashboard-card" [routerLink]="card.route">
                                <i class="pi" [ngClass]="card.icon"></i>
                                <strong>{{ card.title }}</strong>
                                <span>{{ card.text }}</span>
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
    readonly statusLabel = readProfileStatus();
    readonly promoAttive = activePromo(this.profile);
    readonly cards = [
        {
            title: 'Profilo struttura',
            text: 'Dati anagrafici, referente, capienza e condizioni.',
            icon: 'pi-id-card',
            route: '/area-strutture/profilo'
        },
        {
            title: 'Foto struttura',
            text: 'Copertina, camere, sale, cappella, mensa ed esterni.',
            icon: 'pi-images',
            route: '/area-strutture/foto'
        },
        {
            title: 'Offerte e disponibilita',
            text: 'Promo, pacchetti e disponibilita commerciali.',
            icon: 'pi-tags',
            route: '/area-strutture/offerte'
        },
        {
            title: 'Richieste ricevute',
            text: 'Richieste di disponibilita ricevute dalle comunita.',
            icon: 'pi-inbox',
            route: '/area-strutture/richieste'
        }
    ];

    get hasProfile() {
        return Boolean(this.profile);
    }

    get cover() {
        return fotoCopertina(this.profile);
    }
}

@Component({
    selector: 'app-area-strutture-accreditamento',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink, ButtonModule, CheckboxModule, InputTextModule, SelectModule, TextareaModule],
    template: `
        <main class="structure-entry structure-form-page">
            <form class="editor-card" (ngSubmit)="submit()">
                <header>
                    <span>Accreditamento struttura</span>
                    <h1>Dati della struttura</h1>
                    <p>Compila una prima scheda. Il profilo restera in attesa di approvazione prima della pubblicazione operativa.</p>
                </header>

                <div class="form-grid">
                    <label><span>Nome struttura</span><input pInputText name="nome" [(ngModel)]="form.nome" required /></label>
                    <label><span>Tipo struttura</span><p-select name="tipo" [options]="tipiStruttura" [(ngModel)]="form.tipo" appendTo="body"></p-select></label>
                    <label class="span-2"><span>Descrizione</span><textarea pTextarea name="descrizione" rows="4" [(ngModel)]="form.descrizione"></textarea></label>
                    <label class="span-2"><span>Indirizzo</span><input pInputText name="indirizzo" [(ngModel)]="form.indirizzo" /></label>
                    <label><span>Citta</span><input pInputText name="citta" [(ngModel)]="form.citta" /></label>
                    <label><span>Regione</span><input pInputText name="regione" [(ngModel)]="form.regione" /></label>
                    <label><span>Referente</span><input pInputText name="referente" [(ngModel)]="form.referente" /></label>
                    <label><span>Email</span><input pInputText type="email" name="email" [(ngModel)]="form.email" /></label>
                    <label><span>Telefono</span><input pInputText name="telefono" [(ngModel)]="form.telefono" /></label>
                    <label><span>Capienza</span><input pInputText type="number" min="0" name="capienza" [(ngModel)]="form.capienza" /></label>
                    <label><span>Posti letto</span><input pInputText type="number" min="0" name="postiLetto" [(ngModel)]="form.postiLetto" /></label>
                    <label><span>Camere</span><input pInputText type="number" min="0" name="camere" [(ngModel)]="form.camere" /></label>
                    <label class="span-2"><span>Sale</span><input pInputText name="sale" [(ngModel)]="form.sale" /></label>
                    <div class="checks span-2">
                        <label><p-checkbox name="cappella" [(ngModel)]="form.cappella" [binary]="true"></p-checkbox><span>Cappella</span></label>
                        <label><p-checkbox name="mensa" [(ngModel)]="form.mensa" [binary]="true"></p-checkbox><span>Mensa</span></label>
                        <label><p-checkbox name="cucinaInterna" [(ngModel)]="form.cucinaInterna" [binary]="true"></p-checkbox><span>Cucina interna</span></label>
                        <label><p-checkbox name="parcheggio" [(ngModel)]="form.parcheggio" [binary]="true"></p-checkbox><span>Parcheggio</span></label>
                        <label><p-checkbox name="accessibilitaDisabili" [(ngModel)]="form.accessibilitaDisabili" [binary]="true"></p-checkbox><span>Accessibilita disabili</span></label>
                        <label><p-checkbox name="spaziEsterni" [(ngModel)]="form.spaziEsterni" [binary]="true"></p-checkbox><span>Spazi esterni</span></label>
                        <label><p-checkbox name="famiglieConBambini" [(ngModel)]="form.famiglieConBambini" [binary]="true"></p-checkbox><span>Famiglie con bambini</span></label>
                    </div>
                    <label class="span-2"><span>Tariffe indicative</span><textarea pTextarea name="tariffeIndicative" rows="3" [(ngModel)]="form.tariffeIndicative"></textarea></label>
                    <label><span>Condizioni caparra</span><input pInputText name="condizioniCaparra" [(ngModel)]="form.condizioniCaparra" /></label>
                    <label><span>Condizioni cancellazione</span><input pInputText name="condizioniCancellazione" [(ngModel)]="form.condizioniCancellazione" /></label>
                </div>

                @if (message) {
                    <div class="message">{{ message }}</div>
                }

                <footer>
                    <a pButton routerLink="/area-strutture" label="Annulla" severity="secondary" outlined></a>
                    <button pButton type="submit" label="Salva e vai alla dashboard" icon="pi pi-check"></button>
                </footer>
            </form>
        </main>
    `,
    styles: [structurePageStyles]
})
export class AreaStruttureAccreditamento {
    private readonly router = inject(Router);
    readonly tipiStruttura = ['Casa di convivenza', 'Istituto religioso', 'Santuario', 'Casa per ferie', 'Albergo', 'Struttura di accoglienza', 'Altro'];
    form: StrutturaProfileMock = { ...STRUTTURA_PROFILE_DEFAULT, ...(readStrutturaProfile() ?? {}) };
    message = '';

    submit() {
        if (!this.form.nome.trim()) {
            this.message = 'Inserisci il nome della struttura.';
            return;
        }

        saveStrutturaProfile(this.form, 'IN_ATTESA');
        this.message = 'Profilo salvato. La struttura e in attesa di approvazione.';
        setTimeout(() => void this.router.navigateByUrl('/area-strutture/dashboard'), 400);
    }
}

@Component({
    selector: 'app-area-strutture-profilo',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink, ButtonModule, CheckboxModule, InputTextModule, SelectModule, TextareaModule],
    template: `
        <main class="structure-entry structure-form-page">
            <section class="editor-card">
                <header>
                    <span>Area Strutture</span>
                    <h1>{{ title }}</h1>
                    <p>{{ subtitle }}</p>
                </header>

                @if (mode === 'attesa') {
                    <div class="status-box">
                        <strong>Stato accreditamento: {{ statusLabel }}</strong>
                        <p>La scheda e salvata localmente. Dopo approvazione admin sara disponibile come posto operativo.</p>
                    </div>
                }

                @if (mode === 'profilo') {
                    <div class="profile-preview">
                        <img [src]="cover" alt="Foto copertina struttura" />
                        <dl>
                            <div><dt>Nome</dt><dd>{{ profile.nome }}</dd></div>
                            <div><dt>Citta / Regione</dt><dd>{{ profile.citta }} / {{ profile.regione }}</dd></div>
                            <div><dt>Capienza</dt><dd>{{ profile.capienza ?? 'Da completare' }}</dd></div>
                            <div><dt>Posti letto</dt><dd>{{ profile.postiLetto ?? 'Da completare' }}</dd></div>
                            <div><dt>Camere</dt><dd>{{ profile.camere ?? 'Da completare' }}</dd></div>
                            <div><dt>Referente</dt><dd>{{ profile.referente || 'Da completare' }}</dd></div>
                        </dl>
                    </div>
                    <div class="actions">
                        <a pButton routerLink="/area-strutture/accreditamento" label="Modifica dati" icon="pi pi-pencil"></a>
                        <a pButton routerLink="/area-strutture/dashboard" label="Vai alla dashboard" icon="pi pi-th-large" outlined></a>
                    </div>
                }

                @if (mode === 'foto') {
                    <div class="form-grid">
                        <label><span>Categoria</span><p-select [options]="categorieFoto" [(ngModel)]="fotoCategoria" appendTo="body"></p-select></label>
                        <label><span>URL immagine</span><input pInputText [(ngModel)]="fotoUrl" placeholder="/images/backgrounds/posti-convivenza-bg.jpg" /></label>
                        <label class="span-2"><span>Descrizione</span><input pInputText [(ngModel)]="fotoDescrizione" /></label>
                    </div>
                    <button pButton type="button" label="Aggiungi foto mock" icon="pi pi-image" (click)="addFoto()"></button>
                    <div class="photo-grid">
                        @for (foto of profile.foto; track foto.id) {
                            <article><img [src]="foto.url" [alt]="foto.descrizione" /><strong>{{ foto.categoria }}</strong><span>{{ foto.descrizione }}</span></article>
                        }
                    </div>
                }

                @if (mode === 'offerte') {
                    <div class="form-grid">
                        <label><span>Titolo promo</span><input pInputText [(ngModel)]="promoTitolo" placeholder="Sconto gruppi infrasettimanali" /></label>
                        <label><span>Attiva</span><p-checkbox [(ngModel)]="promoAttiva" [binary]="true"></p-checkbox></label>
                        <label><span>Valida dal</span><input pInputText type="date" [(ngModel)]="promoDal" /></label>
                        <label><span>Valida al</span><input pInputText type="date" [(ngModel)]="promoAl" /></label>
                        <label class="span-2"><span>Descrizione</span><textarea pTextarea rows="3" [(ngModel)]="promoDescrizione"></textarea></label>
                    </div>
                    <button pButton type="button" label="Aggiungi promo" icon="pi pi-plus" (click)="addPromo()"></button>
                    <div class="promo-list">
                        @for (promo of profile.promo; track promo.id) {
                            <article><strong>{{ promo.titolo }}</strong><span>{{ promo.descrizione }}</span><em>{{ promo.attiva ? 'Attiva' : 'Non attiva' }}</em></article>
                        }
                    </div>
                }

                @if (mode === 'richieste') {
                    <div class="status-box">
                        <strong>Richieste ricevute</strong>
                        <p>Le richieste delle comunita compariranno qui quando il backend sara attivo. Per ora il flusso e mock/localStorage.</p>
                    </div>
                }
            </section>
        </main>
    `,
    styles: [structurePageStyles]
})
export class AreaStruttureProfilo {
    private readonly router = inject(Router);
    mode: 'profilo' | 'foto' | 'offerte' | 'richieste' | 'attesa' = this.resolveMode();
    profile: StrutturaProfileMock = readStrutturaProfile() ?? STRUTTURA_PROFILE_DEFAULT;
    readonly statusLabel = readProfileStatus();
    readonly categorieFoto: CategoriaFotoStruttura[] = ['copertina', 'camere', 'sale', 'cappella', 'mensa', 'esterni', 'altro'];
    fotoCategoria: CategoriaFotoStruttura = 'copertina';
    fotoUrl = '';
    fotoDescrizione = '';
    promoTitolo = '';
    promoDescrizione = '';
    promoDal = '';
    promoAl = '';
    promoAttiva = true;

    get cover() {
        return fotoCopertina(this.profile);
    }

    get title() {
        if (this.mode === 'foto') return 'Foto struttura';
        if (this.mode === 'offerte') return 'Offerte e promo';
        if (this.mode === 'richieste') return 'Richieste ricevute';
        if (this.mode === 'attesa') return 'In attesa di approvazione';
        return 'Profilo struttura';
    }

    get subtitle() {
        if (this.mode === 'foto') return 'Aggiungi URL immagine per copertina, camere, sale, cappella, mensa ed esterni.';
        if (this.mode === 'offerte') return 'Gestisci promo commerciali visibili nel catalogo Posti di Convivenza.';
        if (this.mode === 'richieste') return 'Consulta le richieste di disponibilita ricevute dalle comunita.';
        if (this.mode === 'attesa') return 'La scheda e stata inviata e attende verifica.';
        return 'Aggiorna i dati principali della struttura.';
    }

    addFoto() {
        if (!this.fotoUrl.trim()) return;
        const foto: FotoStrutturaMock = {
            id: `foto-${Date.now()}`,
            categoria: this.fotoCategoria,
            url: this.fotoUrl.trim(),
            descrizione: this.fotoDescrizione.trim() || this.fotoCategoria,
            copertina: this.fotoCategoria === 'copertina'
        };
        this.profile = { ...this.profile, foto: [foto, ...this.profile.foto] };
        saveStrutturaProfile(this.profile, readProfileStatus());
        this.fotoUrl = '';
        this.fotoDescrizione = '';
    }

    addPromo() {
        if (!this.promoTitolo.trim()) return;
        const promo: PromoStrutturaMock = {
            id: `promo-${Date.now()}`,
            titolo: this.promoTitolo.trim(),
            descrizione: this.promoDescrizione.trim(),
            validaDal: this.promoDal,
            validaAl: this.promoAl,
            attiva: this.promoAttiva
        };
        this.profile = { ...this.profile, promo: [promo, ...this.profile.promo] };
        saveStrutturaProfile(this.profile, readProfileStatus());
        this.promoTitolo = '';
        this.promoDescrizione = '';
    }

    protected readonly activePromo = activePromo;

    private resolveMode(): 'profilo' | 'foto' | 'offerte' | 'richieste' | 'attesa' {
        const path = this.router.url.split('?')[0].split('#')[0];
        if (path.endsWith('/foto')) return 'foto';
        if (path.endsWith('/offerte')) return 'offerte';
        if (path.endsWith('/richieste')) return 'richieste';
        if (path.endsWith('/in-attesa')) return 'attesa';
        return 'profilo';
    }
}

@Component({
    selector: 'app-area-strutture-foto',
    standalone: true,
    imports: [AreaStruttureProfilo],
    template: `<app-area-strutture-profilo />`
})
export class AreaStruttureFoto extends AreaStruttureProfilo {
    override mode = 'foto' as const;
}

@Component({
    selector: 'app-area-strutture-offerte',
    standalone: true,
    imports: [AreaStruttureProfilo],
    template: `<app-area-strutture-profilo />`
})
export class AreaStruttureOfferte extends AreaStruttureProfilo {
    override mode = 'offerte' as const;
}

@Component({
    selector: 'app-area-strutture-richieste',
    standalone: true,
    imports: [AreaStruttureProfilo],
    template: `<app-area-strutture-profilo />`
})
export class AreaStruttureRichieste extends AreaStruttureProfilo {
    override mode = 'richieste' as const;
}

@Component({
    selector: 'app-area-strutture-attesa',
    standalone: true,
    imports: [AreaStruttureProfilo],
    template: `<app-area-strutture-profilo />`
})
export class AreaStruttureInAttesa extends AreaStruttureProfilo {
    override mode = 'attesa' as const;
}
