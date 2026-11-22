import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CurrentUserService } from '../../auth/current-user.service';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-mobile-shell', standalone: true, imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="mobile-shell" [class.home-scene]="router.url.split('?')[0] === '/mobile/home'">
      <header class="mobile-topbar">
        <a class="brand" routerLink="/mobile/home">Eventi di Comunità@if (current.context()?.parishName) { <span>{{ current.context()?.parishName }}</span> }<span>{{ current.context()?.communityName || 'La tua comunità' }}</span></a>
        @if (current.context()?.linkedToCommunity) {
          <a class="icon" routerLink="/mobile/avvisi" aria-label="Notifiche"><i class="pi pi-bell" aria-hidden="true"></i></a>
          <a class="avatar icon" routerLink="/mobile/profilo" aria-label="Apri profilo">{{ (current.context()?.displayName || 'P').charAt(0).toLocaleUpperCase('it') }}</a>
        } @else {
          <button class="icon" type="button" (click)="auth.logout()" aria-label="Esci"><i class="pi pi-sign-out" aria-hidden="true"></i></button>
        }
      </header>
      @if (current.context()?.isOnboardingAdmin && !current.context()?.linkedToCommunity) {
        <a class="admin-access" routerLink="/mobile/approvazioni"><i class="pi pi-check-square" aria-hidden="true"></i> Appartenenze e approvazioni</a>
      }
      <main class="mobile-content"><router-outlet /></main>
      @if (current.context()?.linkedToCommunity) {
        <nav class="mobile-bottom" aria-label="Navigazione app">
          @for (tab of tabs; track tab.path) {
            <a [routerLink]="tab.path" routerLinkActive="active" [class.calendar-active]="tab.label === 'Calendario' && router.url.startsWith('/mobile/calendar')" [routerLinkActiveOptions]="{ exact: tab.path !== '/mobile/community' }" ariaCurrentWhenActive="page"><i [class]="'pi ' + tab.icon" aria-hidden="true"></i><span>{{ tab.label }}</span></a>
          }
        </nav>
      }
    </div>
  `,
  styles: [`
    :host{display:block;min-height:100dvh;background:var(--color-background);color:var(--color-text-primary);isolation:isolate;position:relative}
    .mobile-shell{max-width:760px;margin:auto;min-height:100dvh;background:var(--color-background);padding-top:env(safe-area-inset-top)}
    .home-scene{background:linear-gradient(rgba(245,246,250,.78),rgba(245,246,250,.86)),url('/images/backgrounds/Camino_Neocatecumenal_virgen_maria.jpg') center 35%/cover no-repeat}
    .mobile-topbar{display:flex;align-items:center;gap:8px;padding:16px 20px;background:var(--color-primary);border-bottom:2px solid var(--color-gold)}.brand{flex:1;font-family:var(--font-display);font-size:17px;font-weight:700;color:var(--color-on-primary);text-decoration:none;min-width:0}.brand span{display:block;font-family:var(--font-ui);color:var(--color-on-primary);font-size:12px;font-weight:500;margin-top:4px;overflow-wrap:anywhere}
    .icon{display:grid;place-items:center;width:48px;height:48px;flex-shrink:0;color:var(--color-on-primary);border:0;background:transparent;border-radius:8px}.mobile-topbar .avatar{background:var(--color-primary-dark);color:var(--color-gold-light);border:1px solid var(--color-gold);border-radius:50%;font-weight:700}.mobile-content{padding:20px 16px calc(104px + env(safe-area-inset-bottom));min-width:0}
    .admin-access{display:flex;align-items:center;gap:10px;min-height:48px;padding:12px 20px;background:var(--color-tint);color:var(--color-primary);font-weight:600;text-decoration:none}
    .mobile-bottom{position:fixed;z-index:50;bottom:0;left:50%;transform:translateX(-50%);width:min(100%,760px);display:grid;grid-template-columns:repeat(4,minmax(0,1fr));padding:8px 8px max(8px,env(safe-area-inset-bottom));background:white;border-top:1px solid var(--color-divider);box-shadow:0 -4px 16px var(--color-shadow)}
    .mobile-bottom a{display:flex;position:relative;align-items:center;justify-content:center;flex-direction:column;gap:6px;min-height:56px;color:var(--color-text-secondary);text-decoration:none;border-radius:8px;font-size:12px;font-weight:600}.mobile-bottom i{font-size:20px}.mobile-bottom .active,.mobile-bottom .calendar-active{background:transparent;color:var(--color-primary)}.mobile-bottom .active::before,.mobile-bottom .calendar-active::before{content:'';position:absolute;top:0;width:24px;height:3px;border-radius:2px;background:var(--color-gold)}a:focus-visible,button:focus-visible{outline:3px solid var(--color-focus);outline-offset:2px}
    @media(max-width:360px){.mobile-topbar{padding:12px}.brand{font-size:15px}.icon{width:44px;height:44px}}
  `]
})
export class MobileShell implements OnInit, OnDestroy {
  protected readonly router = inject(Router);
  protected readonly current = inject(CurrentUserService);
  protected readonly auth = inject(AuthService);
  private readonly document = inject(DOCUMENT);
  private viewport: HTMLMetaElement | null = null;
  private originalViewport: string | null = null;
  protected readonly tabs = [
    { label: 'Home', icon: 'pi-home', path: '/mobile/home' },
    { label: 'Calendario', icon: 'pi-calendar', path: '/mobile/calendario' },
    { label: 'Comunità', icon: 'pi-users', path: '/mobile/community' },
    { label: 'Profilo', icon: 'pi-user', path: '/mobile/profilo' }
  ];
  ngOnInit(): void {
    this.viewport = this.document.querySelector('meta[name="viewport"]');
    this.originalViewport = this.viewport?.getAttribute('content') ?? null;
    if (this.viewport && !this.originalViewport?.includes('viewport-fit=')) this.viewport.setAttribute('content', `${this.originalViewport || 'width=device-width, initial-scale=1'}, viewport-fit=cover`);
  }
  ngOnDestroy(): void { if (this.viewport && this.originalViewport !== null) this.viewport.setAttribute('content', this.originalViewport); }
}
