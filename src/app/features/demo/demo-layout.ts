import { CommonModule } from '@angular/common';
import { Component, computed, ElementRef, HostListener, inject, OnDestroy, signal, ViewChild } from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { RippleModule } from 'primeng/ripple';
import { AppMenuitem } from '@/layout/components/app.menuitem';
import { LayoutService } from '@/layout/service/layout.service';
import { DEMO_COMUNITA } from './demo.mock';

@Component({
    selector: '[demo-menu]',
    standalone: true,
    imports: [CommonModule, RouterModule, AppMenuitem],
    template: `<ul class="layout-menu" #menuContainer>
        <ng-container *ngFor="let item of model; let i = index">
            <li app-menuitem *ngIf="!item.separator" [item]="item" [index]="i" [root]="true"></li>
            <li *ngIf="item.separator" class="menu-separator"></li>
        </ng-container>
    </ul>`
})
export class DemoMenu {
    el = inject(ElementRef);

    @ViewChild('menuContainer') menuContainer!: ElementRef;

    model: any[] = [
        {
            label: 'Demo gestionale',
            icon: 'pi pi-fw pi-briefcase',
            items: [
                { label: 'Dashboard', icon: 'pi pi-fw pi-home', routerLink: ['/demo/dashboard'] },
                { label: 'La tua Comunità', icon: 'pi pi-fw pi-users', routerLink: ['/demo/comunita'] },
                { label: 'Convivenze', icon: 'pi pi-fw pi-calendar', routerLink: ['/demo/convivenze'] },
                { label: 'Posti di Convivenza', icon: 'pi pi-fw pi-building', routerLink: ['/demo/posti-convivenza'] },
                { label: 'Viaggi / Pellegrinaggi', icon: 'pi pi-fw pi-send', routerLink: ['/demo/viaggi'] },
                { label: 'Aiuto / FAQ', icon: 'pi pi-fw pi-question-circle', routerLink: ['/faq'] }
            ]
        },
        {
            label: 'Azioni rapide',
            icon: 'pi pi-fw pi-plus-circle',
            items: [
                { label: 'Aggiungi membro', icon: 'pi pi-fw pi-user-plus', routerLink: ['/demo/comunita'] },
                { label: 'Nuova convivenza', icon: 'pi pi-fw pi-calendar-plus', routerLink: ['/demo/convivenze'] },
                { label: 'Nuovo posto', icon: 'pi pi-fw pi-plus', routerLink: ['/demo/posti-convivenza'] }
            ]
        },
        {
            label: 'Accesso',
            icon: 'pi pi-fw pi-user',
            items: [{ label: "Accedi all'app", icon: 'pi pi-fw pi-sign-in', routerLink: ['/'] }]
        }
    ];
}

@Component({
    selector: '[demo-sidebar]',
    standalone: true,
    imports: [CommonModule, RouterModule, DemoMenu],
    template: `<div class="layout-sidebar" (mouseenter)="onMouseEnter()" (mouseleave)="onMouseLeave()">
        <div class="layout-sidebar-top">
            <a routerLink="/demo/dashboard" class="flex items-center gap-3 no-underline text-white">
                <span class="w-10 h-10 rounded-md bg-white/10 border border-white/20 flex items-center justify-center font-bold">CN</span>
                <span class="layout-sidebar-logo brand-neocat text-lg tracking-normal">Gestionale CN</span>
                <span class="layout-sidebar-logo-slim w-10 h-10 rounded-md bg-white/10 border border-white/20 flex items-center justify-center font-bold">CN</span>
            </a>
            <button class="layout-sidebar-anchor" type="button" (click)="anchor()"></button>
        </div>
        <div class="px-6 pb-4 text-sm text-surface-500 dark:text-surface-300 layout-sidebar-logo">
            <div class="mb-2 inline-flex rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-bold text-orange-800">Modalità demo</div>
            <div class="font-semibold text-surface-700 dark:text-surface-100">{{ comunita.nome }}</div>
            <div>{{ comunita.parrocchia }}</div>
        </div>
        <div class="layout-menu-container">
            <div demo-menu></div>
        </div>
    </div>`
})
export class DemoSidebar {
    timeout: any = null;
    comunita = DEMO_COMUNITA;

