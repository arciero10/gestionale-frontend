import { Component, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CalendarEvent, CalendarPerson, CALENDAR_TYPES } from '../../services/calendar-api.service';

@Component({
  selector: 'app-calendar-event-editor', standalone: true, imports: [FormsModule],
  template: `
    @if (event(); as ev) {
      <div class="fields">
        <label>Data<input type="date" [(ngModel)]="ev.date" required /></label>
        <label>Titolo<input [(ngModel)]="ev.title" maxlength="240" required /></label>
        <label>Ora inizio<input type="time" [(ngModel)]="ev.startTime" /></label>
        <label>Ora fine<input type="time" [(ngModel)]="ev.endTime" /></label>
        <label>Tipo<select aria-label="Tipo" [(ngModel)]="ev.eventType">@for (type of types; track type) { <option>{{ type }}</option> }</select></label>
        <label>Luogo<input [(ngModel)]="ev.location" maxlength="500" /></label>
        <label class="wide">Descrizione<textarea [(ngModel)]="ev.description" maxlength="10000" rows="3"></textarea></label>
      </div>
      <h3>Incarichi</h3>
      @for (assignment of ev.assignments; track $index; let index = $index) {
        <fieldset>
          <legend>{{ assignment.rawName || assignment.displayName || 'Incaricato' }}</legend>
          <span class="match" [class.matched]="assignment.personId" [class.ambiguous]="!assignment.personId && assignment.matchStatus === 'AMBIGUOUS'">
            {{ assignment.personId ? 'Riconosciuto' : assignment.matchStatus === 'AMBIGUOUS' ? 'Da confermare' : 'Non trovato' }}
          </span>
          <label>Persona<select aria-label="Persona" [(ngModel)]="assignment.personId"><option [ngValue]="null">Seleziona nella comunità</option>
            @for (person of people(); track person.id) { <option [ngValue]="person.id">{{ person.firstName }} {{ person.lastName }}</option> }
          </select></label>
          <label>Incarico<input [(ngModel)]="assignment.label" maxlength="160" required /></label>
          <label>Promemoria: giorni prima<input type="number" min="0" max="365" [(ngModel)]="assignment.reminderDaysBefore" /></label>
          <label>Note incarico<input [(ngModel)]="assignment.notes" maxlength="2000" /></label>
          <button type="button" class="remove" (click)="ev.assignments.splice(index, 1)"><i class="pi pi-trash" aria-hidden="true"></i> Rimuovi incarico</button>
        </fieldset>
      }
      <button type="button" (click)="add()"><i class="pi pi-plus" aria-hidden="true"></i> Aggiungi incarico</button>
      @if (!published()) {
        <label class="check"><input type="checkbox" [(ngModel)]="ev.isIgnored" /> Escludi questa riga dall'importazione</label>
        <label class="check"><input type="checkbox" [(ngModel)]="ev.reviewConfirmed" /> Ho verificato data, titolo e incarichi</label>
      } @else { <label class="check"><input type="checkbox" [(ngModel)]="ev.isCancelled" /> Evento annullato</label> }
      @if (ev.possibleDuplicate) { <p class="warning">Possibile duplicato</p> }
      <label class="check"><input type="checkbox" [(ngModel)]="ev.duplicateConfirmed" /> Confermo l'eventuale duplicazione intenzionale</label>
    }
  `,
  styles: [`
    :host{display:block;min-width:0}.fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.wide{grid-column:1/-1}
    label{display:block;font-size:13px;font-weight:600;color:var(--color-text-primary);margin:10px 0}input:not([type=checkbox]),select,textarea{display:block;width:100%;min-width:0;min-height:48px;margin-top:6px;border:1px solid var(--color-border);border-radius:6px;background:var(--color-surface);padding:10px;color:var(--color-text-primary);font:inherit;box-sizing:border-box}
    .check{display:flex;align-items:center;gap:10px;min-height:44px}.check input{width:20px;height:20px;flex-shrink:0}h3{font-size:16px;margin:20px 0 10px}fieldset{min-width:0;margin:12px 0;padding:12px;border:1px solid var(--color-border);border-radius:6px}legend{overflow-wrap:anywhere}button{min-height:48px;padding:10px;border:1px solid var(--color-border);border-radius:6px;background:var(--color-surface);color:var(--color-primary);font:inherit;font-weight:600}.remove{color:var(--color-danger)}.match{color:var(--color-danger);font-size:13px;font-weight:600}.matched{color:var(--color-success)}.ambiguous,.warning{color:var(--color-warning)}button:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible{outline:3px solid var(--color-focus);outline-offset:2px}@media(max-width:360px){.fields{grid-template-columns:minmax(0,1fr)}}
  `]
})
export class CalendarEventEditor {
  readonly event = input.required<CalendarEvent>();
  readonly people = input<CalendarPerson[]>([]);
  readonly published = input(false);
  protected readonly types = CALENDAR_TYPES;
  protected add(): void { this.event().assignments.push({ personId: null, rawName: '', label: 'Preparazione', reminderDaysBefore: null }); }
}
