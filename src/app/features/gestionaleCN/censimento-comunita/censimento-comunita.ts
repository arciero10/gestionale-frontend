import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { TipoUnitaMembroComunita } from '../data/comunita-pilota.mock';
import { PRIVACY_CONFIG } from '../data/privacy-config.mock';
import { UnitaCensimentoComunita, creaLinkInvito, generaTokenCensimento, leggiNotificheCensimento, leggiUnitaCensimento, salvaUnitaCensimento } from './censimento-comunita.storage';

@Component({
    selector: 'app-censimento-comunita',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink, ButtonModule, InputTextModule, SelectModule, TagModule, TextareaModule],
    template: `
        <section class="census-page">
            <header class="page-head">
                <div>
                    <span>Censimento iniziale</span>
                    <h1>Censimento comunità</h1>
                    <p>Il responsabile inserisce solo i dati minimi per inviare il link di completamento anagrafica e consensi.</p>
                </div>
                <a routerLink="/gestionale-cn/comunita" class="back-link">Torna alla comunità</a>
            </header>

            @if (messaggio) {
                <div class="action-message"><i class="pi pi-check-circle"></i><span>{{ messaggio }}</span></div>
            }

            @if (notifiche.length) {
                <section class="notifications">
                    <strong>Notifiche responsabile</strong>
                    @for (notifica of notifiche; track notifica.id) {
                        <span>{{ notifica.testo }}</span>
                    }
                </section>
            }

            <section class="form-card">
                <div class="form-intro">
                    <h2>{{ unitaInModifica ? 'Modifica unità' : 'Nuova unità' }}</h2>
                    <p>La coppia è una unità organizzativa: dati e consensi restano individuali per ogni persona.</p>
                </div>

                <div class="unit-form">
                    <div>
                        <label for="tipoUnita">Tipo inserimento</label>
                        <p-select inputId="tipoUnita" appendTo="body" panelStyleClass="modal-dropdown-panel" [options]="tipiUnita" [(ngModel)]="tipoUnita" (ngModelChange)="resetFormTipo()"></p-select>
                    </div>

                    @if (tipoUnita === 'Coppia') {
                        <div>
                            <label for="nomeMarito">Nome marito</label>
                            <input id="nomeMarito" pInputText [(ngModel)]="form.nomeMarito" />
                        </div>
                        <div>
                            <label for="cognomeMarito">Cognome marito</label>
                            <input id="cognomeMarito" pInputText [(ngModel)]="form.cognomeMarito" />
                        </div>
                        <div>
                            <label for="nomeMoglie">Nome moglie</label>
                            <input id="nomeMoglie" pInputText [(ngModel)]="form.nomeMoglie" />
                        </div>
                        <div>
                            <label for="cognomeMoglie">Cognome moglie</label>
                            <input id="cognomeMoglie" pInputText [(ngModel)]="form.cognomeMoglie" />
                        </div>
                        <div>
                            <label for="emailCoppia">Email di riferimento coppia</label>
                            <input id="emailCoppia" pInputText type="email" [(ngModel)]="form.email" />
                        </div>
                        <div>
                            <label for="telefonoCoppia">Telefono di riferimento facoltativo</label>
                            <input id="telefonoCoppia" pInputText [(ngModel)]="form.telefono" />
                        </div>
                    } @else {
                        <div>
                            <label for="nomeSingolo">Nome</label>
                            <input id="nomeSingolo" pInputText [(ngModel)]="form.nome" />
                        </div>
                        <div>
                            <label for="cognomeSingolo">Cognome</label>
                            <input id="cognomeSingolo" pInputText [(ngModel)]="form.cognome" />
                        </div>
                        <div>
                            <label for="emailSingolo">Email</label>
                            <input id="emailSingolo" pInputText type="email" [(ngModel)]="form.email" />
                        </div>
                        <div>
                            <label for="telefonoSingolo">Telefono facoltativo</label>
                            <input id="telefonoSingolo" pInputText [(ngModel)]="form.telefono" />
                        </div>
                    }
                </div>

                <footer class="form-actions">
                    <button pButton type="button" label="Annulla" severity="secondary" outlined (click)="annullaModifica()"></button>
                    <button pButton type="button" label="Aggiungi unità" icon="pi pi-plus" (click)="salvaUnitaDaForm()"></button>
                    <button pButton type="button" label="Salva bozza censimento" icon="pi pi-save" severity="secondary" outlined (click)="salvaBozza()"></button>
                    <button pButton type="button" label="Invia invito" icon="pi pi-send" severity="success" (click)="inviaInvitoDaForm()"></button>
                </footer>
            </section>

            @if (mailPreview) {
                <div class="modal-backdrop" role="presentation" (click)="mailPreview = null">
                    <section class="mail-modal" role="dialog" aria-modal="true" aria-label="Anteprima mail invito" (click)="$event.stopPropagation()">
                        <header>
                            <span>Anteprima mail mock</span>
                            <h2>{{ mailPreview.nomeVisualizzato }}</h2>
                        </header>
                        <label>Oggetto</label>
                        <div class="mail-box">[Eventi di Comunità] Completa la tua anagrafica</div>
                        <label>Corpo</label>
                        <pre class="mail-box">{{ corpoMail(mailPreview) }}</pre>
                        <section class="privacy-owner">
                            <strong>Titolare del trattamento: {{ privacyConfig.titolareBreve }}</strong>
                            <span>Email privacy: {{ privacyConfig.emailPrivacy }}</span>
                            <a routerLink="/gestionale-cn/privacy">Leggi informativa privacy completa</a>
                        </section>
                        <footer>
                            <button pButton type="button" label="Chiudi" severity="secondary" outlined (click)="mailPreview = null"></button>
                            <button pButton type="button" label="Segna invito inviato" icon="pi pi-send" (click)="inviaInvito(mailPreview)"></button>
                        </footer>
                    </section>
                </div>
            }
        </section>
    `,
    styles: [
        `
            .census-page { display: grid; gap: 1.25rem; }
            .page-head, .form-card, .list-card, .notifications, .action-message { border: 1px solid #e5e7eb; border-radius: 14px; background: #fff; box-shadow: 0 10px 26px rgba(15, 23, 42, .06); }
            .page-head { display: flex; justify-content: space-between; align-items: center; gap: 1rem; padding: 1.25rem; }
            .page-head span, .section-title span, .form-intro p, .unit-row span, .unit-row small, .notifications span { color: #64748b; }
            .page-head h1, .form-card h2, .list-card h2 { margin: .2rem 0; }
            .page-head p { margin: 0; color: #64748b; }
            .back-link { color: #0f3558; font-weight: 800; text-decoration: none; }
            .action-message { display: inline-flex; width: fit-content; align-items: center; gap: .45rem; padding: .65rem .85rem; color: #166534; background: #dcfce7; }
            .notifications { display: grid; gap: .35rem; padding: 1rem; background: #f8fafc; }
            .form-card, .list-card { padding: 1.1rem; }
            .form-intro { margin-bottom: 1rem; }
            .unit-form { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: .9rem; }
            .unit-form div { display: grid; gap: .35rem; }
            label { color: #334155; font-weight: 800; font-size: .86rem; }
            input, p-select { width: 100%; }
            .form-actions, .row-actions, .mail-modal footer { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: .55rem; margin-top: 1rem; }
            .section-title { display: flex; justify-content: space-between; align-items: center; gap: 1rem; margin-bottom: 1rem; }
            .unit-list { display: grid; gap: .8rem; }
            .unit-row { display: grid; grid-template-columns: minmax(13rem, 1.4fr) minmax(12rem, 1fr) repeat(3, minmax(8rem, .8fr)) minmax(20rem, 1.4fr); gap: .75rem; align-items: center; padding: .9rem; border: 1px solid #e5e7eb; border-radius: 12px; background: #fbfbf8; }
            .unit-row strong { display: block; color: #111827; }
            .modal-backdrop { position: fixed; inset: 0; z-index: 10000; display: flex; align-items: center; justify-content: center; padding: 1rem; background: rgba(15, 23, 42, .42); }
            .mail-modal { width: min(100%, 680px); display: grid; gap: .7rem; padding: 1.25rem; border-radius: 18px; background: #fff; box-shadow: 0 24px 70px rgba(15, 23, 42, .25); }
            .mail-modal h2 { margin: .15rem 0 0; }
            .mail-box { padding: .85rem; border-radius: 12px; background: #f8fafc; border: 1px solid #e5e7eb; white-space: pre-wrap; color: #334155; font: inherit; }
            .privacy-owner { display: grid; gap: .25rem; padding: .85rem; border-radius: 12px; border: 1px solid #e5e7eb; background: #f8fafc; color: #334155; }
            .privacy-owner strong { color: #0f3558; }
            .privacy-owner a { color: #0f3558; font-weight: 800; text-decoration: none; }
            @media (max-width: 1100px) { .unit-form, .unit-row { grid-template-columns: 1fr 1fr; } .row-actions { grid-column: 1 / -1; justify-content: flex-start; } }
            @media (max-width: 767px) { .page-head, .section-title { align-items: flex-start; flex-direction: column; } .unit-form, .unit-row { grid-template-columns: 1fr; } .form-actions, .row-actions, .mail-modal footer { flex-direction: column; } button { min-height: 44px; } }
        `
    ]
})
export class CensimentoComunita {
    privacyConfig = PRIVACY_CONFIG;
    tipiUnita: TipoUnitaMembroComunita[] = ['Coppia', 'Fratello singolo', 'Sorella singola'];
    tipoUnita: TipoUnitaMembroComunita = 'Coppia';
    unita = leggiUnitaCensimento();
    notifiche = leggiNotificheCensimento();
    mailPreview: UnitaCensimentoComunita | null = null;
    unitaInModifica: UnitaCensimentoComunita | null = null;
    messaggio = '';
    form = this.creaFormVuoto();

