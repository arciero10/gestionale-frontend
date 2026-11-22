import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CurrentUserService } from '../../auth/current-user.service';

@Component({ selector: 'app-mobile-areas', standalone: true, imports: [RouterLink], template: `
  <a class="back" routerLink="/mobile/home"><i class="pi pi-arrow-left" aria-hidden="true"></i> Home</a>
  <h1>{{ life ? 'Vita della comunità' : 'Convivenze' }}</h1>
  <nav aria-label="Funzioni dell’area">
    @for (card of cards; track card.path) { <a class="area-link" [routerLink]="card.path"><i [class]="'pi '+card.icon" aria-hidden="true"></i><span><strong>{{card.title}}</strong><small>{{card.subtitle}}</small></span><i class="pi pi-angle-right" aria-hidden="true"></i></a> }
  </nav>
`, styles: [`
  :host{display:block;color:var(--color-text-primary)}h1{font-size:25px;margin:12px 0 24px;overflow-wrap:anywhere}.back{display:inline-flex;align-items:center;gap:8px;min-height:48px;color:var(--color-primary);text-decoration:none}nav{display:grid;gap:12px}.area-link{display:flex;align-items:center;gap:16px;min-height:104px;padding:20px 16px;background:white;border:1px solid var(--color-divider);border-radius:8px;color:inherit;text-decoration:none}.area-link>i:first-child{display:grid;place-items:center;width:44px;height:44px;flex-shrink:0;background:var(--color-tint);color:var(--color-primary);font-size:24px;border-radius:8px}.area-link>span{flex:1;min-width:0}.area-link strong,.area-link small{display:block;overflow-wrap:anywhere}.area-link strong{font-size:18px}.area-link small{font-size:14px;line-height:1.5;margin-top:6px;color:var(--color-text-secondary)}a:focus-visible{outline:3px solid var(--color-focus);outline-offset:3px}
`] })
export class MobileAreas {
  protected readonly life = inject(ActivatedRoute).snapshot.data['area'] === 'life';
  private readonly current = inject(CurrentUserService);
  protected get cards() {
    return this.life ? [
      {title:'Calendario',subtitle:'Appuntamenti e celebrazioni',icon:'pi-calendar',path:'/mobile/calendario'},
      {title:'Gruppi',subtitle:'Gruppi nelle case',icon:'pi-users',path:'/mobile/gruppi'},
      {title:'Compleanni',subtitle:'Prossime ricorrenze',icon:'pi-gift',path:'/mobile/birthdays'},
      {title:'Avvisi',subtitle:'Comunicazioni della comunità',icon:'pi-bell',path:'/mobile/avvisi'}
    ] : [
      {title:'Convivenze',subtitle:'Gestisci e consulta le convivenze',icon:'pi-calendar-plus',path:'/mobile/convivenze'},
      ...(this.current.context()?.permissions.includes('CREATE_CONVIVENZA') ? [{title:'Posti di convivenza',subtitle:'Posti, sistemazioni e organizzazione',icon:'pi-building',path:'/mobile/posti-convivenza'}] : [])
    ];
  }
}
