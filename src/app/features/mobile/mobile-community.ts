import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommunityOverview } from './community-overview';
import { DatePipe } from '@angular/common';
import { CommunityApiService, CommunityMemberView, CommunityView } from '../../services/community-api.service';
import { communityRoleLabel } from '../../auth/community-roles';

@Component({
  selector: 'app-mobile-community', standalone: true, imports: [FormsModule, RouterLink, DatePipe, CommunityOverview], styleUrl: './mobile-community-list.scss',
  template: `
    <header class="community-header">
      @if (fullList) { <a class="back" routerLink="/mobile/community">La mia comunità</a> }
      <div class="heading-row"><h1>{{ fullList ? 'Tutti i fratelli' : data?.context?.communityName || 'La mia comunità' }}</h1><button class="icon" type="button" aria-label="Aggiorna membri" title="Aggiorna membri" (click)="load()" [disabled]="loading"><i class="pi pi-refresh" aria-hidden="true"></i></button></div>
      @if (data) {
        <p class="community-context">{{ data.context.parishName }}</p>
        <div class="community-meta"><span>Ruolo: {{ roleLabel(data.context.role || 'MEMBER') }}</span><strong>{{ memberCountLabel }}</strong></div>
      }
    </header>
    @if (loading) { <div role="status" aria-label="Caricamento membri" aria-busy="true">@for (row of [1,2,3,4]; track row) { <div class="skeleton"></div> }</div> }
    @else if (error) { <section class="state" role="alert"><h2>Comunità non disponibile</h2><p>{{ error }}</p><button class="primary" type="button" (click)="load()">Riprova</button></section> }
    @else if (data) {
      @if (data.canAddMember) { <a class="primary" routerLink="/mobile/community/add"><i class="pi pi-plus" aria-hidden="true"></i><span>Aggiungi fratello</span></a> }
      @if (canImport) { <a class="primary" routerLink="/mobile/community/import"><i class="pi pi-upload" aria-hidden="true"></i><span>Importa elenco</span></a> }
      @if (!fullList) { <app-community-overview [data]="data" /> }
      @else {
      <div class="search-bar">
        <i class="pi pi-search" aria-hidden="true"></i>
        <input type="search" name="query" [(ngModel)]="query" aria-label="Cerca nella comunità" placeholder="Cerca nella comunità" autocomplete="off" enterkeyhint="search" />
        @if (query) { <button class="icon" type="button" aria-label="Cancella ricerca" (click)="query = ''"><i class="pi pi-times" aria-hidden="true"></i></button> }
      </div>
      @if (!data.members.length) { <section class="state"><i class="pi pi-users" aria-hidden="true"></i><h2>Nessun fratello censito</h2></section> }
      @else if (!filtered.length) { <section class="state"><h2>Nessun risultato</h2><p>Nessun membro corrisponde alla ricerca.</p></section> }
      <ul class="member-list" aria-label="Fratelli della comunità">@for (member of filtered; track member.personId) {
        <li>
        <a class="member-row" [routerLink]="'/mobile/community/member/' + member.personId">
          <span class="avatar">@if (member.photoUrl && !failedPhotos.has(member.personId)) { <img [src]="member.photoUrl" alt="" loading="lazy" referrerpolicy="no-referrer" (error)="failedPhotos.add(member.personId)" /> } @else { {{ initials(member) }} }</span>
          <span class="member-copy"><strong>{{ member.firstName }} {{ member.lastName }}</strong><span [class.lead]="member.role === 'RESPONSIBLE' || member.role === 'CO_RESPONSIBLE'">{{ roleLabel(member.role) }}</span>@if (member.stage) { <small class="stage">{{ member.stage }}</small> }@if (member.birthdayLabel || member.birthDate) { <small class="birthday"><i class="pi pi-gift" aria-hidden="true"></i> {{ member.birthdayLabel || ((member.birthDate + 'T00:00:00Z') | date:'dd/MM':'UTC') }}</small> }@if (member.phoneNumber) { <span class="directory-phone">{{ member.phoneNumber }}</span> }@if (member.accountLinked !== undefined) { <small class="directory-account">{{ member.accountLinked ? 'Account collegato' : 'Non ancora registrato' }}</small> }</span>
          <i class="pi pi-angle-right chevron" aria-hidden="true"></i>
        </a>
        @if(!member.accountLinked && member.invitationStatus){<small>{{member.invitationStatus==='PENDING'?'Invito attivo':member.invitationStatus==='EXPIRED'?'Invito scaduto':member.invitationStatus==='CANCELLED'?'Invito annullato':'Invito accettato'}}</small>}
        @if(!member.accountLinked && !member.email){<small>Senza email</small>}
        </li>
      }</ul>
      <nav class="community-links" aria-label="Altre azioni comunità">
        @if (canReview) { <a routerLink="/mobile/approvazioni"><i class="pi pi-user-plus" aria-hidden="true"></i><span>Richieste accesso</span><i class="pi pi-angle-right" aria-hidden="true"></i></a> }
        @if (data.context.personId) { <a [routerLink]="'/mobile/community/member/' + data.context.personId"><i class="pi pi-user" aria-hidden="true"></i><span>La mia scheda</span><i class="pi pi-angle-right" aria-hidden="true"></i></a> }
        @if (canReview) { <a routerLink="/mobile/approvazioni"><i class="pi pi-history" aria-hidden="true"></i><span>Richieste e storico</span><i class="pi pi-angle-right" aria-hidden="true"></i></a> }
      </nav>
      }
    }
  `
})
export class MobileCommunity implements OnInit {
  protected readonly fullList = inject(ActivatedRoute).snapshot.data['fullList'] === true;
  private readonly api = inject(CommunityApiService);
  protected data: CommunityView | null = null;
  protected loading = true;
  protected error = '';
  protected query = '';
  protected readonly failedPhotos = new Set<number>();
  protected roleLabel(role: string): string { return role === 'MEMBER' ? 'Fratello / Sorella' : communityRoleLabel(role); }
  protected get memberCountLabel(): string { const count = this.data?.members.length ?? 0; return count === 1 ? '1 fratello' : count + ' fratelli'; }
  protected get canReview(): boolean { return this.data?.context.permissions?.some(p => ['APPROVE_REQUESTS', 'APPROVE_MEMBERS'].includes(p)) === true; }
  protected get canImport(): boolean { const actor = this.data?.context; return !!actor?.permissions.includes('EDIT_MEMBRI') && ['RESPONSIBLE', 'CO_RESPONSIBLE'].includes(actor.role ?? ''); }
  ngOnInit(): void { void this.load(); }
  protected async load(): Promise<void> {
    this.loading = true; this.error = ''; this.data = null;
    try { this.data = await this.api.getCommunity(); }
    catch { this.error = 'Impossibile caricare i membri della tua comunità. Controlla la connessione e riprova.'; }
    finally { this.loading = false; }
  }
  protected get filtered(): CommunityMemberView[] {
    const terms = this.query.trim().toLocaleLowerCase('it').split(/\s+/).filter(Boolean);
    return (this.data?.members ?? []).filter(member => terms.every(term => `${member.firstName} ${member.lastName} ${member.phoneNumber ?? ''}`.toLocaleLowerCase('it').includes(term)
      || /\d/.test(term) && (member.phoneNumber ?? '').replace(/\D/g, '').includes(term.replace(/\D/g, ''))));
  }
  protected initials(member: CommunityMemberView): string { return (member.firstName.charAt(0) + member.lastName.charAt(0)).toLocaleUpperCase('it'); }
}
