import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import {
    CommunityMemberCompletionPayload,
    CommunityMemberMock,
    completeCommunityMember,
    findCommunityMemberByToken
} from '../data/community-members.mock';

type RegistrationForm = CommunityMemberCompletionPayload;

@Component({
    selector: 'app-registrazione-fratello',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink, ButtonModule],
    template: `
        <main class="registration-page">
            <section class="registration-card">
                @if (!member) {
                    <div class="empty-state">
                        <i class="pi pi-link"></i>
                        <h1>Link invito non valido o scaduto</h1>
                        <p>Chiedi al responsabile della comunità di generare un nuovo invito.</p>
                        <a pButton routerLink="/" label="Torna alla pagina iniziale" icon="pi pi-home"></a>
                    </div>
                } @else if (completed) {
                    <div class="empty-state success">
                        <i class="pi pi-check-circle"></i>
                        <h1>Registrazione completata</h1>
                        <p>I tuoi dati sono stati salvati localmente nel mock. I consensi restano individuali e collegati alla tua scheda personale.</p>
                        <a pButton routerLink="/" label="Torna alla pagina iniziale" icon="pi pi-home"></a>
                    </div>
                } @else {
                    <header class="registration-head">
                        <span>Invito comunità</span>
                        <h1>Completa la tua registrazione</h1>
                        <p>Verifica i dati inseriti dal responsabile e conferma anagrafica e consensi privacy.</p>
                    </header>

                    @if (feedback) {
                        <div class="feedback error">{{ feedback }}</div>
                    }

                    <form class="registration-form" (ngSubmit)="submit()">
                        <label>Nome <input name="nome" [(ngModel)]="form.nome" required /></label>
                        <label>Cognome <input name="cognome" [(ngModel)]="form.cognome" required /></label>
                        <label>Email <input name="email" type="email" [(ngModel)]="form.email" required /></label>
                        <label>Telefono <input name="telefono" [(ngModel)]="form.telefono" /></label>
                        <label>Data nascita <input name="dataNascita" type="date" [(ngModel)]="form.dataNascita" /></label>
                        <label>Indirizzo <input name="indirizzo" [(ngModel)]="form.indirizzo" /></label>
                        <label>Contatto emergenza <input name="contattoEmergenza" [(ngModel)]="form.contattoEmergenza" /></label>
                        <label class="full">Note sanitarie o organizzative <textarea name="noteSanitarie" rows="3" [(ngModel)]="form.noteSanitarie"></textarea></label>

                        <section class="privacy-box">
                            <h2>Consensi individuali</h2>
                            <label class="check"><input type="checkbox" name="privacyTrattamentoDati" [(ngModel)]="form.privacyTrattamentoDati" /> Acconsento al trattamento dei dati personali per la gestione comunitaria.</label>
                            <label class="check"><input type="checkbox" name="consensoComunicazioni" [(ngModel)]="form.consensoComunicazioni" /> Acconsento a ricevere comunicazioni operative della comunità.</label>
                            <label class="check"><input type="checkbox" name="consensoFotoVideo" [(ngModel)]="form.consensoFotoVideo" /> Acconsento all'eventuale uso interno di foto/video per finalità comunitarie.</label>
                            <label class="check"><input type="checkbox" name="confermaDatiCorretti" [(ngModel)]="form.confermaDatiCorretti" /> Confermo che i dati inseriti sono corretti.</label>
                        </section>

                        <button pButton type="submit" label="Invia registrazione" icon="pi pi-check"></button>
                    </form>
                }
            </section>
        </main>
    `,
    styles: [`
        :host { display:block; min-height:100vh; }
        .registration-page {
            min-height:100vh; display:grid; place-items:center; padding:clamp(1rem,3vw,2rem);
            background:linear-gradient(rgba(15,23,42,.46),rgba(15,23,42,.38)), url('/images/backgrounds/censimento-comunita-bg.jpg') center center/cover fixed no-repeat;
        }
        .registration-card {
            width:min(920px,100%); border-radius:18px; border:1px solid rgba(255,255,255,.55);
            background:rgba(255,255,255,.95); box-shadow:0 24px 50px rgba(15,23,42,.28); padding:clamp(1rem,2.5vw,1.5rem);
        }
        .registration-head { display:grid; gap:.35rem; margin-bottom:1rem; }
        .registration-head span { color:#476078; font-size:.78rem; font-weight:900; text-transform:uppercase; }
        h1,h2,p { margin:0; } h1,h2 { color:#0f172a; } p { color:#334155; line-height:1.45; }
        .registration-form { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:.85rem; }
        label { display:grid; gap:.32rem; color:#1e293b; font-weight:850; }
        input,textarea { width:100%; min-height:42px; border:1px solid #cbd5e1; border-radius:10px; padding:.6rem .7rem; color:#0f172a; background:#fff; }
        textarea { resize:vertical; }
        .full,.privacy-box,button[pButton] { grid-column:1/-1; }
        .privacy-box { display:grid; gap:.55rem; padding:1rem; border-radius:14px; background:#f8fafc; border:1px solid #e2e8f0; }
        .check { display:flex; align-items:flex-start; gap:.55rem; font-weight:750; }
        .check input { width:auto; min-height:auto; margin-top:.18rem; }
        .feedback { padding:.75rem 1rem; margin-bottom:1rem; border-radius:12px; background:#fef2f2; color:#991b1b; font-weight:850; }
        .empty-state { min-height:22rem; display:grid; place-items:center; align-content:center; gap:.75rem; text-align:center; }
        .empty-state i { font-size:3rem; color:#b45309; }
        .empty-state.success i { color:#15803d; }
        @media (max-width:700px){ .registration-form{grid-template-columns:1fr}.registration-page{background-attachment:scroll} }
    `]
})
export class RegistrazioneFratello {
    private readonly route = inject(ActivatedRoute);
    readonly token = this.route.snapshot.queryParamMap.get('token') || '';
    member: CommunityMemberMock | null = findCommunityMemberByToken(this.token);
    completed = false;
    feedback = '';
    form: RegistrationForm = {
        nome: this.member?.nome || '',
        cognome: this.member?.cognome || '',
        email: this.member?.email || '',
        telefono: this.member?.telefono || '',
        dataNascita: this.member?.dataNascita || '',
        indirizzo: this.member?.indirizzo || '',
        contattoEmergenza: this.member?.contattoEmergenza || '',
        noteSanitarie: this.member?.noteSanitarie || '',
        privacyTrattamentoDati: this.member?.privacyTrattamentoDati ?? false,
        consensoComunicazioni: this.member?.consensoComunicazioni ?? false,
        consensoFotoVideo: this.member?.consensoFotoVideo ?? false,
        confermaDatiCorretti: this.member?.confermaDatiCorretti ?? false
    };

    submit(): void {
        if (!this.form.nome.trim() || !this.form.cognome.trim() || !this.form.email.trim()) {
            this.feedback = 'Compila nome, cognome ed email.';
            return;
        }

        if (!this.form.privacyTrattamentoDati || !this.form.confermaDatiCorretti) {
            this.feedback = 'Per inviare la registrazione devi confermare privacy e correttezza dei dati.';
            return;
        }

        const completed = completeCommunityMember(this.token, this.form);

        if (!completed) {
            this.feedback = 'Link invito non valido o scaduto.';
            return;
        }

        this.member = completed;
        this.completed = true;
        this.feedback = '';
    }
}
