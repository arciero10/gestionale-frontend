import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import {
    CommunityMemberMock,
    StatoFratello,
    absoluteInviteLink,
    addManualCommunityMember,
    inviteCommunityMember,
    privacyFratelloLabel,
    readCommunityMembers,
    resendInvite,
    statoFratelloLabel,
    updateCommunityMember
} from '../data/community-members.mock';
import { getCurrentCommunity } from '../data/community-selection.storage';

type MemberForm = {
    nome: string;
    cognome: string;
    email: string;
    telefono: string;
    sesso: string;
    dataNascita: string;
    ruoloComunitario: string;
    note: string;
};

@Component({
    selector: 'app-membri-comunita',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule],
    template: `
        <section class="members-page">
            <header class="page-hero">
                <div>
                    <span>Responsabile Comunità</span>
                    <h1>Membri comunità</h1>
                    <p>{{ community.nomeComunita }} - {{ community.parrocchiaNome }}</p>
                </div>
                <div class="hero-actions">
                    <button pButton type="button" label="Aggiungi fratello" icon="pi pi-user-plus" (click)="mode = 'manuale'"></button>
                    <button pButton type="button" label="Invita fratello" icon="pi pi-send" severity="secondary" (click)="mode = 'invito'"></button>
                </div>
            </header>

            <section class="privacy-note">
                <i class="pi pi-shield"></i>
                <p>Mock privacy: il responsabile inserisce solo dati base. Anagrafica completa e consensi devono essere confermati personalmente dal fratello tramite link invito.</p>
            </section>

            <section class="stats-grid" aria-label="Riepilogo membri">
                <div><strong>{{ members.length }}</strong><span>Totale fratelli</span></div>
                <div><strong>{{ countBy('COMPLETATO') }}</strong><span>Completati</span></div>
                <div><strong>{{ privacyMissingCount }}</strong><span>Privacy mancante</span></div>
                <div><strong>{{ inviteSentCount }}</strong><span>Inviti inviati</span></div>
                <div><strong>{{ toCompleteCount }}</strong><span>Da completare</span></div>
            </section>

            @if (feedback) {
                <div class="feedback" [class.error]="feedbackType === 'error'">{{ feedback }}</div>
            }

            @if (mode !== 'lista') {
                <section class="form-panel">
                    <div class="panel-head">
                        <div>
                            <span>{{ mode === 'manuale' ? 'Inserimento manuale' : 'Invito mock' }}</span>
                            <h2>{{ mode === 'manuale' ? 'Aggiungi fratello' : 'Invita fratello' }}</h2>
                        </div>
                        <button pButton type="button" label="Chiudi" icon="pi pi-times" text (click)="closeForm()"></button>
                    </div>

                    <form class="member-form" (ngSubmit)="saveForm()">
                        <label>Nome <input name="nome" [(ngModel)]="form.nome" required /></label>
                        <label>Cognome <input name="cognome" [(ngModel)]="form.cognome" required /></label>
                        <label>Email <input name="email" type="email" [(ngModel)]="form.email" required /></label>
                        <label>Telefono <input name="telefono" [(ngModel)]="form.telefono" /></label>

                        @if (mode === 'manuale') {
                            <label>Sesso
                                <select name="sesso" [(ngModel)]="form.sesso">
                                    <option value="">Non indicato</option>
                                    <option>Maschio</option>
                                    <option>Femmina</option>
                                </select>
                            </label>
                            <label>Data nascita <input name="dataNascita" type="date" [(ngModel)]="form.dataNascita" /></label>
                            <label>Ruolo comunitario <input name="ruoloComunitario" [(ngModel)]="form.ruoloComunitario" placeholder="Es. Ostiario, Cantore..." /></label>
                            <label class="full">Note <textarea name="note" [(ngModel)]="form.note" rows="3"></textarea></label>
                        }

                        <div class="form-actions">
                            <button pButton type="submit" [label]="mode === 'manuale' ? 'Salva fratello' : 'Invia invito mock'" icon="pi pi-check"></button>
                            <button pButton type="button" label="Annulla" severity="secondary" outlined (click)="closeForm()"></button>
                        </div>
                    </form>
                </section>
            }

            <section class="list-panel">
                <div class="filters">
                    <label>Ricerca <input [(ngModel)]="search" placeholder="Nome, cognome, email" /></label>
                    <label>Stato
                        <select [(ngModel)]="statusFilter">
                            <option value="">Tutti</option>
                            @for (status of statusOptions; track status) {
                                <option [value]="status">{{ statoLabel(status) }}</option>
                            }
                        </select>
                    </label>
                </div>

                @if (filteredMembers.length === 0) {
                    <div class="empty-state">
                        <i class="pi pi-users"></i>
                        <strong>Nessun fratello trovato</strong>
                        <p>Usa “Aggiungi fratello” oppure “Invita fratello” per iniziare il censimento mock.</p>
                    </div>
                } @else {
                    <div class="member-list">
                        @for (member of filteredMembers; track member.id) {
                            <article class="member-row" [class.selected]="selected?.id === member.id">
                                <button type="button" class="member-main" (click)="selectMember(member)">
                                    <span class="avatar">{{ initials(member) }}</span>
                                    <span>
                                        <strong>{{ member.nome }} {{ member.cognome }}</strong>
                                        <small>{{ member.email }} · {{ member.telefono || 'Telefono non indicato' }}</small>
                                    </span>
                                </button>
                                <span class="badge" [class.done]="member.statoProfilo === 'COMPLETATO'">{{ statoLabel(member.statoProfilo) }}</span>
                                <span class="badge privacy" [class.done]="member.statoPrivacy === 'COMPLETATA'">{{ privacyLabel(member) }}</span>
                                <button pButton type="button" label="Dettaglio" size="small" outlined (click)="selectMember(member)"></button>
                            </article>
                        }
                    </div>
                }
            </section>

            @if (selected) {
                <section class="detail-panel">
                    <div class="panel-head">
                        <div>
                            <span>Scheda fratello</span>
                            <h2>{{ selected.nome }} {{ selected.cognome }}</h2>
                        </div>
                        <button pButton type="button" label="Chiudi" icon="pi pi-times" text (click)="selected = null"></button>
                    </div>

                    <dl class="detail-grid">
                        <div><dt>Email</dt><dd>{{ selected.email }}</dd></div>
                        <div><dt>Telefono</dt><dd>{{ selected.telefono || '—' }}</dd></div>
                        <div><dt>Profilo</dt><dd>{{ statoLabel(selected.statoProfilo) }}</dd></div>
                        <div><dt>Privacy</dt><dd>{{ privacyLabel(selected) }}</dd></div>
                        <div><dt>Origine</dt><dd>{{ selected.origine === 'INVITATO_DAL_RESPONSABILE' ? 'Invitato dal responsabile' : 'Inserito dal responsabile' }}</dd></div>
                        <div><dt>Creato il</dt><dd>{{ selected.createdAt | date: 'short' }}</dd></div>
                        <div><dt>Completato il</dt><dd>{{ selected.completedAt ? (selected.completedAt | date: 'short') : '—' }}</dd></div>
                        <div><dt>Note</dt><dd>{{ selected.note || '—' }}</dd></div>
                    </dl>

                    @if (selected.inviteLink) {
                        <div class="invite-box">
                            <strong>Link invito</strong>
                            <code>{{ inviteUrl(selected) }}</code>
                        </div>
                    }

                    <div class="detail-actions">
                        <button pButton type="button" label="Modifica" icon="pi pi-pencil" outlined (click)="mode = 'manuale'; fillForm(selected)"></button>
                        <button pButton type="button" label="Reinvia invito" icon="pi pi-send" (click)="resend(selected)"></button>
                        <button pButton type="button" label="Copia link" icon="pi pi-copy" severity="secondary" outlined (click)="copyInvite(selected)"></button>
                        <button pButton type="button" label="Email mock" icon="pi pi-envelope" severity="secondary" outlined (click)="shareEmail(selected)"></button>
                        <button pButton type="button" label="WhatsApp mock" icon="pi pi-whatsapp" severity="secondary" outlined (click)="shareWhatsapp(selected)"></button>
                        <button pButton type="button" label="Completato" icon="pi pi-check" severity="success" outlined (click)="markStatus(selected, 'COMPLETATO')"></button>
                        <button pButton type="button" label="Da verificare" icon="pi pi-flag" severity="warn" outlined (click)="markStatus(selected, 'DA_VERIFICARE')"></button>
                        <button pButton type="button" label="Archivia" icon="pi pi-folder" severity="danger" outlined (click)="markStatus(selected, 'ARCHIVIATO')"></button>
                    </div>
                </section>
            }
        </section>
    `,
    styles: [`
        :host { display:block; }
        .members-page { max-width:1180px; margin:0 auto; padding:clamp(.75rem,1.8vw,1.25rem); display:grid; gap:1rem; }
        .page-hero,.privacy-note,.stats-grid>div,.form-panel,.list-panel,.detail-panel {
            border:1px solid rgba(255,255,255,.72); border-radius:16px; background:rgba(255,252,245,.95);
            box-shadow:0 16px 34px rgba(31,41,55,.16); backdrop-filter:blur(10px);
        }
        .page-hero { padding:1.15rem; display:flex; justify-content:space-between; gap:1rem; align-items:center; }
        .page-hero span,.panel-head span { color:#476078; font-size:.78rem; font-weight:900; text-transform:uppercase; }
        h1,h2,p { margin:0; } h1,h2 { color:#111827; } p,small,dt { color:#334155; line-height:1.42; }
        .hero-actions,.form-actions,.detail-actions { display:flex; flex-wrap:wrap; gap:.55rem; }
        .privacy-note { padding:.8rem 1rem; display:flex; gap:.7rem; align-items:flex-start; color:#0f3558; }
        .stats-grid { display:grid; grid-template-columns:repeat(5,minmax(0,1fr)); gap:.75rem; }
        .stats-grid>div { padding:1rem; display:grid; gap:.15rem; } .stats-grid strong { color:#0f172a; font-size:1.6rem; } .stats-grid span { color:#475569; font-weight:800; }
        .feedback { padding:.75rem 1rem; border-radius:12px; background:#ecfdf5; color:#166534; font-weight:850; } .feedback.error { background:#fef2f2; color:#991b1b; }
        .form-panel,.list-panel,.detail-panel { padding:1rem; display:grid; gap:.9rem; }
        .panel-head { display:flex; justify-content:space-between; gap:1rem; align-items:center; }
        .member-form,.filters { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:.75rem; }
        label { display:grid; gap:.3rem; color:#1e293b; font-weight:850; }
        input,select,textarea { width:100%; min-height:40px; border:1px solid #cbd5e1; border-radius:10px; padding:.55rem .65rem; color:#0f172a; background:#fff; }
        textarea { resize:vertical; } .full,.form-actions { grid-column:1/-1; }
        .member-list { display:grid; gap:.55rem; }
        .member-row { display:grid; grid-template-columns:minmax(0,1fr) auto auto auto; gap:.6rem; align-items:center; padding:.65rem; border-radius:13px; background:rgba(255,255,255,.72); border:1px solid rgba(31,41,55,.08); }
        .member-row.selected { outline:2px solid #2f867c; }
        .member-main { display:grid; grid-template-columns:2.5rem minmax(0,1fr); gap:.65rem; align-items:center; text-align:left; border:0; background:transparent; cursor:pointer; }
        .avatar { width:2.5rem; height:2.5rem; display:grid; place-items:center; border-radius:12px; color:#fff; background:#547fa3; font-weight:900; }
        .member-main strong,.member-main small { display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .member-main strong { color:#0f172a; }
        .badge { display:inline-flex; justify-content:center; padding:.35rem .55rem; border-radius:999px; background:#fef3c7; color:#92400e; font-weight:850; white-space:nowrap; }
        .badge.privacy { background:#eef2ff; color:#3730a3; } .badge.done { background:#ecfdf5; color:#166534; }
        .empty-state { min-height:10rem; display:grid; place-items:center; text-align:center; gap:.35rem; color:#475569; }
        .empty-state i { font-size:2rem; color:#547fa3; }
        .detail-grid { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:.7rem; margin:0; }
        .detail-grid div { padding:.65rem; border-radius:12px; background:#fff; border:1px solid #e2e8f0; }
        dt { font-size:.75rem; font-weight:900; } dd { margin:.15rem 0 0; color:#0f172a; font-weight:750; overflow-wrap:anywhere; }
        .invite-box { display:grid; gap:.35rem; padding:.75rem; border-radius:12px; background:#f8fafc; border:1px dashed #94a3b8; }
        code { color:#0f172a; white-space:normal; overflow-wrap:anywhere; }
        @media (max-width:960px){ .page-hero{align-items:stretch;flex-direction:column}.stats-grid{grid-template-columns:repeat(2,1fr)}.member-form,.filters,.detail-grid{grid-template-columns:1fr 1fr}.member-row{grid-template-columns:1fr}.badge{justify-content:flex-start;width:fit-content} }
        @media (max-width:620px){ .stats-grid,.member-form,.filters,.detail-grid{grid-template-columns:1fr}.hero-actions,.detail-actions{display:grid}.hero-actions>*{width:100%} }
    `]
})
export class MembriComunita {
    readonly community = getCurrentCommunity();
    members = readCommunityMembers();
    selected: CommunityMemberMock | null = null;
    mode: 'lista' | 'manuale' | 'invito' = 'lista';
    search = '';
    statusFilter: StatoFratello | '' = '';
    editingId: string | null = null;
    feedback = '';
    feedbackType: 'success' | 'error' = 'success';
    statusOptions: StatoFratello[] = ['DA_COMPLETARE', 'INVITO_DA_INVIARE', 'INVITO_INVIATO', 'IN_COMPILAZIONE', 'COMPLETATO', 'PRIVACY_MANCANTE', 'DA_VERIFICARE', 'ARCHIVIATO'];
    form: MemberForm = this.emptyForm();

