import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { communityRoleLabel } from '../../auth/community-roles';
import { TAPPE_CAMMINO } from '../gestionaleCN/data/tappe-cammino.mock';

export interface MemberDraft { firstName: string; lastName: string; email: string; phone: string; birthDate: string; stage: string; role: string }
@Component({
  selector: 'app-member-editor', standalone: true, imports: [FormsModule], styleUrl: './mobile-community.scss',
  template: `
    <form class="member-form" (ngSubmit)="saved.emit()">
      <label>Nome<input name="firstName" [(ngModel)]="draft.firstName" required maxlength="100" autocomplete="given-name" [disabled]="busy" /></label>
      <label>Cognome<input name="lastName" [(ngModel)]="draft.lastName" required maxlength="100" autocomplete="family-name" [disabled]="busy" /></label>
      @if (editBirth) { <label>Data di nascita opzionale<input type="date" name="birthDate" [(ngModel)]="draft.birthDate" min="1900-01-01" [max]="today" [disabled]="busy" /></label> }
      @if (editPhone) { <label>Telefono opzionale<input name="phone" [(ngModel)]="draft.phone" type="tel" maxlength="32" [disabled]="busy" /></label> }
      @if (editEmail) { <label>Email opzionale<input name="email" [(ngModel)]="draft.email" type="email" maxlength="256" [disabled]="busy" /></label> }
      <label>Tappa del Cammino<select name="stage" [(ngModel)]="draft.stage" [disabled]="busy"><option value="">Non indicata</option>@for (stage of stages; track stage) { <option [value]="stage">{{ stage }}</option> }</select></label>
      <label>Ruolo nella comunità<select name="role" [(ngModel)]="draft.role" [disabled]="busy || roles.length < 2">@for (role of roles; track role) { <option [value]="role">{{ roleLabel(role) }}</option> }</select></label>
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
  @Output() readonly saved = new EventEmitter<void>();
  @Output() readonly cancelled = new EventEmitter<void>();
  protected readonly stages = TAPPE_CAMMINO;
  protected readonly roleLabel = communityRoleLabel;
  protected readonly today = new Date().toISOString().slice(0, 10);
}