    resetFormTipo() {
        this.form = this.creaFormVuoto();
        this.unitaInModifica = null;
    }

    salvaUnitaDaForm() {
        const item = this.creaUnitaDaForm();
        if (!item) {
            this.messaggio = 'Compila almeno nome, cognome ed email di riferimento.';
            return null;
        }

        if (this.unitaInModifica) {
            this.unita = this.unita.map((unita) => (unita.id === this.unitaInModifica?.id ? { ...this.unitaInModifica, ...item, id: unita.id } : unita));
        } else {
            this.unita = [...this.unita, { ...item, id: this.prossimoId() }];
        }
        salvaUnitaCensimento(this.unita);
        this.messaggio = 'Bozza censimento salvata. L’unità compare nella pagina La tua Comunità.';
        this.annullaModifica();
        return item;
    }

    salvaBozza() {
        salvaUnitaCensimento(this.unita);
        this.messaggio = 'Bozza censimento salvata';
    }

    inviaInvitoDaForm() {
        const creato = this.salvaUnitaDaForm();
        if (creato) {
            const salvato = this.unita.at(-1);
            if (salvato) {
                this.inviaInvito(salvato);
            }
        }
    }

    modificaUnita(item: UnitaCensimentoComunita) {
        this.unitaInModifica = item;
        this.tipoUnita = item.tipoUnita;
        this.form.email = item.emailRiferimento;
        this.form.telefono = item.telefonoRiferimento;
        if (item.tipoUnita === 'Coppia') {
            this.form.nomeMarito = item.persone[0]?.nome ?? '';
            this.form.cognomeMarito = item.persone[0]?.cognome ?? '';
            this.form.nomeMoglie = item.persone[1]?.nome ?? '';
            this.form.cognomeMoglie = item.persone[1]?.cognome ?? '';
        } else {
            this.form.nome = item.persone[0]?.nome ?? '';
            this.form.cognome = item.persone[0]?.cognome ?? '';
        }
    }