    get filteredMembers(): CommunityMemberMock[] {
        const query = this.search.trim().toLowerCase();
        return this.members.filter((member) => {
            const matchesQuery = !query || `${member.nome} ${member.cognome} ${member.email}`.toLowerCase().includes(query);
            const matchesStatus = !this.statusFilter || member.statoProfilo === this.statusFilter;
            return matchesQuery && matchesStatus;
        });
    }

    get privacyMissingCount(): number {
        return this.members.filter((member) => member.statoPrivacy !== 'COMPLETATA').length;
    }

    get inviteSentCount(): number {
        return this.members.filter((member) => member.statoInvito === 'INVIATO').length;
    }

    get toCompleteCount(): number {
        return this.members.filter((member) => member.statoProfilo !== 'COMPLETATO' && member.statoProfilo !== 'ARCHIVIATO').length;
    }

    countBy(status: StatoFratello): number {
        return this.members.filter((member) => member.statoProfilo === status).length;
    }

    saveForm(): void {
        if (!this.form.nome.trim() || !this.form.cognome.trim() || !this.form.email.trim()) {
            this.showFeedback('Compila nome, cognome ed email.', 'error');
            return;
        }

        const payload = { ...this.form };
        let member: CommunityMemberMock;

        if (this.editingId) {
            const current = this.members.find((item) => item.id === this.editingId);
            if (!current) {
                this.showFeedback('Scheda non trovata.', 'error');
                return;
            }
            member = { ...current, ...payload };
            updateCommunityMember(member);
        } else {
            member = this.mode === 'invito' ? inviteCommunityMember(payload) : addManualCommunityMember(payload);
        }

        this.members = readCommunityMembers();
        this.selected = member;
        this.showFeedback(this.editingId ? 'Scheda fratello aggiornata.' : this.mode === 'invito' ? 'Invito simulato inviato.' : 'Fratello salvato localmente.');
        this.form = this.emptyForm();
        this.editingId = null;
        this.mode = 'lista';
    }

