import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { CommunityApiService, CommunityMemberView, CommunityView } from '../../services/community-api.service';
import { communityRoleLabel } from '../../auth/community-roles';

@Component({
  selector: 'app-mobile-community', standalone: true, imports: [FormsModule, RouterLink, DatePipe], styleUrl: './mobile-community.scss',
  template: `
    <div class="page-title"><div><h1>La mia comunità</h1>@if (data) { <p>{{ data.context.communityName }} · {{ data.context.parishName }}</p><span class="muted">{{ data.members.length }} membri</span> }</div><button class="icon" type="button" aria-label="Aggiorna membri" title="Aggiorna membri" (click)="load()" [disabled]="loading"><i class="pi pi-refresh" aria-hidden="true"></i></button></div>
    @if (loading) { <div role="status" aria-label="Caricamento membri" aria-busy="true">@for (row of [1,2,3,4]; track row) { <div class="skeleton"></div> }</div> }
    @else if (error) { <section class="state" role="alert"><h2>Comunità non disponibile</h2><p>{{ error }}</p><button class="primary" type="button" (click)="load()">Riprova</button></section> }
    @else if (data) {
      <div class="community-actions">@if (data.canAddMember) { <a class="primary" routerLink="/mobile/community/add"><i class="pi pi-user-plus" aria-hidden="true"></i> Aggiungi fratello</a> }<a class="secondary" [routerLink]="'/mobile/community/member/' + data.context.personId"><i class="pi pi-shield" aria-hidden="true"></i> La mia scheda e privacy</a></div>
      <label class="search">Cerca membro<input type="search" name="query" [(ngModel)]="query" placeholder="Nome o cognome" autocomplete="off" /></label>
      @if (!data.members.length) { <section class="state"><i class="pi pi-users" aria-hidden="true"></i><h2>Nessun fratello censito</h2></section> }
      @else if (!filtered.length) { <section class="state"><h2>Nessun risultato</h2><p>Nessun membro corrisponde alla ricerca.</p></section> }
      <div class="member-list">@for (member of filtered; track member.personId) {
        <a class="member-row" [routerLink]="'/mobile/community/member/' + member.personId">
          <span class="avatar">@if (member.photoUrl && !failedPhotos.has(member.personId)) { <img [src]="member.photoUrl" alt="" (error)="failedPhotos.add(member.personId)" /> } @else { {{ initials(member) }} }</span>
          <span class="member-copy"><strong>{{ member.firstName }} {{ member.lastName }}</strong>@if (member.role !== 'MEMBER') { <span [class.lead]="member.role === 'RESPONSIBLE' || member.role === 'CO_RESPONSIBLE'">{{ roleLabel(member.role) }}</span> }@if (member.birthDate) { <small><i class="pi pi-gift" aria-hidden="true"></i> {{ member.birthDate | date:'dd/MM':'UTC' }}</small> }</span>
          <i class="pi pi-angle-right muted" aria-hidden="true"></i>
        </a>
      }</div>
    }
  `
})
export class MobileCommunity implements OnInit {
  private readonly api = inject(CommunityApiService);
  protected data: CommunityView | null = null;
  protected loading = true;
  protected error = '';
  protected query = '';
  protected readonly failedPhotos = new Set<number>();
  protected readonly roleLabel = communityRoleLabel;
  ngOnInit(): void { void this.load(); }
  protected async load(): Promise<void> {
    this.loading = true; this.error = ''; this.data = null;
    try { this.data = await this.api.getCommunity(); }
    catch { this.error = 'Impossibile caricare i membri della tua comunità. Controlla la connessione e riprova.'; }
    finally { this.loading = false; }
  }
  protected get filtered(): CommunityMemberView[] {
    const terms = this.query.trim().toLocaleLowerCase('it').split(/\s+/).filter(Boolean);
    return (this.data?.members ?? []).filter(member => terms.every(term => `${member.firstName} ${member.lastName}`.toLocaleLowerCase('it').includes(term)));
  }
  protected initials(member: CommunityMemberView): string { return (member.firstName.charAt(0) + member.lastName.charAt(0)).toLocaleUpperCase('it'); }
}
