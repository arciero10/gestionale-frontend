import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CommunityApiService, CommunityMemberView, CommunityView } from '../../services/community-api.service';
import { communityRoleLabel } from '../../auth/community-roles';
import { communityMemberSections } from './community-member-sections';

@Component({
  selector: 'app-mobile-community', standalone: true, imports: [FormsModule, RouterLink], styleUrl: './mobile-community-list.scss',
  template: `
    <header class="community-header">
      <div class="heading-row"><h1>La mia comunità</h1>
        <button class="icon" type="button" aria-label="Aggiorna membri" title="Aggiorna membri" (click)="load()" [disabled]="loading"><i class="pi pi-refresh" aria-hidden="true"></i></button>
        @if (data && (data.canAddMember || canImport || canReview)) {
          <details class="admin-menu"><summary aria-label="Gestione comunità" title="Gestione comunità"><i class="pi pi-ellipsis-v" aria-hidden="true"></i></summary>
            <nav aria-label="Azioni amministrative comunità">
              @if (data.canAddMember) { <a routerLink="/mobile/community/add"><i class="pi pi-user-plus" aria-hidden="true"></i>Aggiungi fratello</a> }
              @if (canImport) { <a routerLink="/mobile/community/import"><i class="pi pi-upload" aria-hidden="true"></i>Importa elenco</a> }
              @if (canReview) { <a routerLink="/mobile/approvazioni"><i class="pi pi-check-square" aria-hidden="true"></i>Richieste accesso</a> }
            </nav>
          </details>
        }
      </div>
      @if (data) { <p class="community-context">{{ data.context.communityName }} · {{ data.context.parishName }}</p><strong class="count">{{ memberCountLabel }}</strong> }
    </header>
    @if (loading) { <div role="status" aria-label="Caricamento membri" aria-busy="true">@for (row of [1,2,3]; track row) { <div class="skeleton"></div> }</div> }
    @else if (error) { <section class="state" role="alert"><h2>Comunità non disponibile</h2><p>{{ error }}</p><button class="primary" type="button" (click)="load()">Riprova</button></section> }
    @else if (data) {
      <div class="search-bar"><i class="pi pi-search" aria-hidden="true"></i>
        <input type="search" name="query" [(ngModel)]="query" aria-label="Cerca nella comunità" placeholder="Cerca nella comunità" autocomplete="off" enterkeyhint="search" />
        @if (query) { <button class="icon" type="button" aria-label="Cancella ricerca" (click)="query = ''"><i class="pi pi-times" aria-hidden="true"></i></button> }
      </div>
      @if (!allMembers.length) { <section class="state"><h2>Nessun fratello censito</h2></section> }
      @else if (!filtered.length) { <section class="state"><h2>Nessun risultato</h2><p>Nessun membro corrisponde alla ricerca.</p></section> }
      @for (section of sections; track section.title) {
        <section class="member-section" [attr.data-section]="section.title" [attr.aria-labelledby]="'members-'+section.title">
          <h2 [id]="'members-'+section.title">{{ section.title }}</h2>
          <ul class="member-list">@for (member of section.members; track member.personId) {
            <li><a class="member-row" [routerLink]="'/mobile/community/member/' + member.personId">
              <span class="avatar">@if (member.photoUrl && !failedPhotos.has(member.personId)) { <img [src]="member.photoUrl" alt="" loading="lazy" referrerpolicy="no-referrer" (error)="failedPhotos.add(member.personId)" /> } @else { {{ initials(member) }} }</span>
              <span class="member-copy"><strong>{{ member.firstName }} {{ member.lastName }}</strong>@if (member.role !== 'MEMBER') { <small>{{ roleLabel(member.role) }}</small> }</span>
              <i class="pi pi-angle-right chevron" aria-hidden="true"></i>
            </a></li>
          }</ul>
        </section>
      }
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
  protected get allMembers(): CommunityMemberView[] { return communityMemberSections(this.data?.members ?? []).find(s=>s.title==='Fratelli')?.members ?? []; }
  protected get memberCountLabel(): string { const count = this.allMembers.length; return count === 1 ? '1 fratello' : count+' fratelli'; }
  protected get canReview(): boolean { return this.data?.context.isOnboardingAdmin === true || this.data?.context.permissions?.some(p=>['APPROVE_REQUESTS','APPROVE_MEMBERS'].includes(p)) === true; }
  protected get canImport(): boolean { const actor=this.data?.context; return !!actor?.permissions?.includes('EDIT_MEMBRI') && ['RESPONSIBLE','CO_RESPONSIBLE'].includes(actor.role ?? ''); }
  ngOnInit(): void { void this.load(); }
  protected async load(): Promise<void> {
    if (this.loading && this.data) return;
    this.loading=true;this.error='';this.data=null;
    try { this.data=await this.api.getCommunity(); }
    catch { this.error='Impossibile caricare i membri della tua comunità. Controlla la connessione e riprova.'; }
    finally { this.loading=false; }
  }
  protected get filtered(): CommunityMemberView[] {
    const terms=this.query.trim().toLocaleLowerCase('it').split(/\s+/).filter(Boolean);
    return this.allMembers.filter(member=>terms.every(term=>`${member.firstName} ${member.lastName} ${member.phoneNumber ?? ''}`.toLocaleLowerCase('it').includes(term)
      || /\d/.test(term) && (member.phoneNumber ?? '').replace(/\D/g,'').includes(term.replace(/\D/g,''))));
  }
  protected get sections() { return communityMemberSections(this.filtered); }
  protected initials(member: CommunityMemberView): string { return (member.firstName.charAt(0)+member.lastName.charAt(0)).toLocaleUpperCase('it'); }
}
