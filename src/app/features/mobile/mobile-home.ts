import { Component, inject, OnInit } from '@angular/core';
import { BirthdayApiService } from '../../services/birthday-api.service';
import { CalendarApiService, CalendarEvent, calendarDate } from '../../services/calendar-api.service';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CurrentUserService } from '../../auth/current-user.service';
import { AuthService } from '../../auth/auth.service';
import { OnboardingApiService } from '../../auth/onboarding-api.service';
import { dismissProfilePrompt } from './mobile-personal-profile';

@Component({
  selector: 'app-mobile-home', standalone: true, imports: [RouterLink],
  template: `
    @if (section === 'home') {
      <div class="greeting"><p>La vita della comunità</p><h1>{{ current.context()?.displayName ? 'Ciao ' + current.context()?.displayName?.split(' ')?.[0] : 'Benvenuto' }}</h1><span>{{ current.context()?.communityName }}</span><span>{{ current.context()?.parishName }}</span></div>
      @if (pendingRequests) { <a class="back" routerLink="/mobile/approvazioni"><i class="pi pi-user-plus" aria-hidden="true"></i>Nuova richiesta di accesso · {{pendingRequests}}</a> }
      @if (profilePrompt) { <section class="profile-prompt"><h2>Completa il tuo profilo</h2><a class="back" routerLink="/mobile/complete-profile">Completa profilo</a><button type="button" class="back" (click)="later()">Completa più tardi</button></section> }
      <div class="home-overview">
        @if (nextEvent; as event) { <a class="next-event" [routerLink]="['/mobile/calendar', event.id]"><h2>Prossimo appuntamento</h2><strong>{{ event.title }}</strong><p>{{ calendarDate(event.date) }} · {{ event.startTime?.slice(0,5) }}</p></a> }
        @else { <a class="next-event" routerLink="/mobile/calendario"><h2>Prossimo appuntamento</h2><strong>{{ calendarSummary }}</strong></a> }
        @if (nextAssignment; as event) { <a class="next-assignment" [routerLink]="['/mobile/calendar', event.id]"><h2>Prossimo incarico</h2><strong>{{ assignmentLabel(event) }}</strong><p>{{ calendarDate(event.date) }}</p></a> }
        <a routerLink="/mobile/avvisi"><h2>Avvisi</h2><strong>Le comunicazioni della comunità</strong><p>Non ancora disponibili</p></a>
        <a routerLink="/mobile/birthdays"><h2>Compleanni</h2><strong>{{ birthdaySummary }}</strong></a>
      </div>
      <a class="community-card" routerLink="/mobile/community">
        <img src="assets/images/login-bg.jpg" alt="" />
        <div><span class="eyebrow">INSIEME, OGNI GIORNO</span><h2>La mia comunità</h2><p>{{ current.context()?.communityName }}@if (current.context()?.memberCount !== undefined) { · {{ current.context()?.memberCount }} membri }</p><i class="pi pi-arrow-right" aria-hidden="true"></i></div>
      </a>
      <h2 class="section-label">Accessi rapidi</h2>
      <div class="app-grid">
        @for (card of cards; track card.path) {
          <a class="app-tile" [routerLink]="'/mobile/' + card.path"><span class="tile-icon"><i [class]="'pi ' + card.icon" aria-hidden="true"></i></span><h2>{{ card.title }}</h2><i class="pi pi-arrow-up-right arrow" aria-hidden="true"></i></a>
        }
        @if (canOrganize()) { <a class="app-tile" routerLink="/mobile/posti-convivenza"><span class="tile-icon places"><i class="pi pi-building" aria-hidden="true"></i></span><h2>Posti di convivenza</h2><i class="pi pi-arrow-up-right arrow" aria-hidden="true"></i></a> }
        <a class="app-tile" routerLink="/mobile/community"><span class="tile-icon"><i class="pi pi-users" aria-hidden="true"></i></span><h2>Rubrica</h2><i class="pi pi-arrow-up-right arrow" aria-hidden="true"></i></a>
        <a class="app-tile" routerLink="/mobile/altro"><span class="tile-icon"><i class="pi pi-ellipsis-h" aria-hidden="true"></i></span><h2>Altro</h2><i class="pi pi-arrow-up-right arrow" aria-hidden="true"></i></a>
      </div>
    } @else {
      <a class="back" routerLink="/mobile/home"><i class="pi pi-arrow-left" aria-hidden="true"></i> Home</a>
      <h1>{{ title }}</h1>
      @if (section === 'profilo') {
        <a class="back" routerLink="/mobile/complete-profile">Completa il tuo profilo</a>
        <a class="back" routerLink="/mobile/privacy"><i class="pi pi-bell" aria-hidden="true"></i> Preferenze notifiche</a>
        <dl><dt>Nome</dt><dd>{{ current.context()?.displayName || 'Non disponibile' }}</dd><dt>Comunità</dt><dd>{{ current.context()?.communityName || 'Non associata' }}</dd><dt>Numero comunità</dt><dd>{{ current.context()?.communityNumber ?? 'Non disponibile' }}</dd><dt>Parrocchia</dt><dd>{{ current.context()?.parishName || 'Non disponibile' }}</dd><dt>Ruolo</dt><dd>{{ current.context()?.role || 'Non disponibile' }}</dd></dl>
        @if (profileFeedback) { <p role="status">{{ profileFeedback }}</p> }
        <button type="button" class="back" [disabled]="refreshing" (click)="refreshContext()"><i class="pi pi-refresh" aria-hidden="true"></i> Aggiorna profilo e permessi</button>
        <button type="button" class="logout" (click)="auth.logout()"><i class="pi pi-sign-out" aria-hidden="true"></i> Esci dall'app</button>
      } @else if (section === 'altro') {
        <div class="links"><a routerLink="/mobile/profilo">Il mio profilo <i class="pi pi-user" aria-hidden="true"></i></a>
          @if (canApprove()) { <a routerLink="/mobile/approvazioni">Appartenenze e deleghe <i class="pi pi-check-square" aria-hidden="true"></i></a> }
          <a routerLink="/mobile/birthdays">Compleanni <i class="pi pi-gift" aria-hidden="true"></i></a><a routerLink="/mobile/gruppi">Gruppi <i class="pi pi-users" aria-hidden="true"></i></a><a routerLink="/mobile/avvisi">Avvisi <i class="pi pi-bell" aria-hidden="true"></i></a><a routerLink="/faq">Aiuto / FAQ <i class="pi pi-question-circle" aria-hidden="true"></i></a><a routerLink="/mobile/privacy">Preferenze notifiche <i class="pi pi-bell" aria-hidden="true"></i></a></div>
        <p class="independence-note">Eventi di Comunità è un'applicazione indipendente per la gestione delle attività comunitarie e non è un'app ufficiale del Cammino Neocatecumenale.</p>
      } @else {
        <section class="empty"><i [class]="'pi ' + emptyIcon" aria-hidden="true"></i><h2>{{ title }}</h2><p>{{ unavailableMessage }}</p>@if (section === 'calendario') { <a routerLink="/mobile/convivenze">Apri le convivenze <i class="pi pi-arrow-right" aria-hidden="true"></i></a> }</section>
      }
    }
  `,
  styles: [`
    .birthday-summary{margin-top:8px;color:var(--color-text-secondary);font-size:12px;line-height:1.4;overflow-wrap:anywhere}.calendar-preview{margin:12px 0}
    .profile-prompt{padding:12px 0;margin-bottom:20px;border-bottom:1px solid var(--color-border)}.profile-prompt h2{font-size:18px;margin:0}.profile-prompt button{border:0;background:transparent;font:inherit}.profile-prompt .back{padding:8px;margin-right:8px}
    :host{display:block;color:var(--color-text-primary)}h1{font-size:25px;line-height:1.25;margin:8px 0;letter-spacing:0;overflow-wrap:anywhere}.greeting{margin:4px 4px 24px}.greeting>p{color:var(--color-primary);font-size:13px;font-weight:650;margin:0}.greeting>span{font-size:14px;color:var(--color-text-secondary)}
    .community-card{display:block;background:white;border:1px solid var(--color-divider);border-radius:8px;overflow:hidden;color:var(--color-text-primary);text-decoration:none}.community-card img{display:block;width:100%;height:134px;object-fit:cover;object-position:center 45%}.community-card>div{padding:18px;position:relative}.eyebrow{font-size:10px;font-weight:700;color:var(--color-success)}.community-card h2{font-size:20px;margin:8px 0}.community-card p{font-size:13px;color:var(--color-text-secondary);margin:0;padding-right:24px}.community-card .pi{position:absolute;right:18px;bottom:20px;color:var(--color-primary)}
    .section-label{font-size:16px;margin:24px 2px 12px}.app-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.app-tile{display:flex;flex-direction:column;align-items:flex-start;justify-content:center;min-height:140px;position:relative;padding:18px 14px;border:1px solid var(--color-divider);border-radius:8px;background:white;color:var(--color-text-primary);text-decoration:none}.tile-icon{width:42px;height:42px;border-radius:8px;display:grid;place-items:center;font-size:21px}.places{background:var(--color-background);color:var(--color-text-primary)}.app-tile h2{font-size:15px;line-height:1.4;margin:14px 0 0;overflow-wrap:anywhere;padding-right:12px}.arrow{position:absolute;top:18px;right:14px;color:var(--color-text-secondary);font-size:12px}
    .back{display:inline-flex;align-items:center;gap:10px;min-height:48px;color:var(--color-primary);text-decoration:none}.empty{padding:32px 20px;text-align:center;background:white;border:1px solid var(--color-divider);border-radius:8px;margin-top:24px}.empty>.pi{font-size:30px;color:var(--color-primary)}.empty h2{font-size:18px}.empty p{color:var(--color-text-secondary);line-height:1.6}.empty a{display:inline-flex;align-items:center;gap:8px;min-height:48px;color:var(--color-primary);font-weight:600}.links{margin-top:24px}.links a{display:flex;justify-content:space-between;align-items:center;min-height:56px;padding:12px;border-bottom:1px solid var(--color-divider);color:var(--color-text-primary);text-decoration:none;background:white}dl{background:white;padding:20px;border-radius:8px}dt{font-size:12px;color:var(--color-text-secondary);margin-top:16px}dt:first-child{margin-top:0}dd{margin:6px 0 0;overflow-wrap:anywhere;font-weight:600}.logout{display:flex;align-items:center;justify-content:center;gap:12px;width:100%;min-height:48px;background:var(--color-danger-tint);color:var(--color-danger);border:1px solid var(--color-danger-border);border-radius:8px;font:inherit;font-weight:600}a:focus-visible,button:focus-visible{outline:3px solid var(--color-focus);outline-offset:3px}
  `]
})
export class MobileHome implements OnInit {
  private readonly onboarding=inject(OnboardingApiService);
  protected pendingRequests=0;protected profilePrompt=false;
  protected later():void{dismissProfilePrompt(this.current.context()?.userId);this.profilePrompt=false;}
  private async loadRequests():Promise<void>{try{this.pendingRequests=(await this.onboarding.getRequests()).filter(x=>x.status==='IN_ATTESA_APPROVAZIONE').length;}catch{this.pendingRequests=0;}}
  private readonly birthdays = inject(BirthdayApiService);
  private readonly calendar = inject(CalendarApiService);
  protected readonly calendarDate = calendarDate;
  protected nextEvent: CalendarEvent | null = null;
  protected nextAssignment: CalendarEvent | null = null;
  protected calendarSummary = 'Caricamento...';
  protected assignmentLabel(event: CalendarEvent): string { return event.assignments.filter(x => x.isMine).map(x => x.label).join(', '); }
  protected birthdaySummary = 'Caricamento...';
  ngOnInit(): void { if (this.section === 'home') { void this.loadBirthdays(); void this.loadCalendar();if(this.canApprove())void this.loadRequests();
    try{this.profilePrompt=!!this.current.context()?.userId&&!localStorage.getItem('community.profile-prompted:'+this.current.context()?.userId);}catch{this.profilePrompt=true;}
  } }
  private async loadCalendar(): Promise<void> {
    try {
      const result = await this.calendar.get();
      const events = result.events.filter(x => !x.isCancelled && !x.isIgnored && x.date && x.date >= result.today)
        .sort((a, b) => `${a.date} ${a.startTime ?? ''}`.localeCompare(`${b.date} ${b.startTime ?? ''}`));
      this.nextEvent = events[0] ?? null;
      this.nextAssignment = events.find(x => x.assignments.some(a => a.isMine)) ?? null;
      this.calendarSummary = this.nextEvent ? this.nextEvent.title : 'Nessun appuntamento pubblicato';
    } catch { this.calendarSummary = 'Calendario non disponibile'; }
  }
  private async loadBirthdays(): Promise<void> {
    try { const data = await this.birthdays.get(); const count = data.birthdays.filter(x => x.daysUntilBirthday <= 7).length;
      this.birthdaySummary = count ? count + ' nei prossimi 7 giorni' : 'Nessun compleanno imminente';
    } catch { this.birthdaySummary = 'Compleanni non disponibili'; }
  }
  protected readonly current = inject(CurrentUserService);
  protected readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  protected refreshing = false;
  protected profileFeedback = '';
  protected async refreshContext(): Promise<void> {
    if (this.refreshing) return;
    this.refreshing = true;
    try {
      await this.current.refresh();
      if (!this.current.context()?.linkedToCommunity) await this.router.navigateByUrl('/mobile/onboarding');
      else this.profileFeedback = 'Profilo e permessi aggiornati.';
    } catch { this.profileFeedback = 'Impossibile aggiornare il profilo. Riprova.'; }
    finally { this.refreshing = false; }
  }
  protected readonly section: string = this.route.snapshot.data['section'];
  protected readonly title: string = this.route.snapshot.data['title'];
  protected readonly cards = [
    { title: 'Calendario', path: 'calendario', icon: 'pi-calendar', background: 'var(--color-tint)', color: 'var(--color-primary)' },
    { title: 'Compleanni', path: 'birthdays', icon: 'pi-gift', background: 'var(--color-gold-tint)', color: 'var(--color-primary)' },
    { title: 'Gruppi', path: 'gruppi', icon: 'pi-users', background: 'var(--color-tint)', color: 'var(--color-primary)' },
    { title: 'Avvisi', path: 'avvisi', icon: 'pi-bell', background: 'var(--color-warning-tint)', color: 'var(--color-warning)' },
    { title: 'Convivenze', path: 'convivenze', icon: 'pi-calendar-plus', background: 'var(--color-success-tint)', color: 'var(--color-success)' }
  ];
  protected canOrganize(): boolean { return this.current.context()?.permissions.includes('CREATE_CONVIVENZA') === true; }
  protected canApprove(): boolean { return this.current.context()?.isOnboardingAdmin === true || this.current.context()?.permissions.some(p => ['APPROVE_REQUESTS', 'APPROVE_MEMBERS'].includes(p)) === true; }
  protected get emptyIcon(): string { return this.cards.find(card => card.path === this.section)?.icon ?? 'pi-info-circle'; }
  protected get unavailableMessage(): string {
    return ({ calendario: 'Le date degli incontri della comunità non sono ancora disponibili. Puoi consultare le convivenze.',
      gruppi: 'I gruppi e i servizi della comunità non sono ancora disponibili in questa sezione.',
      avvisi: 'Le comunicazioni della comunità non sono ancora collegate a questa sezione.' } as Record<string, string>)[this.section] ?? '';
  }
}
