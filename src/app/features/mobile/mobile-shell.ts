import { Component, ElementRef, HostListener, NgZone, inject, OnDestroy, OnInit } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { NavigationEnd, NavigationStart, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor, PluginListenerHandle } from '@capacitor/core';
import { Subscription } from 'rxjs';
import { MobileNavigationHistory, operationalMobileUrl } from './mobile-navigation-history';
import { CurrentUserService } from '../../auth/current-user.service';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-mobile-shell', standalone: true, imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="mobile-shell mobile-scene">
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
      <main class="mobile-content">@if (showBack) { <button class="shell-back" type="button" aria-label="Indietro" title="Indietro" (click)="back()"><i class="pi pi-arrow-left" aria-hidden="true"></i> Indietro</button> }<router-outlet /></main>
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
    :host::before{content:'';position:fixed;inset:0;z-index:-1;background:linear-gradient(rgba(245,246,250,.82),rgba(245,246,250,.89)),url('/images/backgrounds/mobile/Camino_Neocatecumenal_virgen_maria.webp') center 35%/cover no-repeat}
    .mobile-shell{max-width:760px;margin:auto;min-height:100dvh;background:transparent;padding-top:env(safe-area-inset-top)}
    .shell-back{display:inline-flex;align-items:center;gap:8px;min-height:44px;padding:8px 0;margin:0 0 10px;border:0;background:transparent;color:var(--color-primary);font:inherit;font-weight:600;cursor:pointer}
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
  private readonly element = inject(ElementRef<HTMLElement>);
  private readonly zone = inject(NgZone);
  private readonly history = new MobileNavigationHistory();
  private navigation?: Subscription;
  private backListener?: PluginListenerHandle;
  private destroyed = false;
  private navigatingBack = false;
  private restored = false;
  private touch: {x:number;y:number;at:number} | null = null;
  protected get showBack(): boolean { return this.current.context()?.linkedToCommunity === true && this.router.url.split(/[?#]/)[0] !== '/mobile/home'; }
  protected async back(): Promise<void> {
    if (!this.current.context()?.linkedToCommunity || this.navigatingBack) return;
    const menu = this.element.nativeElement.querySelector('details.admin-menu[open]');
    if (menu) { menu.removeAttribute('open'); return; }
    if (!this.showBack) return;
    this.navigatingBack = true;
    try { await this.router.navigateByUrl(this.history.back(this.router.url), {replaceUrl:true}); }
    finally { this.navigatingBack = false; }
  }
  @HostListener('touchstart', ['$event']) startGesture(event: TouchEvent): void {
    if (Capacitor.getPlatform() !== 'ios' || event.touches.length !== 1 || (event.target as Element)?.closest('input,textarea,select,[contenteditable],.people-strip')) return;
    const touch = event.touches[0];
    this.touch = touch.clientX <= 24 ? {x:touch.clientX,y:touch.clientY,at:Date.now()} : null;
  }
  @HostListener('touchend', ['$event']) endGesture(event: TouchEvent): void {
    const start = this.touch;this.touch = null;
    const end = event.changedTouches[0];
    if (start && end && Date.now()-start.at < 700 && end.clientX-start.x > 80 && Math.abs(end.clientY-start.y) < 60) void this.back();
  }
  protected readonly tabs = [
    { label: 'Home', icon: 'pi-home', path: '/mobile/home' },
    { label: 'Calendario', icon: 'pi-calendar', path: '/mobile/calendario' },
    { label: 'Comunità', icon: 'pi-users', path: '/mobile/community' },
    { label: 'Profilo', icon: 'pi-user', path: '/mobile/profilo' }
  ];
  ngOnInit(): void {
    this.history.visit(this.router.url);
    this.navigation = this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        this.restored = event.navigationTrigger === 'popstate';
        if (this.restored && this.current.context()?.linkedToCommunity && !operationalMobileUrl(event.url)) {
          void this.router.navigateByUrl('/mobile/home', {replaceUrl:true});
        }
      }
      if (event instanceof NavigationEnd) {
        if (this.current.context()?.linkedToCommunity) this.history.visit(event.urlAfterRedirects, this.restored);
        else this.history.reset();
      }
    });
    if (Capacitor.getPlatform() === 'android') void CapacitorApp.addListener('backButton', () => this.zone.run(()=>void this.back()))
      .then(listener => { if(this.destroyed)void listener.remove();else this.backListener=listener; }).catch(()=>undefined);
    this.viewport = this.document.querySelector('meta[name="viewport"]');
    this.originalViewport = this.viewport?.getAttribute('content') ?? null;
    if (this.viewport && !this.originalViewport?.includes('viewport-fit=')) this.viewport.setAttribute('content', `${this.originalViewport || 'width=device-width, initial-scale=1'}, viewport-fit=cover`);
  }
  ngOnDestroy(): void { this.destroyed=true;this.navigation?.unsubscribe();void this.backListener?.remove();this.history.reset();if (this.viewport && this.originalViewport !== null) this.viewport.setAttribute('content', this.originalViewport); }
}
