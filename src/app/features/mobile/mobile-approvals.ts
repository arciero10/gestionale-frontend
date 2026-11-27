import { Component, inject, OnInit } from '@angular/core';
import { CurrentUserService } from '../../auth/current-user.service';
import { hasVerifiedGlobalAdmin } from '../../auth/platform-role';
import { OnboardingApiService } from '../../auth/onboarding-api.service';
import { ApprovazioniAppartenenza } from '../gestionaleCN/onboarding-comunita/approvazioni-appartenenza';

@Component({
  selector: 'app-mobile-approvals', standalone: true, imports: [ApprovazioniAppartenenza],
  template: `
    <h1>Appartenenze e deleghe</h1>
    @if (canReview) { <app-approvazioni-appartenenza /> }
    @else { <p>Non hai una delega per approvare le appartenenze.</p> }
    @if (responsible) {
      <section class="delegations"><h2>Deleghe al Corresponsabile</h2><p>Il ruolo resta Corresponsabile. Ogni azione registra la persona che la esegue.</p>
        @if (feedback) { <p role="status">{{ feedback }}</p> }
        @if (loading) { <p>Caricamento deleghe...</p> }
        @else if (!members.length) { <p>Nessun Corresponsabile attivo nella comunità.</p> }
        @for (member of members; track member.personId) {
          <article><h3>{{ member.name }}</h3>
            @for (permission of available; track permission) {
              <label><input type="checkbox" [checked]="member.permissions.includes(permission)" [disabled]="busy" (change)="toggle(member, permission, $any($event.target).checked)" />{{ labels[permission] || permission }}</label>
            }
            <button type="button" [disabled]="busy" (click)="save(member)"><i class="pi pi-save" aria-hidden="true"></i> Salva deleghe</button>
          </article>
        }
      </section>
    }
  `,
  styles: [`h1{font-size:24px;letter-spacing:0}h2{font-size:19px}h3{font-size:16px}.delegations{margin-top:28px;color:var(--color-text-primary)}.delegations p{color:var(--color-text-secondary);line-height:1.5}article{border-top:1px solid var(--color-border);padding:16px 0}label{display:flex;align-items:center;gap:12px;min-height:48px}input{width:20px;height:20px}button{min-height:48px;padding:12px 20px;border:0;border-radius:8px;background:var(--color-primary);color:white;font:inherit;font-weight:600}button:disabled{opacity:.6}`]
})
export class MobileApprovals implements OnInit {
  private readonly api = inject(OnboardingApiService);
  private readonly current = inject(CurrentUserService);
  protected get responsible(): boolean { return this.current.context()?.role === 'RESPONSIBLE'; }
  protected get canReview(): boolean { return hasVerifiedGlobalAdmin(this.current.context()) || this.current.context()?.permissions.some(p => ['APPROVE_REQUESTS', 'APPROVE_MEMBERS'].includes(p)) === true; }
  protected available: string[] = [];
  protected members: Array<{personId: number; name: string; permissions: string[]}> = [];
  protected loading = false;
  protected busy = false;
  protected feedback = '';
  protected readonly labels: Record<string, string> = { APPROVE_MEMBERS: 'Approvare Fratelli / Sorelle', EDIT_MEMBRI: 'Gestire membri e inviti', EDIT_COMUNITA: 'Aggiornare dati comunità', EDIT_CALENDAR: 'Gestire calendario', EDIT_AVVISI: 'Gestire avvisi', EDIT_GROUPS: 'Gestire gruppi', CREATE_CONVIVENZA: 'Creare convivenze', EDIT_CONVIVENZA: 'Gestire convivenze' };
  ngOnInit(): void { if (this.responsible) void this.load(); }
  private async load(): Promise<void> {
    this.loading = true;
    try { const response = await this.api.getDelegations(); this.available = response.availablePermissions; this.members = response.members; }
    catch { this.feedback = 'Impossibile caricare le deleghe. Riapri la pagina per riprovare.'; }
    finally { this.loading = false; }
  }
  protected toggle(member: { permissions: string[] }, permission: string, checked: boolean): void {
    member.permissions = checked ? [...new Set([...member.permissions, permission])] : member.permissions.filter(p => p !== permission);
  }
  protected async save(member: { personId: number; permissions: string[] }): Promise<void> {
    if (this.busy) return;
    this.busy = true;
    try { await this.api.saveDelegations(member.personId, member.permissions); this.feedback = 'Deleghe aggiornate. Il Corresponsabile deve aggiornare il proprio contesto per vederle.'; }
    catch { this.feedback = 'Deleghe non salvate. Aggiorna la pagina e riprova.'; }
    finally { this.busy = false; }
  }
}
