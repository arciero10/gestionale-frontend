import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { CurrentUserService } from '../../auth/current-user.service';
import { CalendarApiService, CalendarImport } from '../../services/calendar-api.service';
import { CalendarEventEditor } from './calendar-event-editor';

@Component({
  selector: 'app-mobile-calendar-import', standalone: true, imports: [FormsModule, RouterLink, CalendarEventEditor],
  template: `
    <a class="back" routerLink="/mobile/calendar"><i class="pi pi-arrow-left" aria-hidden="true"></i> Calendario</a>
    <h1>{{ draft ? 'Revisione calendario' : 'Importa calendario' }}</h1>
    @if (!canManage) { <p role="alert">Non hai il permesso di gestire il calendario.</p> }
    @else {
      @if (error) { <p class="feedback error" role="alert">{{ error }}</p> }
      @if (feedback) { <p class="feedback" role="status">{{ feedback }}</p> }
      @if (busy) { <p role="status">{{ draft ? 'Salvataggio calendario...' : 'Analisi del calendario in corso...' }}</p> }
      @if (draft; as item) {
        <section class="summary"><h2>Abbiamo riconosciuto {{ item.events.length }} eventi</h2><p>{{ ready() }} pronti · {{ uncertain() }} da verificare · {{ unrecognized() }} non riconosciuti</p><p>{{ item.originalFileName || 'Testo incollato' }} · {{ item.status }}</p></section>
        @for (event of item.events; track event.id) {
          <section class="review"><h2>{{ event.title || 'Evento da riconoscere' }}</h2><small>{{ event.sourceLocator }}</small>
            <details><summary>Sorgente originale</summary><pre>{{ event.sourceText }}</pre></details>
            @if (item.status === 'PARSED') { <app-calendar-event-editor [event]="event" [people]="item.people" /> }
            @else { <p>{{ event.date }} · {{ event.title }}</p> }
          </section>
        }
        @if (item.status === 'PARSED') {
          <div class="actions"><button type="button" (click)="save(false)" [disabled]="busy">Salva bozza</button><button type="button" class="primary" (click)="save(true)" [disabled]="busy">Approva e pubblica</button><button type="button" class="danger" (click)="reject()" [disabled]="busy">Rifiuta importazione</button></div>
        } @else { <a class="primary" routerLink="/mobile/calendar">Torna al calendario</a> }
      } @else if (!loadingDraft) {
        <div class="modes" role="group" aria-label="Sorgente calendario"><button [class.selected]="source === 'TEXT'" (click)="source = 'TEXT'" [disabled]="busy">Incolla testo</button><button [class.selected]="source === 'EXCEL'" (click)="source = 'EXCEL'" [disabled]="busy">Excel .xlsx</button></div>
        <label>Anno di riferimento<input type="number" min="2000" max="2100" [(ngModel)]="year" [disabled]="busy" /></label>
        @if (source === 'TEXT') { <label>Testo del calendario<textarea rows="12" maxlength="100000" [(ngModel)]="text" [disabled]="busy"></textarea></label> }
        @else { <label>Documento Excel<input type="file" accept=".xlsx" (change)="selectFile($event)" [disabled]="busy" /></label>@if (file) { <p>{{ file.name }}</p> } }
        <button type="button" class="primary" (click)="parse()" [disabled]="busy || year < 2000 || year > 2100 || (source === 'TEXT' ? !text.trim() : !file)">Analizza e crea bozza</button>
      } @else if (!busy) { <button (click)="loadDraft()">Riprova caricamento bozza</button> }
    }
  `,
  styles: [`
    :host{display:block;color:var(--color-text-primary);min-width:0}h1{font-size:25px;margin:12px 0 20px}h2{font-size:17px;margin:4px 0 12px;overflow-wrap:anywhere}.back{display:inline-flex;align-items:center;gap:8px;min-height:48px;color:var(--color-primary);text-decoration:none}section{background:var(--color-surface);border:1px solid var(--color-divider);border-radius:8px;padding:16px;margin:16px 0}small,p{color:var(--color-text-secondary);line-height:1.5;overflow-wrap:anywhere}label{display:block;font-size:14px;font-weight:600;margin:20px 0}input,textarea{display:block;box-sizing:border-box;width:100%;min-width:0;min-height:48px;border:1px solid var(--color-border);border-radius:6px;background:var(--color-surface);color:var(--color-text-primary);padding:12px;margin-top:8px;font:inherit}button,.primary{min-height:48px;padding:12px 14px;background:var(--color-surface);border:1px solid var(--color-border);border-radius:6px;color:var(--color-primary);font:inherit;font-weight:600;text-decoration:none;display:inline-flex;align-items:center;justify-content:center}.primary,.selected{background:var(--color-primary);color:var(--color-surface)}.danger{color:var(--color-danger)}button:disabled{opacity:.6}.modes,.actions{display:flex;flex-wrap:wrap;gap:10px}.modes>*{flex:1}.actions>*{flex:1 1 180px}.feedback{padding:14px;background:var(--color-success-tint);color:var(--color-success);border-radius:6px}.error{background:var(--color-danger-tint);color:var(--color-danger)}pre{white-space:pre-wrap;overflow-wrap:anywhere;font:inherit;color:var(--color-text-secondary)}summary{min-height:44px;padding-top:12px;cursor:pointer}a:focus-visible,button:focus-visible,input:focus-visible,textarea:focus-visible{outline:3px solid var(--color-focus);outline-offset:2px}
  `]
})
export class MobileCalendarImport implements OnInit {
  private readonly api = inject(CalendarApiService);
  private readonly current = inject(CurrentUserService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  protected draft: CalendarImport | null = null;
  protected source: 'TEXT' | 'EXCEL' = 'TEXT';
  protected year = new Date().getFullYear(); protected text = ''; protected file: File | null = null;
  protected busy = false; protected error = ''; protected feedback = ''; protected loadingDraft = false;
  protected get canManage(): boolean { const actor = this.current.context(); return actor?.role === 'RESPONSIBLE' || actor?.role === 'CO_RESPONSIBLE' && actor.permissions.includes('EDIT_CALENDAR'); }
  protected ready(): number { return this.draft?.events.filter(x => !x.isIgnored && x.reviewConfirmed && x.date && x.assignments.every(a => a.personId) && (!x.possibleDuplicate || x.duplicateConfirmed)).length ?? 0; }
  protected unrecognized(): number { return this.draft?.events.filter(x => !x.isIgnored && !x.date).length ?? 0; }
  protected uncertain(): number { return (this.draft?.events.filter(x => !x.isIgnored).length ?? 0) - this.ready() - this.unrecognized(); }
  ngOnInit(): void { if (this.route.snapshot.paramMap.get('id') && this.canManage) { this.loadingDraft = true; void this.loadDraft(); } }
  protected selectFile(event: Event): void { this.file = (event.target as HTMLInputElement).files?.[0] ?? null; this.error = ''; }
  private message(error: unknown): string { return error instanceof HttpErrorResponse && typeof error.error?.message === 'string' ? error.error.message : 'Operazione non completata. I dati restano disponibili: riprova.'; }
  protected async loadDraft(): Promise<void> {
    this.busy = true; this.error = '';
    try { this.draft = await this.api.draft(Number(this.route.snapshot.paramMap.get('id'))); }
    catch (error) { this.error = this.message(error); }
    finally { this.busy = false; }
  }
  protected async parse(): Promise<void> {
    if (this.busy || !this.canManage) return;
    this.busy = true; this.error = ''; this.feedback = '';
    try {
      if (this.file && (this.file.size > 5000000 || !this.file.name.toLowerCase().endsWith('.xlsx'))) throw new Error('Formato');
      const result = this.source === 'TEXT' ? await this.api.text(this.text, this.year) : await this.api.excel(this.file!, this.year);
      await this.router.navigateByUrl('/mobile/calendar/import/' + result.id);
    } catch (error) { this.error = this.message(error); }
    finally { this.busy = false; }
  }
  protected async save(publish: boolean): Promise<void> {
    if (!this.draft || this.busy) return;
    this.busy = true; this.error = ''; this.feedback = '';
    try {
      this.draft = await this.api.review(this.draft);
      if (publish) { await this.api.approve(this.draft); this.draft = await this.api.draft(this.draft.id); }
      this.feedback = publish ? 'Calendario approvato e pubblicato nella comunità.' : 'Bozza salvata. Non ancora visibile ai fratelli.';
    } catch (error) { this.error = this.message(error); }
    finally { this.busy = false; }
  }
  protected async reject(): Promise<void> {
    if (!this.draft || this.busy) return;
    this.busy = true; this.error = '';
    try { await this.api.reject(this.draft.id); this.draft = await this.api.draft(this.draft.id); this.feedback = 'Importazione rifiutata. Nessun evento pubblicato.'; }
    catch (error) { this.error = this.message(error); } finally { this.busy = false; }
  }
}
