import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CurrentUserService } from '../../auth/current-user.service';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-mobile-shell', standalone: true, imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="mobile-shell">
      <header class="mobile-topbar">
        <a class="brand" routerLink="/mobile/home">Eventi di Comunità<span>{{ current.context()?.communityName || 'La tua comunità' }}</span></a>
        @if (current.context()?.linkedToCommunity) {
          <a class="icon" routerLink="/mobile/avvisi" aria-label="Notifiche"><i class="pi pi-bell" aria-hidden="true"></i></a>
          <a class="avatar icon" routerLink="/mobile/profilo" aria-label="Profilo"><i class="pi pi-user" aria-hidden="true"></i></a>
        } @else {
          <button class="icon" type="button" (click)="auth.logout()" aria-label="Esci"><i class="pi pi-sign-out" aria-hidden="true"></i></button>
        }
      </header>
      <main class="mobile-content"><router-outlet /></main>
      @if (current.context()?.linkedToCommunity) {
        <nav class="mobile-bottom" aria-label="Navigazione app">
          @for (tab of tabs; track tab.path) {
            <a [routerLink]="tab.path" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }" ariaCurrentWhenActive="page"><i [class]="'pi ' + tab.icon" aria-hidden="true"></i><span>{{ tab.label }}</span></a>
          }
        </nav>
      }
    </div>
  `,
  styles: [`
    :host{display:block;min-height:100dvh;background:#f3f6fb;color:#0f172a;isolation:isolate;position:relative}
    .mobile-shell{max-width:760px;margin:auto;min-height:100dvh;background:#f3f6fb;padding-top:env(safe-area-inset-top)}
    .mobile-topbar{display:flex;align-items:center;gap:8px;padding:16px 20px;background:white;border-bottom:1px solid #e2e8f0}.brand{flex:1;font-size:17px;font-weight:700;color:#163c72;text-decoration:none;min-width:0}.brand span{display:block;color:#475569;font-size:12px;font-weight:500;margin-top:4px;overflow-wrap:anywhere}
    .icon{display:grid;place-items:center;width:48px;height:48px;flex-shrink:0;color:#1d4ed8;border:0;background:transparent;border-radius:8px}.avatar{background:#e8efff}.mobile-content{padding:20px 16px calc(104px + env(safe-area-inset-bottom));min-width:0}
    .mobile-bottom{position:fixed;z-index:50;bottom:0;left:50%;transform:translateX(-50%);width:min(100%,760px);display:grid;grid-template-columns:repeat(4,minmax(0,1fr));padding:8px 8px max(8px,env(safe-area-inset-bottom));background:white;border-top:1px solid #dbe3ee;box-shadow:0 -4px 16px #0f172a08}
    .mobile-bottom a{display:flex;align-items:center;justify-content:center;flex-direction:column;gap:6px;min-height:56px;color:#475569;text-decoration:none;border-radius:8px;font-size:12px;font-weight:600}.mobile-bottom i{font-size:20px}.mobile-bottom .active{background:#e8efff;color:#1d4ed8}a:focus-visible,button:focus-visible{outline:3px solid #0891b2;outline-offset:2px}
    @media(max-width:360px){.mobile-topbar{padding:12px}.brand{font-size:15px}.icon{width:44px;height:44px}}
  `]
})
export class MobileShell implements OnInit, OnDestroy {
  protected readonly current = inject(CurrentUserService);
  protected readonly auth = inject(AuthService);
  private readonly document = inject(DOCUMENT);
  private viewport: HTMLMetaElement | null = null;
  private originalViewport: string | null = null;
  protected readonly tabs = [
    { label: 'Home', icon: 'pi-home', path: '/mobile/home' },
    { label: 'Calendario', icon: 'pi-calendar', path: '/mobile/calendario' },
    { label: 'Comunità', icon: 'pi-users', path: '/mobile/comunita' },
    { label: 'Altro', icon: 'pi-ellipsis-h', path: '/mobile/altro' }
  ];
  ngOnInit(): void {
    this.viewport = this.document.querySelector('meta[name="viewport"]');
    this.originalViewport = this.viewport?.getAttribute('content') ?? null;
    if (this.viewport && !this.originalViewport?.includes('viewport-fit=')) this.viewport.setAttribute('content', `${this.originalViewport || 'width=device-width, initial-scale=1'}, viewport-fit=cover`);
  }
  ngOnDestroy(): void { if (this.viewport && this.originalViewport !== null) this.viewport.setAttribute('content', this.originalViewport); }
}