    fillForm(member: CommunityMemberMock): void {
        this.form = {
            nome: member.nome,
            cognome: member.cognome,
            email: member.email,
            telefono: member.telefono || '',
            sesso: member.sesso || '',
            dataNascita: member.dataNascita || '',
            ruoloComunitario: member.ruoloComunitario || '',
            note: member.note || ''
        };
        this.editingId = member.id;
    }

    selectMember(member: CommunityMemberMock): void {
        this.selected = member;
    }

    closeForm(): void {
        this.mode = 'lista';
        this.form = this.emptyForm();
        this.editingId = null;
    }

    resend(member: CommunityMemberMock): void {
        const updated = resendInvite(member);
        this.refresh(updated);
        this.showFeedback('Invito email mock reinviato.');
    }

    copyInvite(member: CommunityMemberMock): void {
        const link = this.ensureInvite(member);
        void navigator.clipboard?.writeText(link);
        this.showFeedback('Link invito copiato.');
    }

    shareWhatsapp(member: CommunityMemberMock): void {
        const link = this.ensureInvite(member);
        const text = encodeURIComponent(`Sei stato invitato dal responsabile della tua comunità a completare la tua scheda personale e i consensi privacy. ${link}`);
        window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer');
    }

    shareEmail(member: CommunityMemberMock): void {
        const link = this.ensureInvite(member);
        const subject = encodeURIComponent('Invito completamento scheda comunità');
        const body = encodeURIComponent(`Ciao ${member.nome},\n\ncompleta la tua scheda personale e i consensi privacy da questo link:\n${link}\n\nGrazie.`);
        window.location.href = `mailto:${member.email}?subject=${subject}&body=${body}`;
    }