    annullaModifica() {
        this.unitaInModifica = null;
        this.tipoUnita = 'Coppia';
        this.form = this.creaFormVuoto();
    }

    eliminaUnita(id: number) {
        this.unita = this.unita.filter((item) => item.id !== id);
        salvaUnitaCensimento(this.unita);
        this.messaggio = 'Unità eliminata dalla bozza';
    }

    inviaInvito(item: UnitaCensimentoComunita) {
        const token = item.token || generaTokenCensimento(item.id);
        const aggiornato = { ...item, token, linkInvito: creaLinkInvito(token), statoInvito: 'Inviato' as const };
        this.unita = this.unita.map((unita) => (unita.id === item.id ? aggiornato : unita));
        salvaUnitaCensimento(this.unita);
        this.mailPreview = aggiornato;
        this.messaggio = 'Invito mock generato e segnato come inviato';
    }

    apriAnteprimaMail(item: UnitaCensimentoComunita) {
        const token = item.token || generaTokenCensimento(item.id);
        this.mailPreview = { ...item, token, linkInvito: item.linkInvito || creaLinkInvito(token) };
    }

    corpoMail(item: UnitaCensimentoComunita) {
        const link = item.linkInvito || creaLinkInvito(item.token || 'token-mock');
        const base = `Pace,

sei stato invitato dal responsabile della tua comunità a completare l'anagrafica e i consensi per il gestionale Eventi di Comunità.
`;
        const unita = item.tipoUnita === 'Coppia' ? `
Unità:
${item.nomeVisualizzato}
` : '';
        const coppia = item.tipoUnita === 'Coppia' ? `
Se siete una coppia, ogni persona dovrà confermare separatamente i propri dati e consensi.
` : '';
        return `${base}${unita}
Per completare i dati, apri questo link:
${link}

Il link è personale e serve solo per completare anagrafica e consensi.${coppia}
Titolare del trattamento: ${PRIVACY_CONFIG.titolareBreve}
Email privacy: ${PRIVACY_CONFIG.emailPrivacy}
Informativa privacy completa: ${window.location.origin}/privacy

Grazie.

Eventi di Comunità`;
    }

