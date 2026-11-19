import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { CurrentUserService } from '../../auth/current-user.service';
import { DirectoryDraft, DirectoryImportApiService, DirectorySummary, directoryStateLabel } from '../../services/directory-import-api.service';

@Component({
  selector: 'app-mobile-directory-import', standalone: true, imports: [FormsModule, RouterLink], styleUrl: './directory-import.scss',
  template: `
    <a class="back" routerLink="/mobile/community"><i class="pi pi-arrow-left" aria-hidden="true"></i> Rubrica comunità</a>
    <h1>{{ draft ? 'Verifica elenco' : 'Importa elenco' }}</h1>
    @if (!canImport) { <p role="alert">Non hai il permesso di importare membri.</p> }
    @else {
      @if (error) { <p class="feedback error" role="alert">{{ error }}</p>@if (id) { <button type="button" (click)="load()" [disabled]="busy">Ricarica bozza</button> } }
      @if (busy) { <p role="status">{{ draft ? 'Salvataggio in corso...' : 'Analisi elenco in corso...' }}</p> }
      @if (draft; as item) {
        @if (item.status === 'CONFIRMED') {
          <section class="success" role="status"><h2>Importazione completata</h2><p>{{ item.newPeopleCount }} nuove persone · {{ item.existingPeopleCount }} persone già censite · {{ item.ignoredCount }} righe ignorate</p></section>
          <a class="primary full" routerLink="/mobile/community">Torna alla rubrica</a>
        } @else {
          <section><h2>Abbiamo trovato {{ item.rows.length }} {{ item.rows.length === 1 ? 'persona' : 'persone' }}</h2><p class="counts">{{ count('PRONTO') }} pronte · {{ count('DA_VERIFICARE') }} da verificare · {{ count('POSSIBILE_DUPLICATO') }} possibili duplicati · {{ count('ERRORE') }} da correggere</p><p>{{ included }} incluse · {{ item.rows.length - included }} escluse</p><small>{{ item.originalFileName || 'Testo incollato' }}</small></section>
          @if (item.sheets.length > 1) { <details open><summary>Fogli da includere</summary>@for (sheet of item.sheets; track sheet) {
            <label class="check"><input type="checkbox" [checked]="sheetIncluded(sheet)" (change)="selectSheet(sheet, $any($event.target).checked)" [disabled]="busy" />{{ sheet }}</label>
          }</details> }
          <ul class="rows" aria-label="Persone importate">@for (row of item.rows; track row.id) {
            <li><a class="row-link" [routerLink]="['/mobile/community/import', item.id, 'row', row.id]">
              <span class="row-copy"><strong>{{ row.firstName }} {{ row.lastName }}@if (!row.firstName && !row.lastName) { Nome da riconoscere }</strong>
                @if (row.phone) { <small>{{ row.phone }}</small> }<small>{{ row.sourceLocator }}</small><span [class]="'badge ' + row.state">{{ stateLabel(row.state) }}</span>
              </span><i class="pi pi-chevron-right" aria-hidden="true"></i>
            </a></li>
          }</ul>
          <label class="check"><input type="checkbox" [(ngModel)]="reviewed" [disabled]="busy" />Ho verificato l'elenco, i dati e le persone selezionate</label>
          <button class="primary full" type="button" (click)="confirm()" [disabled]="busy || !reviewed || unresolved || !included">Conferma importazione</button>
        }
      } @else if (!id) {
        <div class="modes" role="group" aria-label="Sorgente elenco"><button type="button" [class.selected]="source === 'TEXT'" (click)="source = 'TEXT'" [disabled]="busy">Testo</button><button type="button" [class.selected]="source === 'EXCEL'" (click)="source = 'EXCEL'" [disabled]="busy">Excel</button><button type="button" [class.selected]="source === 'CSV'" (click)="source = 'CSV'" [disabled]="busy">CSV</button></div>
        @if (source === 'TEXT') { <label>Elenco da analizzare<textarea rows="12" [(ngModel)]="text" maxlength="100000" [disabled]="busy"></textarea></label> }
        @else { <label>File {{ source === 'EXCEL' ? 'Excel .xlsx' : 'CSV .csv' }}<input type="file" [accept]="source === 'EXCEL' ? '.xlsx' : '.csv'" (change)="selectFile($event)" [disabled]="busy" /></label>@if (file) { <p>{{ file.name }}</p> } }
        <button type="button" class="primary full" (click)="parse()" [disabled]="busy || (source === 'TEXT' ? !text.trim() : !file)">Analizza e crea bozza</button>
        @if (history.length) { <details><summary>Importazioni precedenti</summary>@for (item of history; track item.id) {
          <a class="row-link" [routerLink]="['/mobile/community/import', item.id]"><span class="row-copy"><strong>{{ item.originalFileName || 'Elenco da testo' }}</strong><small>{{ item.count }} righe · {{ item.status === 'CONFIRMED' ? 'Confermata' : 'Bozza' }}</small></span><i class="pi pi-chevron-right" aria-hidden="true"></i></a>
        }</details> }
      }
    }
  `
})
export class MobileDirectoryImport implements OnInit {
  private readonly api = inject(DirectoryImportApiService);
  private readonly current = inject(CurrentUserService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  protected readonly id = Number(this.route.snapshot.paramMap.get('id')) || null;
  protected readonly stateLabel = directoryStateLabel;
  protected draft: DirectoryDraft | null = null; protected history: DirectorySummary[] = [];
  protected source: 'TEXT' | 'EXCEL' | 'CSV' = 'TEXT'; protected text = ''; protected file: File | null = null;
  protected busy = false; protected error = ''; protected reviewed = false;
  protected get canImport(): boolean { const actor = this.current.context(); return !!actor?.permissions.includes('EDIT_MEMBRI') && ['RESPONSIBLE', 'CO_RESPONSIBLE'].includes(actor.role ?? ''); }
  protected get unresolved(): boolean { return this.draft?.rows.some(x => x.sourceSelected && x.action !== 'IGNORE' && x.state !== 'PRONTO') ?? true; }
  protected get included(): number { return this.draft?.rows.filter(x => x.sourceSelected && x.action !== 'IGNORE').length ?? 0; }
  protected count(state: string): number { return this.draft?.rows.filter(x => x.sourceSelected && x.state === state).length ?? 0; }
  protected sheetIncluded(sheet: string): boolean { return this.draft?.rows.some(x => x.sourceSheet === sheet && x.sourceSelected) ?? false; }
  ngOnInit(): void { if (this.canImport) void this.load(); }
  private message(error: unknown): string { return error instanceof HttpErrorResponse && typeof error.error?.message === 'string' ? error.error.message : 'Operazione non completata. I dati restano disponibili: riprova.'; }
  protected async load(): Promise<void> {
    this.busy = true; this.error = '';
    try { if (this.id) this.draft = await this.api.get(this.id); else this.history = await this.api.list(); }
    catch (error) { this.error = this.message(error); } finally { this.busy = false; }
  }
  protected selectFile(event: Event): void { this.file = (event.target as HTMLInputElement).files?.[0] ?? null; this.error = ''; }
  protected async parse(): Promise<void> {
    if (this.busy || !this.canImport) return;
    this.busy = true; this.error = '';
    try {
      if (this.source !== 'TEXT' && (!this.file || this.file.size > 5000000 || !this.file.name.toLowerCase().endsWith(this.source === 'EXCEL' ? '.xlsx' : '.csv'))) { this.error = 'Seleziona il formato corretto, massimo 5 MB.'; return; }
      const result = this.source === 'TEXT' ? await this.api.text(this.text) : await this.api.file(this.file!);
      await this.router.navigateByUrl('/mobile/community/import/' + result.id);
    } catch (error) { this.error = this.message(error); } finally { this.busy = false; }
  }
  protected async selectSheet(sheet: string, checked: boolean): Promise<void> {
    if (!this.draft || this.busy) return;
    const sheets = this.draft.sheets.filter(x => x === sheet ? checked : this.sheetIncluded(x));
    this.busy = true; this.error = ''; this.reviewed = false;
    try { this.draft = await this.api.selection(this.draft, sheets); } catch (error) { this.error = this.message(error); } finally { this.busy = false; }
  }
  protected async confirm(): Promise<void> {
    if (!this.draft || !this.reviewed || this.unresolved || !this.included || this.busy) return;
    this.busy = true; this.error = '';
    try { await this.api.confirm(this.draft); this.draft = await this.api.get(this.draft.id); }
    catch (error) { this.error = this.message(error); } finally { this.busy = false; }
  }
}