    @ViewChild(DemoMenu) appMenu!: DemoMenu;

    constructor(
        public layoutService: LayoutService,
        public el: ElementRef
    ) {}

    onMouseEnter() {
        if (!this.layoutService.layoutState().anchored) {
            if (this.timeout) {
                clearTimeout(this.timeout);
                this.timeout = null;
            }

            this.layoutService.layoutState.update((state) => (!state.sidebarActive ? { ...state, sidebarActive: true } : state));
        }
    }

    onMouseLeave() {
        if (!this.layoutService.layoutState().anchored && !this.timeout) {
            this.timeout = setTimeout(() => {
                this.layoutService.layoutState.update((state) => (state.sidebarActive ? { ...state, sidebarActive: false } : state));
            }, 300);
        }
    }

    anchor() {
        this.layoutService.layoutState.update((state) => ({
            ...state,
            anchored: !state.anchored
        }));
    }
}

@Component({
    selector: '[demo-topbar]',
    standalone: true,
    imports: [CommonModule, RouterModule, RippleModule],
    template: `<div
        class="layout-topbar"
        [ngClass]="{
            'border-bottom-none': layoutService.layoutConfig().topbarTheme !== 'light'
        }"
    >
        <div class="layout-topbar-start">
            <a class="layout-topbar-logo" routerLink="/demo/dashboard">
                <h1 class="brand-neocat text-xl md:text-2xl font-normal dark:text-white leading-tight">GESTIONALE CN</h1>
            </a>
            <a #menuButton class="layout-menu-button" (click)="onMenuButtonClick()" pRipple>
                <i class="pi pi-angle-right"></i>
            </a>
        </div>

        <div class="layout-topbar-end">
            <a routerLink="/" class="demo-access-link">Accedi all'app</a>
        </div>
    </div>`,
    styles: [
        `
            .demo-access-link {
                display: inline-flex;
                min-height: 40px;
                align-items: center;
                justify-content: center;
                padding: 0.45rem 0.9rem;
                border-radius: 999px;
                background: rgba(255, 255, 255, 0.14);
                border: 1px solid rgba(255, 255, 255, 0.28);
                color: #fff;
                text-decoration: none;
                font-weight: 700;
            }
        `
    ]
})
export class DemoTopbar {
    @ViewChild('menuButton') menuButton!: ElementRef;
    layoutService = inject(LayoutService);

    onMenuButtonClick() {
        this.layoutService.onMenuToggle();
    }
}

@Component({
    selector: 'app-demo-layout',
    standalone: true,
    imports: [CommonModule, RouterModule, DemoTopbar, DemoSidebar],
    template: `<div class="layout-container" [ngClass]="containerClass()">
        <div demo-topbar></div>
        <div demo-sidebar></div>

        <div class="layout-content-wrapper" [ngClass]="{ 'layout-dashboard-full': isDashboardRoute() }">
            <div class="demo-ribbon">
                <strong>Modalità demo</strong>
                <span>I dati mostrati sono dimostrativi.</span>
            </div>
            <div class="layout-content">
                <router-outlet></router-outlet>
            </div>
            <footer class="internal-footer">
                <span>All rights reserved. Progettato da PANTELEIA - Associazione Promozione Sociale. CF: 96647400587</span>
                <span>Iscrizione RUNTS: Rep. n. 165890 - Det. n. G03684 del 19/03/2026</span>
            </footer>
        </div>
    </div>`,
    styles: [
        `
            .demo-ribbon {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 0.75rem;
                padding: 0.55rem 1rem;
                background: #fff7ed;
                border-bottom: 1px solid #fed7aa;
                color: #7c2d12;
                font-size: 0.85rem;
                text-align: center;
            }

            .demo-ribbon strong {
                text-transform: uppercase;
                letter-spacing: 0.03em;
            }

            .internal-footer {
                display: flex;
                flex-wrap: wrap;
                justify-content: center;
                gap: 0.35rem 1rem;
                padding: 0.75rem 1rem 1rem;
                color: #6b7280;
                font-size: 0.75rem;
                line-height: 1.45;
                text-align: center;
            }

            @media (max-width: 767px) {
                .demo-ribbon {
                    flex-direction: column;
                    gap: 0.1rem;
                    line-height: 1.35;
                }
            }
        `
    ]
})
export class DemoLayout implements OnDestroy {
    isDashboardRoute = signal(false);