    getInvitoSeverity(stato: string) {
        return stato === 'Attivo' ? 'success' : stato === 'Inviato' ? 'info' : stato === 'Da completare' ? 'warn' : 'secondary';
    }

    getConsensiSeverity(stato: string) {
        return stato === 'Raccolto' ? 'success' : stato === 'Parziale' ? 'warn' : 'secondary';
    }

    private creaUnitaDaForm(): UnitaCensimentoComunita | null {
        const email = this.form.email.trim();
        const telefono = this.form.telefono.trim();
        if (this.tipoUnita === 'Coppia') {
            const marito = { nome: this.form.nomeMarito.trim(), cognome: this.form.cognomeMarito.trim() };
            const moglie = { nome: this.form.nomeMoglie.trim(), cognome: this.form.cognomeMoglie.trim() };
            if (!marito.nome || !marito.cognome || !moglie.nome || !moglie.cognome || !email) {
                return null;
            }
            const stessoCognome = marito.cognome === moglie.cognome;
            return this.creaBaseUnita(stessoCognome ? `${marito.nome} e ${moglie.nome} ${marito.cognome}` : `${marito.nome} ${marito.cognome} e ${moglie.nome} ${moglie.cognome}`, email, telefono, [
                { id: 1, nome: marito.nome, cognome: marito.cognome, email, telefono, dataNascita: '', consensoInformativo: false, consensoPrivacy: false, consensoComunicazioni: false },
                { id: 2, nome: moglie.nome, cognome: moglie.cognome, email, telefono, dataNascita: '', consensoInformativo: false, consensoPrivacy: false, consensoComunicazioni: false }
            ]);
        }

        const nome = this.form.nome.trim();
        const cognome = this.form.cognome.trim();
        if (!nome || !cognome || !email) {
            return null;
        }
        return this.creaBaseUnita(`${nome} ${cognome}`, email, telefono, [{ id: 1, nome, cognome, email, telefono, dataNascita: '', consensoInformativo: false, consensoPrivacy: false, consensoComunicazioni: false }]);
    }

    private creaBaseUnita(nomeVisualizzato: string, email: string, telefono: string, persone: UnitaCensimentoComunita['persone']): UnitaCensimentoComunita {
        return {
            id: this.unitaInModifica?.id ?? this.prossimoId(),
            tipoUnita: this.tipoUnita,
            nomeVisualizzato,
            emailRiferimento: email,
            telefonoRiferimento: telefono,
            statoInvito: this.unitaInModifica?.statoInvito ?? 'Da inviare',
            statoAnagrafica: this.unitaInModifica?.statoAnagrafica ?? 'Da completare',
            statoConsensi: this.unitaInModifica?.statoConsensi ?? 'Da inviare',
            token: this.unitaInModifica?.token ?? '',
            linkInvito: this.unitaInModifica?.linkInvito ?? '',
            persone,
            note: 'Bozza censimento responsabile'
        };
    }

    private prossimoId() {
        return this.unita.length ? Math.max(...this.unita.map((item) => item.id)) + 1 : 1;
    }

    private creaFormVuoto() {
        return { nome: '', cognome: '', nomeMarito: '', cognomeMarito: '', nomeMoglie: '', cognomeMoglie: '', email: '', telefono: '' };
    }
}
