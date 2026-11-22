import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { CalendarApiService, CalendarEvent, CalendarPerson, calendarDate } from '../../services/calendar-api.service';
import { CalendarEventEditor } from './calendar-event-editor';

@Component({
  selector: 'app-mobile-calendar-detail', standalone: true, imports: [RouterLink, CalendarEventEditor],
  template: `

    @if (loading) { <p role="status">Caricamento appuntamento...</p> }
    @if (error) { <p role="alert">{{ error }}</p><button (click)="load()" [disabled]="loading">Ricarica appuntamento</button> }
    @if (feedback) { <p role="status">{{ feedback }}</p> }
    @if (event; as item) {
      <section><p>{{ dateLabel(item.date) }}</p><h1>{{ item.title }}</h1>
        @if (item.isCancelled) { <strong class="cancelled">Evento annullato</strong> }
        @if (item.startTime) { <p>{{ item.startTime.slice(0,5) }}@if (item.endTime) { – {{ item.endTime.slice(0,5) }} }</p> }
        @if (item.location) { <p>{{ item.location }}</p> }<p class="description">{{ item.description }}</p>
        @for (assignment of item.assignments; track $index) { @if (assignment.isMine) { <div class="mine"><h2>Il tuo incarico</h2><p>{{ assignment.label }}</p></div> } }
        <h2>Incaricati</h2>@for (assignment of item.assignments; track $index) { <p><strong>{{ assignment.displayName }}</strong><br />{{ assignment.label }}@if(canManage && assignment.notificationStatus){<br>{{assignment.accountLinked?'Account collegato · push non ancora attive':'Senza account · incarico valido'}} }</p> } @empty { <p>Nessun incarico assegnato</p> }
      </section>
      @if (canManage) {
        <button (click)="beginEdit()" [disabled]="loading || busy">Modifica evento e incarichi</button>
        @if (editing) { <section><app-calendar-event-editor [event]="editing" [people]="people" [published]="true" /><div class="actions"><button (click)="save()" [disabled]="busy">{{ busy ? 'Salvataggio...' : 'Salva modifiche' }}</button><button (click)="editing = null" [disabled]="busy">Annulla modifiche</button></div></section> }
      }
    }
  `,
  styles: [`
    :host{display:block;color:var(--color-text-primary);min-width:0}.back{display:inline-flex;gap:8px;align-items:center;min-height:48px;color:var(--color-primary);text-decoration:none}h1{font-size:25px;line-height:1.3;overflow-wrap:anywhere}h2{font-size:17px;margin-top:24px}section{padding:18px;background:var(--color-surface);border:1px solid var(--color-divider);border-radius:8px;margin:16px 0}p{color:var(--color-text-secondary);line-height:1.6;overflow-wrap:anywhere}.description{white-space:pre-wrap}.mine{padding:14px;background:var(--color-success-tint);border-radius:6px}.mine h2{margin:0;color:var(--color-success)}.mine p{margin-bottom:0;color:var(--color-success)}.cancelled{display:block;color:var(--color-danger);padding:12px;background:var(--color-danger-tint)}button{min-height:48px;padding:12px;border:1px solid var(--color-border);border-radius:6px;background:var(--color-surface);color:var(--color-primary);font:inherit;font-weight:600}.actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:20px}button:disabled{opacity:.6}a:focus-visible,button:focus-visible{outline:3px solid var(--color-focus);outline-offset:2px}
  `]
})
export class MobileCalendarDetail implements OnInit {
  private readonly api = inject(CalendarApiService);
  private readonly route = inject(ActivatedRoute);
  protected event: CalendarEvent | null = null; protected editing: CalendarEvent | null = null;
  protected people: CalendarPerson[] = []; protected canManage = false;
  protected loading = false; protected busy = false; protected error = ''; protected feedback = '';
  protected readonly dateLabel = calendarDate;
  ngOnInit(): void { void this.load(); }
  protected async load(): Promise<void> {
    this.loading = true; this.error = ''; this.event = null; this.editing = null;
    try { const result = await this.api.detail(Number(this.route.snapshot.paramMap.get('id'))); this.event = result.event; this.canManage = result.canManage; }
    catch { this.error = 'Appuntamento non disponibile nella tua comunità.'; } finally { this.loading = false; }
  }
  protected async beginEdit(): Promise<void> {
    this.busy = true; this.error = '';
    try { this.people = await this.api.people(); this.editing = structuredClone(this.event); }
    catch { this.error = 'Impossibile caricare gli incaricati. Riprova.'; } finally { this.busy = false; }
  }
  protected async save(): Promise<void> {
    if (!this.editing || this.busy) return;
    this.busy = true; this.error = '';
    try { await this.api.update(this.editing); await this.load(); this.feedback = 'Appuntamento aggiornato.'; }
    catch (error) { this.error = error instanceof HttpErrorResponse ? error.error?.message ?? 'Salvataggio non riuscito.' : 'Salvataggio non riuscito.'; }
    finally { this.busy = false; }
  }
}
