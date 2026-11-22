import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { CommunityApiService, CommunityMemberDetail, MemberWrite, SpouseOptions, MemberInvitationAction, memberInvitationAction } from '../../services/community-api.service';
import { CurrentUserService } from '../../auth/current-user.service';
import { memberContactLinks } from './member-contact-links';
import { communityRoleLabel } from '../../auth/community-roles';
import { MemberDraft, MemberEditor } from './member-editor';
import { CommunityMemberInvitation } from './community-member-invitation';

@Component({
  selector: 'app-mobile-community-member', standalone: true,
  imports: [RouterLink, MemberEditor, CommunityMemberInvitation], styleUrl: './mobile-community.scss',
  styles: [`.contact-actions{display:grid;gap:10px;margin-top:10px}.contact-actions a.secondary{display:flex;align-items:center;justify-content:center;gap:8px;min-height:48px;padding:12px;width:100%}`],
  template: `

    @if (loading) { <div class="skeleton" role="status" aria-label="Caricamento scheda"></div> }
    @else {
      @if (error) { <p class="feedback" role="alert">{{ error }}</p><button class="secondary" type="button" (click)="load(id)">Riprova</button> }
      @if (creating && allowed || editing) {
        <h1>{{ creating ? 'Aggiungi fratello' : 'Modifica scheda' }}</h1>
        <app-member-editor [draft]="draft" [roles]="roles" [busy]="busy"
          [editPhone]="creating || !!detail?.canEditPhone" [editEmail]="creating || !!detail?.canEditEmail"
          [editBirth]="creating || !!detail?.canEditBirthDate" [editSpouse]="manageSpouse" [spouseCandidates]="spouseOptions?.candidates || []"
          (saved)="save()" (cancelled)="cancel()" />
      } @else if (detail) {
        <header class="profile-head"><span class="avatar">
          @if (detail.member.photoUrl && !photoFailed) { <img [src]="detail.member.photoUrl" alt="" (error)="photoFailed = true" /> }
          @else { {{ detail.member.firstName.charAt(0) }}{{ detail.member.lastName.charAt(0) }} }
        </span><div><h1>{{ detail.member.firstName }} {{ detail.member.lastName }}</h1><p>{{ roleLabel(detail.member.role) }}</p></div></header>
        <dl>
          <dt>Nome</dt><dd>{{ detail.member.firstName }}</dd><dt>Cognome</dt><dd>{{ detail.member.lastName }}</dd>
          <dt>Compleanno</dt><dd>{{ birthdayLabel }}</dd>
          <dt>Telefono</dt><dd>@if (detail.member.phoneNumber) { <span>{{ detail.member.phoneNumber }}</span>@if (contactLinks; as links) { <div class="contact-actions"><a class="secondary" [href]="links.call"><i class="pi pi-phone" aria-hidden="true"></i> Chiama</a><a class="secondary" [href]="links.whatsapp" target="_blank" rel="noopener noreferrer"><i class="pi pi-whatsapp" aria-hidden="true"></i> WhatsApp</a></div> } } @else { Non disponibile }</dd>
          <dt>Email</dt><dd>@if (detail.member.email) { <span>{{ detail.member.email }}</span><div class="contact-actions"><a class="secondary" [href]="'mailto:' + detail.member.email"><i class="pi pi-envelope" aria-hidden="true"></i> Email</a></div> } @else { Non disponibile }</dd>
          <dt>Tappa del Cammino</dt><dd>{{ detail.stage || 'Non indicata' }}</dd>
          <dt>Ruolo nella comunità</dt><dd>{{ roleLabel(detail.member.role) }}</dd>
          <dt>Account</dt><dd>{{ invitationAction === 'ACCOUNT_LINKED' ? 'Account collegato' : 'Non ancora registrato' }}</dd>
          <dt>Coniuge</dt><dd>@if (detail.spouse) { <a [routerLink]="'/mobile/community/member/' + detail.spouse.personId">{{ detail.spouse.firstName }} {{ detail.spouse.lastName }}</a> } @else { Non disponibile }</dd>
        </dl>
        @if (detail.canEdit) { <button class="primary" type="button" [disabled]="busy" (click)="edit()">Modifica scheda</button> }
        @if (invitationAction === 'INVITE' || invitationAction === 'ADD_EMAIL' || invitationAction === 'PENDING') { <app-community-member-invitation [personId]="detail.member.personId" [email]="detail.member.email?.trim() || ''" [pending]="invitationAction === 'PENDING'" /> }
        @if (detail.isSelf) { <a class="back" routerLink="/mobile/complete-profile">Completa il tuo profilo</a> }
        @if (detail.isSelf) { <a class="back" routerLink="/mobile/privacy"><i class="pi pi-bell" aria-hidden="true"></i> Preferenze notifiche</a> }
      }
      @if (feedback) { <p class="feedback" role="status">{{ feedback }}</p> }
    }
  `
})
export class MobileCommunityMember implements OnInit, OnDestroy {
  private readonly api = inject(CommunityApiService);
  private readonly current = inject(CurrentUserService);
  protected get invitationAction(): MemberInvitationAction { return this.detail ? memberInvitationAction(this.detail, this.current.context()) : 'FORBIDDEN'; }
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private subscription?: Subscription;
  private generation = 0;
  protected id: number | null = null;
  protected creating = false;
  protected allowed = false;
  protected loading = true;
  protected editing = false;
  protected busy = false;
  protected error = '';
  protected feedback = '';
  protected photoFailed = false;
  protected detail: CommunityMemberDetail | null = null;
  protected roles: string[] = [];
  protected manageSpouse = false;
  protected spouseOptions: SpouseOptions | null = null;
  protected draft: MemberDraft = this.emptyDraft();
  protected readonly roleLabel = communityRoleLabel;
  protected get contactLinks(): { call: string; whatsapp: string } | null { return memberContactLinks(this.detail?.member.phoneNumber); }
  protected get birthdayLabel(): string {
    if (this.detail?.member.birthdayLabel) return this.detail.member.birthdayLabel;
    const birth = this.detail?.member.birthDate;
    if (!birth) return 'Non disponibile';
    const date = new Date(birth + 'T00:00:00Z');
    return Number.isNaN(date.getTime()) ? 'Non disponibile' : new Intl.DateTimeFormat('it-IT', {day:'numeric',month:'long',timeZone:'UTC'}).format(date);
  }
  ngOnInit(): void { this.subscription = this.route.paramMap.subscribe(params => { const raw = params.get('id'); void this.load(raw === null ? null : Number(raw)); }); }
  ngOnDestroy(): void { this.generation++; this.subscription?.unsubscribe(); }
  private emptyDraft(): MemberDraft { return { firstName: '', lastName: '', email: '', phone: '', birthDate: '', stage: '', role: 'MEMBER', spouseId: null }; }
  protected async load(id: number | null): Promise<void> {
    const generation = ++this.generation;
    this.id = id; this.creating = id === null; this.loading = true; this.error = ''; this.feedback = '';
    this.detail = null; this.editing = false; this.allowed = false; this.photoFailed = false;
    this.manageSpouse = false; this.spouseOptions = null;
    try {
      if (this.creating) {
        const data = await this.api.getCommunity(); if (generation !== this.generation) return;
        if (!data.canAddMember) throw new Error();
        if (data.canManageMarriage) {
          const options = await this.api.getSpouseOptions(); if (generation !== this.generation) return;
          this.spouseOptions = options; this.manageSpouse = true;
        }
        this.allowed = true; this.roles = data.assignableRoles; this.draft = this.emptyDraft();
      } else {
        if (!Number.isSafeInteger(id) || id! <= 0) throw new Error();
        const detail = await this.api.getMember(id!); if (generation !== this.generation) return;
        this.detail = detail;
      }
    } catch { if (generation === this.generation) this.error = 'Scheda non disponibile o operazione non autorizzata. Controlla la connessione e riprova.'; }
    finally { if (generation === this.generation) this.loading = false; }
  }
  protected async edit(): Promise<void> {
    if (this.busy || !this.detail?.canEdit) return;
    const generation = this.generation;
    this.busy = true; this.error = '';
    try {
      if (this.detail.canManageMarriage) {
        const options = await this.api.getSpouseOptions(this.id!); if (generation !== this.generation) return;
        this.spouseOptions = options; this.manageSpouse = true;
      }
    const member = this.detail.member;
    this.draft = { firstName: member.firstName, lastName: member.lastName, email: member.email ?? '', phone: member.phoneNumber ?? '', birthDate: member.birthDate ?? '', stage: this.detail.stage, role: member.role, spouseId: this.spouseOptions?.currentSpouseId ?? null };
    this.roles = this.detail.assignableRoles; this.editing = true; this.error = ''; this.feedback = '';
    } catch { this.error = 'Impossibile aprire la modifica. Aggiorna la scheda e riprova.'; }
    finally { this.busy = false; }
  }
  protected cancel(): void { if (this.creating) void this.router.navigateByUrl('/mobile/community'); else this.editing = false; }
  protected async save(): Promise<void> {
    if (this.busy || !(this.creating ? this.allowed : this.detail?.canEdit)) return;
    if (!this.draft.firstName.trim()) { this.error = 'Inserisci il nome.'; return; }
    this.busy = true; this.error = '';
    const payload: MemberWrite = { firstName: this.draft.firstName.trim(), lastName: this.draft.lastName.trim(), stage: this.draft.stage, role: this.draft.role };
    if (this.creating || this.detail?.canEditEmail) payload.email = this.draft.email.trim();
    if (this.creating || this.detail?.canEditPhone) payload.phone = this.draft.phone.trim();
    if (this.creating || this.detail?.canEditBirthDate) {
      if (this.draft.birthDate) payload.birthDate = this.draft.birthDate;
      else if (!this.creating && this.detail?.member.birthDate) payload.clearBirthDate = true;
    }
    if (this.manageSpouse && this.draft.spouseId !== (this.spouseOptions?.currentSpouseId ?? null)) {
      payload.updateSpouse = true; payload.spouseId = this.draft.spouseId; payload.expectedMarriageId = this.spouseOptions?.currentMarriageId ?? null;
    }
    try {
      if (this.creating) {
        await this.api.createMember(payload);
        await this.router.navigateByUrl('/mobile/community');
      } else {
        await this.api.updateMember(this.id!, payload); await this.load(this.id); this.feedback = 'Scheda aggiornata.';
      }
    } catch (error: any) { this.error = error?.status === 409 ? 'Dati o collegamento già presenti o modificati. Aggiorna e verifica prima di riprovare.' : 'Salvataggio non riuscito. Verifica i dati e riprova.'; }
    finally { this.busy = false; }
  }
}
