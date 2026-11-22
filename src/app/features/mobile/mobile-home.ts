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
  templateUrl: './mobile-home.html',
  styleUrl: './mobile-home.scss'
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
  protected hasUpcomingBirthday = false;
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
      this.hasUpcomingBirthday = count > 0;
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
    { title: 'Calendario', path: 'calendario', icon: 'pi-calendar', subtitle: 'Appuntamenti e celebrazioni' },
    { title: 'Compleanni', path: 'birthdays', icon: 'pi-gift', subtitle: 'Ricorrenze della comunità' },
    { title: 'Gruppi', path: 'gruppi', icon: 'pi-users', subtitle: 'Gruppi nelle case' },
    { title: 'Avvisi', path: 'avvisi', icon: 'pi-bell', subtitle: 'Comunicazioni importanti' },
    { title: 'Convivenze', path: 'convivenze', icon: 'pi-calendar-plus', subtitle: 'Prossime convivenze' }
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
