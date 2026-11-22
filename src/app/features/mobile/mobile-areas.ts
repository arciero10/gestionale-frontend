import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CurrentUserService } from '../../auth/current-user.service';

@Component({ selector: 'app-mobile-areas', standalone: true, imports: [RouterLink], template: `

  <h1>{{ life ? 'La mia comunità' : 'Convivenze' }}</h1>
  <nav aria-label="Funzioni dell’area">
    @for (card of cards; track card.path) { <a class="area-link" [routerLink]="card.path">@if(card.image) { <img class="area-photo" [src]="'images/backgrounds/mobile/'+card.image+'.webp'" alt="" loading="lazy" /> } @else { <i [class]="'pi '+card.icon" aria-hidden="true"></i> }<span><strong>{{card.title}}</strong><small>{{card.subtitle}}</small></span><i class="pi pi-angle-right" aria-hidden="true"></i></a> }
  </nav>
`, styles: [`
  .area-link .area-photo{display:block;width:64px;height:72px;flex-shrink:0;object-fit:cover;border-radius:6px}.area-link>i:first-child{width:64px;height:72px}
  :host{display:block;color:var(--color-text-primary)}h1{font-size:25px;margin:12px 0 24px;overflow-wrap:anywhere}.back{display:inline-flex;align-items:center;gap:8px;min-height:48px;color:var(--color-primary);text-decoration:none}nav{display:grid;gap:12px}.area-link{display:flex;align-items:center;gap:16px;min-height:104px;padding:20px 16px;background:white;border:1px solid var(--color-divider);border-radius:8px;color:inherit;text-decoration:none}.area-link>i:first-child{display:grid;place-items:center;width:44px;height:44px;flex-shrink:0;background:var(--color-tint);color:var(--color-primary);font-size:24px;border-radius:8px}.area-link>span{flex:1;min-width:0}.area-link strong,.area-link small{display:block;overflow-wrap:anywhere}.area-link strong{font-size:18px}.area-link small{font-size:14px;line-height:1.5;margin-top:6px;color:var(--color-text-secondary)}a:focus-visible{outline:3px solid var(--color-focus);outline-offset:3px}
`] })
export class MobileAreas {
  protected readonly life = inject(ActivatedRoute).snapshot.data['area'] === 'life';
  private readonly current = inject(CurrentUserService);
  protected get cards() {
    return this.life ? [
      {title:'Fratelli',subtitle:'Persone e vita della comunità',icon:'pi-users',image:'censimento-comunita-bg',path:'/mobile/community'},
      {title:'Calendario',subtitle:'Appuntamenti e celebrazioni',icon:'pi-calendar',image:'camino-neocatecumenal-jubileo-jovenes-roma-agosto-2025-02-1024x478-1',path:'/mobile/calendario'},
      {title:'Gruppi',subtitle:'Gruppi nelle case',icon:'pi-users',image:'',path:'/mobile/gruppi'},
      {title:'Compleanni',subtitle:'Prossime ricorrenze',icon:'pi-gift',image:'',path:'/mobile/birthdays'},
      {title:'Avvisi',subtitle:'Comunicazioni della comunità',icon:'pi-bell',image:'',path:'/mobile/avvisi'}
    ] : [
      {title:'Gestione convivenze',subtitle:'Gestisci e consulta le convivenze',icon:'pi-calendar-plus',image:'convivenze-bg',path:'/mobile/convivenze'},
      ...(this.current.context()?.permissions.includes('CREATE_CONVIVENZA') ? [{title:'Posti di convivenza',subtitle:'Posti, sistemazioni e organizzazione',icon:'pi-building',image:'posti-convivenza-bg',path:'/mobile/posti-convivenza'}] : [])
    ];
  }
}
