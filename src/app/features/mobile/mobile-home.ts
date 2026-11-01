import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CurrentUserService } from '../../auth/current-user.service';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-mobile-home', standalone: true, imports: [RouterLink],
  template: `
    @if (section === 'home') {
      <div class="greeting"><p>La vita della comunità</p><h1>{{ current.context()?.displayName ? 'Benvenuto, ' + current.context()?.displayName : 'Benvenuto' }}</h1><span>{{ current.context()?.parishName }}</span></div>
      <a class="community-card" routerLink="/mobile/comunita">
        <img src="assets/images/login-bg.jpg" alt="" />
        <div><span class="eyebrow">INSIEME, OGNI GIORNO</span><h2>La mia comunità</h2><p>{{ current.context()?.communityName }}@if (current.context()?.memberCount !== undefined) { · {{ current.context()?.memberCount }} membri }</p><i class="pi pi-arrow-right" aria-hidden="true"></i></div>
      </a>
      <h2 class="section-label">La tua app</h2>
      <div class="app-grid">
        @for (card of cards; track card.path) {
          <a class="app-tile" [routerLink]="'/mobile/' + card.path"><span class="tile-icon" [style.background]="card.background" [style.color]="card.color"><i [class]="'pi ' + card.icon" aria-hidden="true"></i></span><h2>{{ card.title }}</h2><i class="pi pi-arrow-up-right arrow" aria-hidden="true"></i></a>
        }
        @if (canOrganize()) { <a class="app-tile" routerLink="/mobile/posti-convivenza"><span class="tile-icon places"><i class="pi pi-building" aria-hidden="true"></i></span><h2>Posti di convivenza</h2><i class="pi pi-arrow-up-right arrow" aria-hidden="true"></i></a> }
      </div>
    } @else {
      <a class="back" routerLink="/mobile/home"><i class="pi pi-arrow-left" aria-hidden="true"></i> Home</a>
      <h1>{{ title }}</h1>
      @if (section === 'profilo') {
        <dl><dt>Nome</dt><dd>{{ current.context()?.displayName || 'Non disponibile' }}</dd><dt>Comunità</dt><dd>{{ current.context()?.communityName || 'Non associata' }}</dd><dt>Numero comunità</dt><dd>{{ current.context()?.communityNumber ?? 'Non disponibile' }}</dd><dt>Parrocchia</dt><dd>{{ current.context()?.parishName || 'Non disponibile' }}</dd><dt>Ruolo</dt><dd>{{ current.context()?.role || 'Non disponibile' }}</dd></dl>
        <button type="button" class="logout" (click)="auth.logout()"><i class="pi pi-sign-out" aria-hidden="true"></i> Esci dall'app</button>
      } @else if (section === 'altro') {
        <div class="links"><a routerLink="/mobile/profilo">Il mio profilo <i class="pi pi-user" aria-hidden="true"></i></a><a routerLink="/mobile/compleanni">Compleanni <i class="pi pi-gift" aria-hidden="true"></i></a><a routerLink="/mobile/gruppi">Gruppi <i class="pi pi-users" aria-hidden="true"></i></a><a routerLink="/mobile/avvisi">Avvisi <i class="pi pi-bell" aria-hidden="true"></i></a><a routerLink="/faq">Aiuto / FAQ <i class="pi pi-question-circle" aria-hidden="true"></i></a><a routerLink="/privacy">Privacy e consensi <i class="pi pi-shield" aria-hidden="true"></i></a></div>
      } @else {
        <section class="empty"><i [class]="'pi ' + emptyIcon" aria-hidden="true"></i><h2>{{ title }}</h2><p>{{ unavailableMessage }}</p>@if (section === 'calendario') { <a routerLink="/mobile/convivenze">Apri le convivenze <i class="pi pi-arrow-right" aria-hidden="true"></i></a> }</section>
      }
    }
  `,
  styles: [`
    :host{display:block;color:#0f172a}h1{font-size:25px;line-height:1.25;margin:8px 0;letter-spacing:0;overflow-wrap:anywhere}.greeting{margin:4px 4px 24px}.greeting>p{color:#1d4ed8;font-size:13px;font-weight:650;margin:0}.greeting>span{font-size:14px;color:#475569}
    .community-card{display:block;background:white;border:1px solid #dbe3ee;border-radius:8px;overflow:hidden;color:#0f172a;text-decoration:none}.community-card img{display:block;width:100%;height:134px;object-fit:cover;object-position:center 45%}.community-card>div{padding:18px;position:relative}.eyebrow{font-size:10px;font-weight:700;color:#166534}.community-card h2{font-size:20px;margin:8px 0}.community-card p{font-size:13px;color:#475569;margin:0;padding-right:24px}.community-card .pi{position:absolute;right:18px;bottom:20px;color:#1d4ed8}
    .section-label{font-size:16px;margin:24px 2px 12px}.app-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.app-tile{display:flex;flex-direction:column;align-items:flex-start;justify-content:center;min-height:140px;position:relative;padding:18px 14px;border:1px solid #e2e8f0;border-radius:8px;background:white;color:#0f172a;text-decoration:none}.tile-icon{width:42px;height:42px;border-radius:8px;display:grid;place-items:center;font-size:21px}.places{background:#f1f5f9;color:#334155}.app-tile h2{font-size:15px;line-height:1.4;margin:14px 0 0;overflow-wrap:anywhere;padding-right:12px}.arrow{position:absolute;top:18px;right:14px;color:#64748b;font-size:12px}
    .back{display:inline-flex;align-items:center;gap:10px;min-height:48px;color:#1d4ed8;text-decoration:none}.empty{padding:32px 20px;text-align:center;background:white;border:1px solid #e2e8f0;border-radius:8px;margin-top:24px}.empty>.pi{font-size:30px;color:#2563eb}.empty h2{font-size:18px}.empty p{color:#475569;line-height:1.6}.empty a{display:inline-flex;align-items:center;gap:8px;min-height:48px;color:#1d4ed8;font-weight:600}.links{margin-top:24px}.links a{display:flex;justify-content:space-between;align-items:center;min-height:56px;padding:12px;border-bottom:1px solid #e2e8f0;color:#0f172a;text-decoration:none;background:white}dl{background:white;padding:20px;border-radius:8px}dt{font-size:12px;color:#475569;margin-top:16px}dt:first-child{margin-top:0}dd{margin:6px 0 0;overflow-wrap:anywhere;font-weight:600}.logout{display:flex;align-items:center;justify-content:center;gap:12px;width:100%;min-height:48px;background:#fff1f2;color:#9f1239;border:1px solid #fecdd3;border-radius:8px;font:inherit;font-weight:600}a:focus-visible,button:focus-visible{outline:3px solid #0891b2;outline-offset:3px}
  `]
})
export class MobileHome {
  protected readonly current = inject(CurrentUserService);
  protected readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  protected readonly section: string = this.route.snapshot.data['section'];
  protected readonly title: string = this.route.snapshot.data['title'];
  protected readonly cards = [
    { title: 'Calendario', path: 'calendario', icon: 'pi-calendar', background: '#e8efff', color: '#1d4ed8' },
    { title: 'Compleanni', path: 'compleanni', icon: 'pi-gift', background: '#fce7f3', color: '#9d174d' },
    { title: 'Gruppi', path: 'gruppi', icon: 'pi-users', background: '#e0f2fe', color: '#075985' },
    { title: 'Avvisi', path: 'avvisi', icon: 'pi-bell', background: '#fff7ed', color: '#9a3412' },
    { title: 'Convivenze', path: 'convivenze', icon: 'pi-calendar-plus', background: '#dcfce7', color: '#166534' }
  ];
  protected canOrganize(): boolean { return this.current.context()?.permissions.includes('CREATE_CONVIVENZA') === true; }
  protected get emptyIcon(): string { return this.cards.find(card => card.path === this.section)?.icon ?? 'pi-info-circle'; }
  protected get unavailableMessage(): string {
    return ({ calendario: 'Le date degli incontri della comunità non sono ancora disponibili. Puoi consultare le convivenze.',
      compleanni: 'I compleanni saranno disponibili quando i dati personali e i consensi saranno collegati a questa sezione.',
      gruppi: 'I gruppi e i servizi della comunità non sono ancora disponibili in questa sezione.',
      avvisi: 'Le comunicazioni della comunità non sono ancora collegate a questa sezione.' } as Record<string, string>)[this.section] ?? '';
  }
}
