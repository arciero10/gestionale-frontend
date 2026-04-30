import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PRIVACY_CONFIG } from '../data/privacy-config.mock';
import { aggiungiNotificaCensimento, aggiornaUnitaCensimento, trovaUnitaDaToken, UnitaCensimentoComunita } from './censimento-comunita.storage';

@Component({
    selector: 'app-completa-anagrafica',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink, ButtonModule, InputTextModule],
    template: `
        <main class="profile-completion">
            <section class="completion-card">
                @if (unita) {
                    <header>
                        <span>Link personale</span>
                        <h1>Completa la tua anagrafica</h1>
                        <p>{{ unita.nomeVisualizzato }}</p>
                    </header>

                    <div class="notice">
                        I consensi sono individuali per ogni persona. Anche se la coppia usa una email comune, ciascuno conferma separatamente i propri dati.
                    </div>

                    <section class="privacy-owner">
                        <div>
                            <span>Titolare del trattamento</span>
                            <strong>{{ privacyConfig.titolareBreve }}</strong>
                        </div>
                        <div>
                            <span>Email privacy</span>
                            <strong>{{ privacyConfig.emailPrivacy }}</strong>
                        </div>
                        <a routerLink="/privacy">Leggi informativa privacy completa</a>
                    </section>

                    <div class="people-grid">
                        @for (persona of unita.persone; track persona.id; let index = $index) {
                            <article class="person-card">
                                <h2>{{ unita.tipoUnita === 'Coppia' ? 'Persona ' + (index + 1) : 'Dati personali' }}</h2>
                                <div class="form-grid">
                                    <div>
                                        <label>Nome</label>
                                        <input pInputText [(ngModel)]="persona.nome" />
                                    </div>
                                    <div>
                                        <label>Cognome</label>
                                        <input pInputText [(ngModel)]="persona.cognome" />
                                    </div>
                                    <div>
                                        <label>Email</label>
                                        <input pInputText type="email" [(ngModel)]="persona.email" />
                                    </div>
                                    <div>
                                        <label>Telefono</label>
                                        <input pInputText [(ngModel)]="persona.telefono" />
                                    </div>
                                    <div>
                                        <label>Data nascita facoltativa</label>
                                        <input pInputText type="date" [(ngModel)]="persona.dataNascita" />
                                    </div>
                                </div>
                                <div class="consents">
                                    <label><input type="checkbox" [(ngModel)]="persona.consensoInformativo" /> Consenso informativo</label>
                                    <label><input type="checkbox" [(ngModel)]="persona.consensoPrivacy" /> Consenso privacy</label>
                                    <label><input type="checkbox" [(ngModel)]="persona.consensoComunicazioni" /> Consenso comunicazioni organizzative</label>
                                </div>
                            </article>
                        }
                    </div>

                    @if (messaggio) {
                        <div class="success-message">{{ messaggio }}</div>
                    }

                    <footer>
                        <button pButton type="button" label="Invia dati" icon="pi pi-check" (click)="inviaDati()"></button>
                    </footer>
                } @else {
                    <header>
                        <span>Link non disponibile</span>
                        <h1>Invito non trovato</h1>
                        <p>Il link mock non risulta presente su questo browser o potrebbe essere scaduto.</p>
                    </header>
                }
            </section>
        </main>
    `,
    styles: [
        `
            .profile-completion { min-height: 100vh; display: grid; place-items: center; padding: 1rem; background: #f5f7fb; color: #0f2440; }
            .completion-card { width: min(100%, 980px); display: grid; gap: 1rem; padding: clamp(1rem, 2vw, 1.5rem); border-radius: 18px; background: #fff; border: 1px solid #e5e7eb; box-shadow: 0 18px 45px rgba(15, 23, 42, .12); }
            header span { color: #64748b; font-weight: 800; text-transform: uppercase; font-size: .78rem; }
            h1 { margin: .2rem 0; font-size: clamp(1.6rem, 4vw, 2.25rem); }
            header p { margin: 0; color: #475569; font-weight: 800; }
            .notice, .success-message { padding: .85rem; border-radius: 12px; border: 1px solid #c7d2fe; background: #eef2ff; color: #3730a3; line-height: 1.45; }
            .success-message { border-color: #bbf7d0; background: #dcfce7; color: #166534; }
            .privacy-owner { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)) auto; gap: .75rem; align-items: center; padding: .85rem; border: 1px solid #e5e7eb; border-radius: 12px; background: #f8fafc; }
            .privacy-owner div { display: grid; gap: .2rem; }
            .privacy-owner span { color: #64748b; font-size: .78rem; font-weight: 800; text-transform: uppercase; }
            .privacy-owner strong { color: #0f3558; }
            .privacy-owner a { color: #0f3558; font-weight: 800; text-decoration: none; }
            .people-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; }
            .person-card { display: grid; gap: .85rem; padding: 1rem; border: 1px solid #e5e7eb; border-radius: 14px; background: #fbfbf8; }
            .person-card h2 { margin: 0; font-size: 1.1rem; }
            .form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .75rem; }
            .form-grid div { display: grid; gap: .35rem; }
            label { color: #334155; font-weight: 800; font-size: .86rem; }
            input { width: 100%; }
            .consents { display: grid; gap: .45rem; }
            .consents label { display: flex; align-items: center; gap: .45rem; font-weight: 700; }
            footer { display: flex; justify-content: flex-end; }
            @media (max-width: 767px) { .people-grid, .form-grid, .privacy-owner { grid-template-columns: 1fr; } footer button { width: 100%; min-height: 44px; } }
        `
    ]
})
export class CompletaAnagrafica {
    private readonly route = inject(ActivatedRoute);
    privacyConfig = PRIVACY_CONFIG;
    unita: UnitaCensimentoComunita | undefined = trovaUnitaDaToken(this.route.snapshot.paramMap.get('token') ?? '');
    messaggio = '';

    inviaDati() {
        if (!this.unita) {
            return;
        }

        const totaleConsensi = this.unita.persone.length * 3;
        const consensiSelezionati = this.unita.persone.reduce((totale, persona) => totale + Number(persona.consensoInformativo) + Number(persona.consensoPrivacy) + Number(persona.consensoComunicazioni), 0);
        const statoConsensi = consensiSelezionati === totaleConsensi ? 'Completo' : consensiSelezionati > 0 ? 'Parziale' : 'Da compilare';
        const aggiornata: UnitaCensimentoComunita = {
            ...this.unita,
            statoInvito: 'Compilato',
            statoAnagrafica: 'Completa',
            statoConsensi,
            persone: this.unita.persone.map((persona) => ({ ...persona }))
        };
        aggiornaUnitaCensimento(aggiornata);
        aggiungiNotificaCensimento(`Anagrafica completata da ${aggiornata.nomeVisualizzato}`);
        this.unita = aggiornata;
        this.messaggio = 'Dati inviati correttamente';
    }
}