    markStatus(member: CommunityMemberMock, status: StatoFratello): void {
        const updated = { ...member, statoProfilo: status };
        updateCommunityMember(updated);
        this.refresh(updated);
        this.showFeedback(status === 'ARCHIVIATO' ? 'Fratello archiviato.' : 'Fratello segnato da verificare.');
    }

    inviteUrl(member: CommunityMemberMock): string {
        return absoluteInviteLink(member);
    }

    statoLabel(status: StatoFratello): string {
        return statoFratelloLabel(status);
    }

    privacyLabel(member: CommunityMemberMock): string {
        return privacyFratelloLabel(member.statoPrivacy);
    }

    initials(member: CommunityMemberMock): string {
        return `${member.nome.charAt(0)}${member.cognome.charAt(0)}`.toUpperCase() || 'F';
    }

    private ensureInvite(member: CommunityMemberMock): string {
        const updated = member.inviteLink ? member : resendInvite(member);
        this.refresh(updated);
        return absoluteInviteLink(updated);
    }

    private refresh(selected?: CommunityMemberMock): void {
        this.members = readCommunityMembers();
        this.selected = selected ? this.members.find((member) => member.id === selected.id) ?? selected : this.selected;
    }

    private showFeedback(message: string, type: 'success' | 'error' = 'success'): void {
        this.feedback = message;
        this.feedbackType = type;
        window.setTimeout(() => (this.feedback = ''), 3200);
    }

    private emptyForm(): MemberForm {
        return { nome: '', cognome: '', email: '', telefono: '', sesso: '', dataNascita: '', ruoloComunitario: '', note: '' };
    }
}
