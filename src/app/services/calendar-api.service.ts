import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, timeout } from 'rxjs';
import { getApiConfiguration } from '../auth/api-config';

export const CALENDAR_TYPES = ['Parola', 'Eucaristia', 'Penitenziale', 'Convivenza', 'Celebrazione', 'Servizio', 'Comunità riunite', 'Altro'];
export interface CalendarPerson { id: number; firstName: string; lastName: string }
export interface CalendarAssignment {
  accountLinked?: boolean | null; notificationStatus?: string | null;
  personId: number | null; rawName: string; displayName?: string; matchStatus?: string;
  label: string; notes?: string; reminderDaysBefore: number | null; isMine?: boolean;
}
export interface CalendarEvent {
  id: number; date: string | null; startTime: string | null; endTime: string | null;
  title: string; eventType: string; description: string; location: string;
  sourceLocator?: string; sourceText?: string; reviewConfirmed: boolean; duplicateConfirmed: boolean;
  possibleDuplicate?: boolean; isIgnored: boolean; isCancelled: boolean; updatedAt: string;
  assignments: CalendarAssignment[];
}
export interface CalendarData { today: string; canManage: boolean; events: CalendarEvent[] }
export interface CalendarImport {
  id: number; status: string; sourceType: string; originalFileName?: string; rawText?: string;
  originalBlobReference?: string; updatedAt: string; events: CalendarEvent[]; people: CalendarPerson[];
}
export interface CalendarImportSummary { id: number; status: string; sourceType: string; originalFileName?: string; count: number }
export function calendarSections(events: CalendarEvent[], today: string): { title: string; events: CalendarEvent[] }[] {
  const upcoming = events.filter(x => !x.isCancelled && !x.isIgnored && x.date && x.date >= today)
    .sort((a, b) => `${a.date} ${a.startTime ?? ''}`.localeCompare(`${b.date} ${b.startTime ?? ''}`));
  const week = new Date(today + 'T12:00:00Z'); week.setUTCDate(week.getUTCDate() + 7);
  const end = week.toISOString().slice(0, 10);
  return [
    { title: 'Oggi', events: upcoming.filter(x => x.date === today) },
    { title: 'Prossimi appuntamenti', events: upcoming.filter(x => x.date! > today && x.date! <= end) },
    { title: 'Questo mese', events: upcoming.filter(x => x.date! > end && x.date!.slice(0, 7) === today.slice(0, 7)) },
    { title: 'Prossimamente', events: upcoming.filter(x => x.date! > end && x.date!.slice(0, 7) !== today.slice(0, 7)) }
  ].filter(x => x.events.length);
}
export function calendarDate(date: string | null): string {
  return date ? new Intl.DateTimeFormat('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(date + 'T12:00:00Z')) : 'Data da verificare';
}

@Injectable({ providedIn: 'root' })
export class CalendarApiService {
  private readonly http = inject(HttpClient);
  private readonly base = getApiConfiguration().apiBaseUrl + '/mobile/calendar';
  get(): Promise<CalendarData> { return firstValueFrom(this.http.get<CalendarData>(this.base).pipe(timeout(20000))); }
  people(): Promise<CalendarPerson[]> { return firstValueFrom(this.http.get<CalendarPerson[]>(this.base + '/people').pipe(timeout(20000))); }
  detail(id: number): Promise<{ event: CalendarEvent; canManage: boolean }> {
    return firstValueFrom(this.http.get<{ event: CalendarEvent; canManage: boolean }>(`${this.base}/${id}`).pipe(timeout(20000)));
  }
  imports(): Promise<CalendarImportSummary[]> { return firstValueFrom(this.http.get<CalendarImportSummary[]>(this.base + '/imports').pipe(timeout(20000))); }
  draft(id: number): Promise<CalendarImport> { return firstValueFrom(this.http.get<CalendarImport>(`${this.base}/imports/${id}`).pipe(timeout(20000))); }
  text(text: string, year: number): Promise<{ id: number; existing: boolean }> {
    return firstValueFrom(this.http.post<{ id: number; existing: boolean }>(this.base + '/imports/text', { text, year }).pipe(timeout(60000)));
  }
  excel(file: File, year: number): Promise<{ id: number; existing: boolean }> {
    const form = new FormData(); form.append('file', file); form.append('year', String(year));
    return firstValueFrom(this.http.post<{ id: number; existing: boolean }>(this.base + '/imports/excel', form).pipe(timeout(60000)));
  }
  private edit(event: CalendarEvent): CalendarEvent {
    const time = (value: string | null) => value && value.length === 5 ? value + ':00' : value || null;
    return { ...event, startTime: time(event.startTime), endTime: time(event.endTime) };
  }
  review(draft: CalendarImport): Promise<CalendarImport> {
    return firstValueFrom(this.http.put<CalendarImport>(`${this.base}/imports/${draft.id}`, {
      updatedAt: draft.updatedAt, events: draft.events.map(x => this.edit(x))
    }).pipe(timeout(30000)));
  }
  approve(draft: CalendarImport): Promise<unknown> {
    return firstValueFrom(this.http.post(`${this.base}/imports/${draft.id}/approve`, { updatedAt: draft.updatedAt, events: [] }).pipe(timeout(30000)));
  }
  reject(id: number): Promise<unknown> { return firstValueFrom(this.http.post(`${this.base}/imports/${id}/reject`, {}).pipe(timeout(20000))); }
  update(event: CalendarEvent): Promise<unknown> { return firstValueFrom(this.http.put(`${this.base}/${event.id}`, this.edit(event)).pipe(timeout(20000))); }
}
