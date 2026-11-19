import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, timeout } from 'rxjs';
import { getApiConfiguration } from '../auth/api-config';

export interface DirectoryPerson { id: number; firstName: string; lastName: string; phone: string; email: string; role: string; active: boolean; canEditBirthDate: boolean }
export interface DirectoryEvidence {
  blockId: string; component: number; isCouple: boolean;
  fields: { field: string; value: string; confidence: string; origin: string }[];
  addresses: string[]; additionalContacts: { kind: string; value: string; origin: string }[];
}
export interface DirectoryRow {
  evidence?: DirectoryEvidence | null;
  id: number; sourceSheet: string; sourceLocator: string; sourceText: string; sourceSelected: boolean;
  firstName: string; lastName: string; phone: string; email: string; birthDate: string | null; birthDateRaw: string;
  role: string; roleRaw: string; stage: string; notes: string; spouseRaw: string; needsReview: boolean; reviewed: boolean;
  action: 'NEW' | 'EXISTING' | 'IGNORE' | 'REVIEW'; targetPersonId: number | null; updateExisting: boolean; updateRole: boolean;
  duplicateConfirmed: boolean; applySpouse: boolean; spousePersonId: number | null; spouseRowId: number | null; resultPersonId: number | null;
  state: string; classification: string; issues: string[];
  candidates: { id: number; firstName: string; lastName: string; active: boolean; reasons: string[] }[];
  batchDuplicates: number[]; spouseMatches: { personId: number | null; rowId: number | null; name: string }[];
}
export interface DirectoryDraft {
  id: number; status: string; sourceType: string; originalFileName?: string; updatedAt: string; sheets: string[];
  newPeopleCount: number; existingPeopleCount: number; ignoredCount: number;
  roles: string[]; people: DirectoryPerson[]; rows: DirectoryRow[];
}
export interface DirectorySummary { id: number; status: string; sourceType: string; originalFileName?: string; count: number }
export function directoryStateLabel(value: string): string {
  return ({ PRONTO: 'Pronto', DA_VERIFICARE: 'Da verificare', POSSIBILE_DUPLICATO: 'Possibile duplicato', ERRORE: 'Dati da correggere', IGNORATA: 'Ignorata' } as Record<string, string>)[value] ?? 'Da verificare';
}
@Injectable({ providedIn: 'root' })
export class DirectoryImportApiService {
  private readonly http = inject(HttpClient);
  private readonly url = getApiConfiguration().apiBaseUrl + '/me/community/directory-imports';
  list(): Promise<DirectorySummary[]> { return firstValueFrom(this.http.get<DirectorySummary[]>(this.url).pipe(timeout(20000))); }
  get(id: number): Promise<DirectoryDraft> { return firstValueFrom(this.http.get<DirectoryDraft>(`${this.url}/${id}`).pipe(timeout(20000))); }
  text(text: string): Promise<{ id: number; existing: boolean }> { return firstValueFrom(this.http.post<{ id: number; existing: boolean }>(this.url + '/text', { text }).pipe(timeout(60000))); }
  file(file: File): Promise<{ id: number; existing: boolean }> {
    const data = new FormData(); data.append('file', file);
    return firstValueFrom(this.http.post<{ id: number; existing: boolean }>(this.url + '/file', data).pipe(timeout(60000)));
  }
  selection(draft: DirectoryDraft, sheets: string[]): Promise<DirectoryDraft> {
    return firstValueFrom(this.http.put<DirectoryDraft>(`${this.url}/${draft.id}/selection`, { updatedAt: draft.updatedAt, sheets }).pipe(timeout(20000)));
  }
  couple(draft: DirectoryDraft, firstRowId: number, secondRowId: number): Promise<DirectoryDraft> {
    return firstValueFrom(this.http.put<DirectoryDraft>(`${this.url}/${draft.id}/couple`, { updatedAt: draft.updatedAt, firstRowId, secondRowId }).pipe(timeout(20000)));
  }
  row(draft: DirectoryDraft, row: DirectoryRow, ignoreBirthDate: boolean): Promise<DirectoryDraft> {
    return firstValueFrom(this.http.put<DirectoryDraft>(`${this.url}/${draft.id}/rows/${row.id}`, { ...row, reviewed: true, updatedAt: draft.updatedAt, ignoreBirthDate }).pipe(timeout(20000)));
  }
  confirm(draft: DirectoryDraft): Promise<unknown> {
    return firstValueFrom(this.http.post(`${this.url}/${draft.id}/confirm`, { updatedAt: draft.updatedAt, reviewed: true }).pipe(timeout(60000)));
  }
}
