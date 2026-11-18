import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { communityRoleLabel } from '../../auth/community-roles';
import { TAPPE_CAMMINO } from '../gestionaleCN/data/tappe-cammino.mock';

export interface MemberDraft { firstName: string; lastName: string; email: string; phone: string; birthDate: string; stage: string; role: string; spouseId: number | null }
@Component({
  selector: 'app-member-editor', standalone: true, imports: [FormsModule, DatePipe], styleUrl: './mobile-community.scss',
  template: `
    <form class="member-form" #form="ngForm" (ngSubmit)="submit(form)">
      <label>Nome<input name="firstName" [(ngModel)]="draft.firstName" required maxlength="100" autocomplete="given-name" [disabled]="busy" /></label>
      <label>Cognome<input name="lastName" [(ngModel)]="draft.lastName" required maxlength="100" autocomplete="family-name" [disabled]="busy" /></label>
      @if (editBirth) {
        <label>Data di nascita opzionale<input type="date" lang="it-IT" name="birthDate" [(ngModel)]="draft.birthDate" (ngModelChange)="validationError = ''" min="1900-01-01" [max]="today" [disabled]="busy" aria-describedby="birth-summary" /></label>
        <small id="birth-summary">{{ draft.birthDate ? ((draft.birthDate + 'T00:00:00Z') | date:'dd/MM/yyyy':'UTC') : 'Non indicata' }}</small>
      }
      @if (editPhone) { <label>Telefono opzionale<input name="phone" [(ngModel)]="draft.phone" type="tel" maxlength="32" [disabled]="busy" /></label> }
      @if (editEmail) { <label>Email opzionale<input name="email" [(ngModel)]="draft.email" type="email" email maxlength="256" [disabled]="busy" /></label> }
      <label>Tappa del Cammino<select name="stage" [(ngModel)]="draft.stage" [disabled]="busy"><option value="">Non indicata</option>@for (stage of stages; track stage) { <option [value]="stage">{{ stage }}</option> }</select></label>
      <label>Ruolo nella comunità<select name="role" [(ngModel)]="draft.role" [disabled]="busy || roles.length < 2">@for (role of roles; track role) { <option [value]="role">{{ roleLabel(role) }}</option> }</select></label>
      @if (editSpouse) {
        <label>Coniuge opzionale<select name="spouseId" [(ngModel)]="draft.spouseId" [disabled]="busy"><option [ngValue]="null">Nessun collegamento</option>@for (person of spouseCandidates; track person.personId) { <option [ngValue]="person.personId">{{ person.firstName }} {{ person.lastName }}</option> }</select></label>
      }
      @if (validationError) { <p class="feedback" role="alert">{{ validationError }}</p> }
      <p class="muted">Responsabile: assegnazione tramite approvazione superiore. Privacy e consensi restano personali.</p>
      <button class="primary" type="submit" [disabled]="busy">{{ busy ? 'Salvataggio...' : 'Salva fratello' }}</button>
      <button class="secondary" type="button" [disabled]="busy" (click)="cancelled.emit()">Annulla</button>
    </form>
  `
})
export class MemberEditor {
  @Input({ required: true }) draft!: MemberDraft;
  @Input() roles: string[] = ['MEMBER'];
  @Input() busy = false;
  @Input() editPhone = true;
  @Input() editEmail = true;
  @Input() editBirth = true;
  @Input() editSpouse = false;
  @Input() spouseCandidates: { personId: number; firstName: string; lastName: string }[] = [];
  @Output() readonly saved = new EventEmitter<void>();
  @Output() readonly cancelled = new EventEmitter<void>();
  protected readonly stages = TAPPE_CAMMINO;
  protected roleLabel(role: string): string { return role === 'MEMBER' ? 'Fratello / Sorella' : communityRoleLabel(role); }
  protected get today(): string { const now = new Date(); return [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-'); }
  protected validationError = '';
  protected submit(form: NgForm): void {
    this.validationError = '';
    if (this.busy) return;
    if (this.editBirth && this.draft.birthDate && (this.draft.birthDate > this.today || this.draft.birthDate < '1900-01-01')) {
      this.validationError = 'Inserisci una data di nascita valida, non futura.'; return;
    }
    if (form.invalid) { form.control.markAllAsTouched(); this.validationError = 'Verifica nome, cognome ed email prima di salvare.'; return; }
    this.saved.emit();
  }
}
