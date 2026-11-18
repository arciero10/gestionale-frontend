import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BirthdayApiService, BirthdayCalendar, BirthdayItem } from '../../services/birthday-api.service';

@Component({
  selector: 'app-mobile-birthdays', standalone: true, imports: [RouterLink], styleUrl: './mobile-birthdays.scss',
  template: `
    <header class="community-header"><div class="heading-row"><h1>Compleanni</h1><button type="button" class="icon" aria-label="Aggiorna compleanni" title="Aggiorna compleanni" [disabled]="loading" (click)="load()"><i class="pi pi-refresh" aria-hidden="true"></i></button></div>
      @if (data) { <p class="community-context">{{ data.communityName }} · {{ data.parishName }}</p> }
    </header>
    @if (loading) { <div role="status" aria-label="Caricamento compleanni" aria-busy="true">@for (i of [1,2,3]; track i) { <div class="skeleton"></div> }</div> }
    @else if (error) { <section class="state" role="alert"><h2>Compleanni non disponibili</h2><p>Impossibile caricare i compleanni. Controlla la connessione e riprova.</p><button type="button" class="primary" (click)="load()">Riprova</button></section> }
    @else if (data) {
      @if (!data.birthdays.length) { <section class="state"><i class="pi pi-gift" aria-hidden="true"></i><h2>Nessun compleanno condiviso</h2><p>Non ci sono compleanni visibili nella tua comunità.</p></section> }
      @for (group of groups; track group.key) {
        @if (members(group.key).length) { <section [attr.aria-label]="group.title"><h2>{{ group.title }}</h2><ul class="member-list">
          @for (person of members(group.key); track person.personId) {
            <li><a class="member-row" [routerLink]="'/mobile/community/member/' + person.personId">
              <span class="avatar">@if (person.photoUrl && !failedPhotos.has(person.personId)) { <img [src]="person.photoUrl" alt="" loading="lazy" referrerpolicy="no-referrer" (error)="failedPhotos.add(person.personId)" /> } @else { {{ initials(person.displayName) }} }</span>
              <span class="member-copy"><strong>{{ person.displayName }}</strong><span>{{ person.dateLabel }}</span><small class="birthday-tag" [class.today]="person.isToday">{{ person.isToday ? 'Oggi' : person.daysUntilBirthday === 1 ? 'Domani' : 'Tra ' + person.daysUntilBirthday + ' giorni' }}</small></span>
              <i class="pi pi-angle-right chevron" aria-hidden="true"></i>
            </a></li>
          }
        </ul></section> }
      }
    }
    <nav class="community-links"><a routerLink="/mobile/privacy"><i class="pi pi-shield" aria-hidden="true"></i><span>Privacy e notifiche</span><i class="pi pi-angle-right" aria-hidden="true"></i></a></nav>
  `
})
export class MobileBirthdays implements OnInit, OnDestroy {
  private readonly api = inject(BirthdayApiService);
  private generation = 0;
  protected data: BirthdayCalendar | null = null;
  protected loading = true;
  protected error = false;
  protected readonly failedPhotos = new Set<number>();
  protected readonly groups = [{key:'today',title:'Oggi'}, {key:'week',title:'Prossimi 7 giorni'}, {key:'month',title:'Questo mese'}, {key:'later',title:'Prossimamente'}] as const;
  ngOnInit(): void { void this.load(); }
  ngOnDestroy(): void { this.generation++; }
  protected async load(): Promise<void> {
    const generation = ++this.generation; this.loading = true; this.error = false; this.data = null;
    try { const data = await this.api.get(); if (generation === this.generation) this.data = data; }
    catch { if (generation === this.generation) this.error = true; }
    finally { if (generation === this.generation) this.loading = false; }
  }
  protected members(section: string): BirthdayItem[] { return this.data?.birthdays.filter(x => x.section === section) ?? []; }
  protected initials(name: string): string { const words = name.trim().split(/\s+/); return (words[0].charAt(0) + (words.length > 1 ? words[words.length - 1].charAt(0) : '')).toLocaleUpperCase('it'); }
}
