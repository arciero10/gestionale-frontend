import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { DirectoryDraft, DirectoryImportApiService, DirectoryRow } from '../../services/directory-import-api.service';
import { communityRoleLabel } from '../../auth/community-roles';
import { TAPPE_CAMMINO } from '../gestionaleCN/data/tappe-cammino.mock';

@Component({
  selector: 'app-mobile-directory-import-row', standalone: true, imports: [FormsModule, RouterLink], styleUrl: './directory-import.scss',
  template: `

    <h1>Verifica persona</h1>
    @if (loading) { <p role="status">Caricamento riga...</p> }
    @if (error) { <p class="feedback error" role="alert">{{ error }}</p><button (click)="load()" [disabled]="busy">Ricarica riga</button> }
    @if (draft && row) {
      <p>{{ row.sourceLocator }}</p><details><summary>Sorgente originale</summary><pre>{{ row.sourceText }}</pre></details>
      @if (draft.status === 'CONFIRMED') { <p role="status">Importazione già confermata.</p>@if (row.resultPersonId) { <a class="primary full" [routerLink]="['/mobile/community/member', row.resultPersonId]">Apri scheda membro</a> } }
      @else {
        @if (row.issues.length) { <section class="warning"><h2>Dati da verificare</h2>@for (issue of row.issues; track $index) { <p>{{ issue }}</p> }</section> }
        @if (row.evidence; as evidence) {
          <details open><summary>Origine dei dati</summary>
            @for (field of evidence.fields; track $index) { <p><strong>{{ fieldLabel(field.field) }}: {{ field.value || 'Non indicato' }}</strong><br><span [class.warning]="field.confidence !== 'RICONOSCIUTO'">{{ field.confidence === 'RICONOSCIUTO' ? 'Riconosciuto' : field.confidence === 'INFERITO' ? 'Inferito · da confermare' : 'Da verificare' }}</span><br>{{ field.origin }}</p> }
            @for (address of evidence.addresses; track $index) { <p>Indirizzo sorgente: {{ address }}</p> }
            @for (contact of evidence.additionalContacts; track $index) { <p>{{ contact.value }} · {{ contact.origin }}</p> }
          </details>
        }
        @if (row.candidates.length || row.batchDuplicates.length) { <section class="warning"><h2>Possibile duplicato</h2>@for (candidate of row.candidates; track candidate.id) { <p>{{ candidate.firstName }} {{ candidate.lastName }}@if (!candidate.active) { · Non attivo }</p> }@if (row.batchDuplicates.length) { <p>Altre righe dell'elenco condividono nome o contatti. Unisci i dati e ignora eventuali copie.</p> }</section> }
        <fieldset><legend>Decisione</legend>
          <label class="check"><input type="radio" name="decision" value="NEW" [(ngModel)]="row.action" [disabled]="busy" />Crea nuova persona</label>
          <label class="check"><input type="radio" name="decision" value="EXISTING" [(ngModel)]="row.action" [disabled]="busy" />Usa persona esistente</label>
          <label class="check"><input type="radio" name="decision" value="IGNORE" [(ngModel)]="row.action" [disabled]="busy" />Ignora riga</label>
          @if (row.action === 'EXISTING') {
            <label>Persona esistente<select aria-label="Persona esistente" [(ngModel)]="row.targetPersonId" (ngModelChange)="chooseExisting()" [disabled]="busy"><option [ngValue]="null">Seleziona nella comunità</option>@for (person of draft.people; track person.id) { <option [ngValue]="person.id">{{ person.firstName }} {{ person.lastName }}</option> }</select></label>
            <label class="check"><input type="checkbox" [(ngModel)]="row.updateExisting" [disabled]="busy" />Aggiorna i dati della persona esistente</label>
          }
        </fieldset>
        @if (row.action !== 'IGNORE') {
          <section>
            <label>Nome<input [(ngModel)]="row.firstName" maxlength="100" [disabled]="busy" autocomplete="given-name" /></label>
            <label>Cognome<input [(ngModel)]="row.lastName" maxlength="100" [disabled]="busy" autocomplete="family-name" /></label>
            <label>Telefono opzionale<input type="tel" [(ngModel)]="row.phone" maxlength="32" [disabled]="busy" /></label>
            <label>Email opzionale<input type="email" [(ngModel)]="row.email" maxlength="256" [disabled]="busy" /></label>
            <label>Data di nascita opzionale<input type="date" [(ngModel)]="row.birthDate" min="1900-01-01" [disabled]="busy || ignoreBirthDate" /></label>
            @if (row.birthDateRaw) { <p>Data originale: {{ row.birthDateRaw }}</p> }
            <label class="check"><input type="checkbox" [(ngModel)]="ignoreBirthDate" [disabled]="busy" />Non importare la data di nascita</label>
            @if (row.action === 'EXISTING') { <label class="check"><input type="checkbox" [(ngModel)]="row.updateRole" [disabled]="busy || draft.roles.length === 1" />Aggiorna anche il ruolo</label> }
            <label>Ruolo<select aria-label="Ruolo" [(ngModel)]="row.role" [disabled]="busy || row.action === 'EXISTING' && !row.updateRole">
              @if (!draft.roles.includes(row.role)) { <option [value]="row.role">{{ row.role }} · Da verificare</option> }@for (role of draft.roles; track role) { <option [value]="role">{{ role === 'MEMBER' ? 'Fratello / Sorella' : roleLabel(role) }}</option> }
            </select></label>@if (row.roleRaw) { <small>Ruolo originale: {{ row.roleRaw }}</small> }
            <label>Tappa del Cammino<select aria-label="Tappa del Cammino" [(ngModel)]="row.stage" [disabled]="busy"><option value="">Non indicata</option>@if (row.stage && !stages.includes($any(row.stage))) { <option [value]="row.stage">{{ row.stage }} · Da verificare</option> }@for (stage of stages; track stage) { <option [value]="stage">{{ stage }}</option> }</select></label>
            <label>Note riservate<textarea rows="3" [(ngModel)]="row.notes" maxlength="2000" [disabled]="busy"></textarea></label>
          </section>
          <fieldset><legend>Coniuge</legend>
            @if (row.spouseRaw) { <p>Indicazione originale: {{ row.spouseRaw }}</p> }
            @if (row.spouseMatches.length === 1) { <button type="button" (click)="useSpouseProposal()" [disabled]="busy">Usa proposta: {{ row.spouseMatches[0].name }}</button> }
            @if (row.spouseMatches.length > 1) { <p class="warning">Nome ambiguo: scegli la persona corretta.</p> }
            <label class="check"><input type="checkbox" [(ngModel)]="row.applySpouse" [disabled]="busy" />Confermo il collegamento coniuge</label>
            @if (row.applySpouse) { <label>Coniuge da collegare<select aria-label="Coniuge da collegare" [(ngModel)]="spouseChoice" [disabled]="busy"><option value="">Seleziona</option>
              @for (person of draft.people; track person.id) { @if (person.id !== row.targetPersonId) { <option [value]="'p:' + person.id">{{ person.firstName }} {{ person.lastName }} · Rubrica</option> } }
              @for (other of draft.rows; track other.id) { @if (other.id !== row.id && other.sourceSelected && other.action !== 'IGNORE') { <option [value]="'r:' + other.id">{{ other.firstName }} {{ other.lastName }} · Elenco importato</option> } }
            </select></label> }
          </fieldset>
          @if (row.candidates.length || row.batchDuplicates.length) { <label class="check"><input type="checkbox" [(ngModel)]="row.duplicateConfirmed" [disabled]="busy" />Ho verificato che i contatti condivisi appartengano a persone distinte</label> }
        }
        @if (hasInferences && row.action !== 'IGNORE') { <label class="check"><input type="checkbox" [(ngModel)]="inferencesReviewed" [disabled]="busy" />Ho verificato o corretto i dati inferiti</label> }
        <button type="button" class="primary full" (click)="save()" [disabled]="busy || row.action === 'REVIEW' || row.action !== 'IGNORE' && hasInferences && !inferencesReviewed">{{ busy ? 'Salvataggio...' : 'Salva verifica' }}</button>
      }
    }
  `
})
export class MobileDirectoryImportRow implements OnInit {
  private readonly api = inject(DirectoryImportApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  protected readonly importId = Number(this.route.snapshot.paramMap.get('id'));
  private readonly rowId = Number(this.route.snapshot.paramMap.get('rowId'));
  protected readonly roleLabel = communityRoleLabel;
  protected readonly stages = TAPPE_CAMMINO;
  protected draft: DirectoryDraft | null = null; protected row: DirectoryRow | null = null;
  protected loading = true; protected busy = false; protected error = ''; protected spouseChoice = ''; protected ignoreBirthDate = false;
  protected inferencesReviewed = false;
  protected get hasInferences(): boolean { return this.row?.evidence?.fields.some(x => x.confidence !== 'RICONOSCIUTO') ?? false; }
  protected fieldLabel(field: string): string { return ({ firstName: 'Nome', lastName: 'Cognome', phone: 'Telefono', email: 'Email' } as Record<string, string>)[field] ?? field; }
  ngOnInit(): void { void this.load(); }
  protected async load(): Promise<void> {
    this.loading = true; this.error = '';
    try { this.draft = await this.api.get(this.importId); this.row = structuredClone(this.draft.rows.find(x => x.id === this.rowId) ?? null);
      if (!this.row) this.error = 'Riga non disponibile nella tua comunità.';
      this.spouseChoice = this.row?.spousePersonId ? 'p:' + this.row.spousePersonId : this.row?.spouseRowId ? 'r:' + this.row.spouseRowId : '';
      this.inferencesReviewed = this.row?.reviewed ?? false;
    } catch { this.error = 'Impossibile caricare la riga. Riprova.'; } finally { this.loading = false; }
  }
  protected chooseExisting(): void {
    const person = this.draft?.people.find(x => x.id === this.row?.targetPersonId);
    if (person && this.row) { if (!this.row.firstName) this.row.firstName = person.firstName; if (!this.row.lastName) this.row.lastName = person.lastName; }
  }
  protected useSpouseProposal(): void {
    const proposal = this.row?.spouseMatches[0]; if (!proposal || !this.row) return;
    this.spouseChoice = proposal.personId ? 'p:' + proposal.personId : 'r:' + proposal.rowId;
    this.row.applySpouse = true;
  }
  protected async save(): Promise<void> {
    if (!this.draft || !this.row || this.busy || this.row.action !== 'IGNORE' && this.hasInferences && !this.inferencesReviewed) return;
    this.busy = true; this.error = '';
    try {
      this.row.spousePersonId = this.row.applySpouse && this.spouseChoice.startsWith('p:') ? Number(this.spouseChoice.slice(2)) : null;
      this.row.spouseRowId = this.row.applySpouse && this.spouseChoice.startsWith('r:') ? Number(this.spouseChoice.slice(2)) : null;
      await this.api.row(this.draft, this.row, this.ignoreBirthDate);
      await this.router.navigateByUrl('/mobile/community/import/' + this.importId);
    } catch (error) { this.error = error instanceof HttpErrorResponse ? error.error?.message ?? 'Verifica non salvata. I dati compilati restano disponibili.' : 'Verifica non salvata. Riprova.'; }
    finally { this.busy = false; }
  }
}
