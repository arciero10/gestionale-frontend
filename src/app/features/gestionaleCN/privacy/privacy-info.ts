import { CommonModule } from '@angular/common';
import { Component, HostBinding, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { PRIVACY_CONFIG } from '../data/privacy-config.mock';

@Component({
    selector: 'app-privacy-info',
    standalone: true,
    imports: [CommonModule, RouterLink, ButtonModule],
    template: `
        <main class="privacy-info-page">
            <header class="privacy-hero">
                <div>
                    <span class="draft-badge">{{ privacy.noteValidazione }}</span>
                    <h1>Informativa privacy</h1>
                    <p>Informativa ai sensi degli artt. 13 e 14 del Regolamento (UE) 2016/679 (GDPR)</p>
                </div>
                <a pButton routerLink="/faq" icon="pi pi-question-circle" label="FAQ" severity="secondary" outlined></a>
            </header>

            <section class="owner-card">
                <div>
                    <span>Titolare</span>
                    <strong>{{ privacy.titolareBreve }}</strong>
                </div>
                <div>
                    <span>Sede legale</span>
                    <strong>{{ privacy.sedeLegaleBreve }}</strong>
                </div>
                <div>
                    <span>Email privacy</span>
                    <strong>{{ privacy.emailPrivacy }}</strong>
                </div>
                <div>
                    <span>PEC</span>
                    <strong>{{ privacy.pec }}</strong>
                </div>
                <div>
                    <span>Referente privacy</span>
                    <strong>{{ privacy.referentePrivacy }}</strong>
                </div>
            </section>

            <section class="privacy-section">
                <h2>1. Titolare del trattamento</h2>
                <dl>
                    <div><dt>Titolare</dt><dd>{{ privacy.titolareCompleto }}</dd></div>
                    <div><dt>Codice fiscale</dt><dd>{{ privacy.codiceFiscale }}</dd></div>
                    <div><dt>Partita IVA</dt><dd>{{ privacy.partitaIva }}</dd></div>
                    <div><dt>Sede legale</dt><dd>{{ privacy.sedeLegaleCompleta }}</dd></div>
                    <div><dt>Email privacy</dt><dd>{{ privacy.emailPrivacy }}</dd></div>
                    <div><dt>PEC</dt><dd>{{ privacy.pec }}</dd></div>
                    <div><dt>Legale rappresentante</dt><dd>{{ privacy.legaleRappresentante }}</dd></div>
                </dl>
            </section>

            <section class="privacy-section">
                <h2>2. Finalità del trattamento</h2>
                <ul>
                    @for (item of privacy.finalitaTrattamento; track item) {
                        <li>{{ item }}</li>
                    }
                </ul>
            </section>

            <section class="privacy-section">
                <h2>3. Base giuridica del trattamento</h2>
                <ul>
                    @for (item of privacy.basiGiuridiche; track item) {
                        <li>{{ item }}</li>
                    }
                </ul>
            </section>

            <section class="privacy-section">
                <h2>4. Tipologia di dati trattati</h2>
                <ul>
                    @for (item of privacy.tipologieDati; track item) {
                        <li>{{ item }}</li>
                    }
                </ul>
            </section>

            <section class="privacy-section">
                <h2>5. Tempo di conservazione</h2>
                <ul>
                    @for (item of privacy.tempiConservazione; track item) {
                        <li>{{ item }}</li>
                    }
                </ul>
            </section>

            <section class="privacy-section">
                <h2>6. Modalità del trattamento</h2>
                <p>{{ privacy.modalitaTrattamento }}</p>
            </section>

            <section class="privacy-section">
                <h2>7. Comunicazione e diffusione dei dati</h2>
                <p>{{ privacy.comunicazioneDati.intro }}</p>
                <ul>
                    @for (item of privacy.comunicazioneDati.destinatari; track item) {
                        <li>{{ item }}</li>
                    }
                </ul>
                <p>{{ privacy.comunicazioneDati.noDiffusione }}</p>
            </section>

            <section class="privacy-section">
                <h2>8. Responsabili esterni del trattamento</h2>
                <ul>
                    @for (item of privacy.responsabiliEsterni.elenco; track item) {
                        <li>{{ item }}</li>
                    }
                </ul>
                <p>{{ privacy.responsabiliEsterni.nota }}</p>
            </section>

            <section class="privacy-section">
                <h2>9. Diritti dell’interessato</h2>
                <p>{{ privacy.dirittiInteressato.intro }}</p>
                <ul>
                    @for (item of privacy.dirittiInteressato.elenco; track item) {
                        <li>{{ item }}</li>
                    }
                </ul>
                <p>{{ privacy.dirittiInteressato.contatto }}</p>
            </section>

            <section class="privacy-section">
                <h2>10. Modifiche all’informativa</h2>
                <p>{{ privacy.modificheInformativa }}</p>
                <p class="validation-note">{{ privacy.noteValidazione }}</p>
            </section>
        </main>
    `,
    styles: [
        `
            :host {
                display: block;
            }
            :host.public-privacy-page {
                min-height: 100vh;
                padding: clamp(1rem, 3vw, 2rem);
                background-image:
                    linear-gradient(135deg, rgba(7, 18, 34, 0.18), rgba(255, 255, 255, 0.3) 45%, rgba(8, 22, 39, 0.12)),
                    url('/images/backgrounds/faq-bg.jpg');
                background-position: center;
                background-repeat: no-repeat;
                background-size: cover;
                background-attachment: fixed;
            }
            .privacy-info-page { display: grid; gap: 1.25rem; max-width: 1100px; margin: 0 auto; }
            .privacy-hero, .owner-card, .privacy-section {
                border: 1px solid rgba(255, 255, 255, .42);
                border-radius: 16px;
                background: rgba(255, 255, 255, .84);
                box-shadow: 0 18px 45px rgba(15, 23, 42, .14);
                backdrop-filter: blur(10px);
                -webkit-backdrop-filter: blur(10px);
            }
            .privacy-hero { display: flex; justify-content: space-between; align-items: center; gap: 1rem; padding: 1.35rem; }
            .privacy-hero h1 { margin: .35rem 0; font-size: clamp(1.8rem, 4vw, 2.5rem); color: #0f2440; }
            .privacy-hero p, .privacy-section p, .privacy-section li, .owner-card span, dd { color: #64748b; line-height: 1.55; }
            .draft-badge { display: inline-flex; padding: .28rem .7rem; border-radius: 999px; background: #fffbeb; color: #92400e; border: 1px solid #fde68a; font-weight: 800; font-size: .8rem; }
            .owner-card { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: .85rem; padding: 1rem; }
            .owner-card div { display: grid; gap: .25rem; padding: .85rem; border-radius: 12px; background: rgba(248, 250, 252, .76); }
            .owner-card strong { color: #0f3558; }
            .privacy-section { display: grid; gap: .8rem; padding: 1.2rem; }
            .privacy-section h2 { margin: 0; font-size: 1.15rem; color: #0f2440; }
            .privacy-section p { margin: 0; }
            ul { margin: 0; padding-left: 1.2rem; }
            dl { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .7rem; margin: 0; }
            dl div { padding: .75rem; border-radius: 10px; background: rgba(248, 250, 252, .76); }
            dt { color: #334155; font-weight: 800; }
            dd { margin: .2rem 0 0; }
            .validation-note { padding: .75rem; border-radius: 10px; background: #fffbeb; color: #92400e !important; border: 1px solid #fde68a; font-weight: 800; }
            @media (max-width: 1000px) { .owner-card { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
            @media (max-width: 767px) { :host.public-privacy-page { background-attachment: scroll; } .privacy-hero { align-items: flex-start; flex-direction: column; } .owner-card, dl { grid-template-columns: 1fr; } .privacy-hero a { width: 100%; justify-content: center; } }
        `
    ]
})
export class PrivacyInfo {
    private readonly route = inject(ActivatedRoute);

    @HostBinding('class.public-privacy-page')
    get isPublicPrivacyPage() {
        return this.route.snapshot.data['visibilita'] === 'pubblica';
    }

    privacy = PRIVACY_CONFIG;
}
