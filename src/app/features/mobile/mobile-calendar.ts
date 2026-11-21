import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CalendarApiService, CalendarData, CalendarImportSummary, calendarDate, calendarSections } from '../../services/calendar-api.service';

@Component({
  selector: 'app-mobile-calendar', standalone: true, imports: [RouterLink],
  template: `
    <h1>Calendario</h1>
    @if (loading) { <p role="status">Caricamento calendario...</p> }
    @if (error) { <section role="alert"><p>{{ error }}</p><button (click)="load()">Riprova</button></section> }
    @if (data; as calendar) {
      @if (calendar.canManage) { <a class="primary" routerLink="/mobile/calendar/import"><i class="pi pi-upload" aria-hidden="true"></i> Importa calendario</a> }
      @for (section of sections(); track section.title) {
        <h2>{{ section.title }}</h2>
        @for (event of section.events; track event.id) {
          <a class="event" [routerLink]="['/mobile/calendar', event.id]">
            <span class="date">{{ dateLabel(event.date) }}</span><h3>{{ event.title }}</h3><span class="event-type">{{ event.eventType }}</span>
            @if (event.startTime) { <p>{{ event.startTime.slice(0, 5) }}@if (event.endTime) { – {{ event.endTime.slice(0, 5) }} }</p> }
            @if (event.location) { <p>{{ event.location }}</p> }
            @for (assignment of event.assignments; track $index) { @if (assignment.isMine) { <span class="mine">Il tuo incarico · {{ assignment.label }}</span> } }
            <i class="pi pi-chevron-right" aria-hidden="true"></i>
          </a>
        }
      } @empty { <section class="empty"><i class="pi pi-calendar" aria-hidden="true"></i><h2>Nessun appuntamento pubblicato</h2><p>Gli incontri saranno visibili dopo la verifica del responsabile.</p></section> }
      @if (cancelled().length) { <details><summary>Appuntamenti annullati</summary>@for (event of cancelled(); track event.id) {
        <a class="event" [routerLink]="['/mobile/calendar', event.id]">{{ dateLabel(event.date) }} · {{ event.title }} <strong>Annullato</strong></a>
      }</details> }
      @if (calendar.canManage) { <details><summary>Importazioni e bozze</summary>
        @if (importsError) { <p role="alert">{{ importsError }}</p> }
        @for (item of imports; track item.id) { <a class="event" [routerLink]="['/mobile/calendar/import', item.id]">{{ item.originalFileName || 'Calendario da testo' }}<span>{{ item.count }} eventi · {{ item.status }}</span></a> }
      </details> }
    }
  `,
  styles: [`
    :host{display:block;color:var(--color-text-primary)}h1{font-size:25px;margin:4px 0 20px}h2{font-size:17px;margin:24px 0 12px}.event,section{display:block;background:var(--color-surface);border:1px solid var(--color-divider);border-radius:8px;padding:18px;margin:12px 0;color:var(--color-text-primary);text-decoration:none;position:relative;overflow-wrap:anywhere}.event{padding-right:38px}.event h3{font-size:17px;margin:8px 0}.event p,.event>span:not(.mine){display:block;color:var(--color-text-secondary);font-size:13px;margin:6px 0}.event .pi{position:absolute;right:14px;top:24px}.date{font-weight:650}.mine{display:block;background:var(--color-success-tint);color:var(--color-success);padding:8px;border-radius:4px;font-size:13px;font-weight:650;margin-top:12px}.primary,button{display:inline-flex;align-items:center;justify-content:center;gap:10px;min-height:48px;padding:12px 16px;border:0;border-radius:6px;background:var(--color-primary);color:white;text-decoration:none;font:inherit;font-weight:600}.empty{text-align:center}.empty>.pi{font-size:28px;color:var(--color-primary)}.empty p{color:var(--color-text-secondary);line-height:1.6}summary{min-height:48px;padding:12px 0;font-weight:600;cursor:pointer}a:focus-visible,button:focus-visible{outline:3px solid var(--color-focus);outline-offset:2px}
  `]
})
export class MobileCalendar implements OnInit {
  private readonly api = inject(CalendarApiService);
  protected data: CalendarData | null = null;
  protected imports: CalendarImportSummary[] = [];
  protected loading = false; protected error = ''; protected importsError = '';
  protected readonly dateLabel = calendarDate;
  protected sections() { return this.data ? calendarSections(this.data.events, this.data.today) : []; }
  protected cancelled() { return this.data?.events.filter(x => x.isCancelled) ?? []; }
  ngOnInit(): void { void this.load(); }
  protected async load(): Promise<void> {
    this.loading = true; this.error = ''; this.data = null;
    try {
      this.data = await this.api.get();
      if (this.data.canManage) try { this.imports = await this.api.imports(); } catch { this.importsError = 'Bozze non disponibili. Riprova.'; }
    } catch { this.error = 'Calendario non disponibile. Riprova tra poco.'; }
    finally { this.loading = false; }
  }
}
