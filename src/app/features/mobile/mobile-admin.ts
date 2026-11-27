import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CurrentUserService } from '../../auth/current-user.service';
import { hasVerifiedGlobalAdmin } from '../../auth/platform-role';

export const MOBILE_ADMIN_SECTIONS = [
  { path: 'users', title: 'Utenti e ruoli', icon: 'pi-users' },
  { path: 'communities', title: 'Parrocchie e comunità', icon: 'pi-building' },
  { path: 'invitations', title: 'Inviti', icon: 'pi-envelope' },
  { path: 'approvals', title: 'Richieste e approvazioni', icon: 'pi-check-square' },
  { path: 'responsibles', title: 'Responsabili e corresponsabili', icon: 'pi-user-edit' },
  { path: 'delegations', title: 'Deleghe', icon: 'pi-key' },
  { path: 'settings', title: 'Impostazioni', icon: 'pi-cog' },
  { path: 'audit', title: 'Registro attività', icon: 'pi-history' }
] as const;

@Component({selector: 'app-mobile-admin', standalone: true, imports: [RouterLink], template: `
  @if (authorized) {
    <h1>{{ section?.title || 'Amministrazione' }}</h1>
    @if (section) {
      <section class="status" role="status"><i class="pi pi-lock" aria-hidden="true"></i><h2>Sezione non ancora attiva</h2><p>Operazioni amministrative non disponibili in questa versione.</p></section>
      <a class="row" routerLink="/mobile/admin"><i class="pi pi-arrow-left" aria-hidden="true"></i> Amministrazione</a>
    } @else {
      <nav aria-label="Amministrazione">
        @for (item of sections; track item.path) {
          <a class="row" [routerLink]="['/mobile/admin', item.path]"><i [class]="'pi '+item.icon" aria-hidden="true"></i><span>{{item.title}}</span><i class="pi pi-angle-right" aria-hidden="true"></i></a>
        }
      </nav>
    }
    <a class="row" routerLink="/mobile/account-security"><i class="pi pi-shield" aria-hidden="true"></i> Account e sicurezza</a>
  } @else { <p role="alert">Accesso amministrativo non autorizzato.</p> }
`, styles: [`
  :host{display:block;min-width:0}h1{font-size:25px;overflow-wrap:anywhere;margin:8px 0 24px}nav{display:grid;border-top:1px solid var(--color-divider)}.row{display:flex;align-items:center;gap:14px;min-height:64px;padding:14px 12px;color:var(--color-text-primary);text-decoration:none;border-bottom:1px solid var(--color-divider);box-sizing:border-box;background:white}.row span{flex:1;min-width:0;overflow-wrap:anywhere}.row>.pi:first-child{color:var(--color-primary);font-size:21px;flex-shrink:0}.status{padding:24px 0;line-height:1.6}.status h2{font-size:19px}.status>.pi{font-size:28px;color:var(--color-text-secondary)}a:focus-visible{outline:3px solid var(--color-focus);outline-offset:2px}
`]})
export class MobileAdmin {
  private readonly current = inject(CurrentUserService);
  private readonly route = inject(ActivatedRoute);
  protected readonly sections = MOBILE_ADMIN_SECTIONS;
  protected get authorized(): boolean { return this.current.state() === 'ready' && hasVerifiedGlobalAdmin(this.current.context()); }
  protected get section() { return this.sections.find(item => item.path === this.route.snapshot.paramMap.get('section')); }
}