    private readonly router = inject(Router);
    readonly layoutService = inject(LayoutService);

    private readonly routerSubscription: Subscription;

    @ViewChild(DemoSidebar) appSidebar!: DemoSidebar;
    @ViewChild(DemoTopbar) appTopbar!: DemoTopbar;

    constructor() {
        this.updateDashboardRoute(this.router.url);
        this.routerSubscription = this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe((event) => {
            this.updateDashboardRoute(event.urlAfterRedirects);
            this.hideMenu();
        });
    }

    private updateDashboardRoute(url: string) {
        const normalizedUrl = url.split('?')[0].split('#')[0];
        this.isDashboardRoute.set(normalizedUrl === '/demo' || normalizedUrl === '/demo/dashboard');
    }

    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent) {
        if (!this.appSidebar || !this.appTopbar || !this.layoutService.layoutState().staticMenuMobileActive) {
            return;
        }

        const target = event.target as Node;
        const isInside = this.appSidebar.el.nativeElement.contains(target) || this.appTopbar.menuButton.nativeElement.contains(target);
        if (!isInside) {
            this.hideMenu();
        }
    }

    @HostListener('document:keydown.escape')
    onEscape() {
        this.hideMenu();
    }

    hideMenu() {
        this.layoutService.layoutState.update((prev) => ({ ...prev, overlayMenuActive: false, staticMenuMobileActive: false, menuHoverActive: false }));
        this.layoutService.reset();
        document.body.classList.remove('blocked-scroll');
    }

    containerClass = computed(() => {
        const layoutConfig = this.layoutService.layoutConfig();
        const layoutState = this.layoutService.layoutState();

        return {
            'layout-container': true,
            ['layout-topbar-' + layoutConfig.topbarTheme]: true,
            ['layout-menu-' + layoutConfig.menuTheme]: true,
            ['layout-menu-profile-' + layoutConfig.menuProfilePosition]: true,
            'layout-overlay': layoutConfig.menuMode === 'overlay',
            'layout-static': layoutConfig.menuMode === 'static',
            'layout-slim': layoutConfig.menuMode === 'slim',
            'layout-slim-plus': layoutConfig.menuMode === 'slim-plus',
            'layout-horizontal': layoutConfig.menuMode === 'horizontal',
            'layout-reveal': layoutConfig.menuMode === 'reveal',
            'layout-drawer': layoutConfig.menuMode === 'drawer',
            'layout-sidebar-dark': layoutConfig.colorScheme === 'dark',
            'layout-static-inactive': layoutState.staticMenuDesktopInactive && layoutConfig.menuMode === 'static',
            'layout-overlay-active': layoutState.overlayMenuActive,
            'layout-mobile-active': layoutState.staticMenuMobileActive,
            'layout-menu-profile-active': layoutState.rightMenuActive,
            'layout-sidebar-active': layoutState.sidebarActive,
            'layout-sidebar-anchored': layoutState.anchored,
            'layout-demo': true
        };
    });

    ngOnDestroy() {
        this.routerSubscription.unsubscribe();
    }
}
