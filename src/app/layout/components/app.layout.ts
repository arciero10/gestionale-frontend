import { Component, computed, HostListener, OnDestroy, Renderer2, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { AppSidebar } from './app.sidebar';
import { LayoutService } from '@/layout/service/layout.service';

@Component({
    selector: 'app-layout',
    standalone: true,
    imports: [CommonModule, AppSidebar, RouterModule],
    template: `
        @if (isOnboardingRoute()) {
            <div class="onboarding-layout" [style.--page-background-image]="pageBackgroundStyle()">
                <div class="onboarding-layout-content">
                    <router-outlet></router-outlet>
                </div>
            </div>
        } @else {
            <div class="layout-container layout-immersive" [ngClass]="containerClass()" [style.--page-background-image]="pageBackgroundStyle()">
                <div app-sidebar></div>

                <div
                    class="layout-content-wrapper"
                    [class.layout-dashboard-full]="isDashboardRoute()"
                    [class.layout-page-background]="!isDashboardRoute()"
                >
                    <div class="layout-content">
                        <router-outlet></router-outlet>
                    </div>
                    <footer class="internal-footer">
                        <span>© All rights reserved. Progettato da PANTELEIA - Associazione Promozione Sociale. CF: 96647400587</span>
                        <span>Iscrizione RUNTS: Rep. n. 165890 – Det. n. G03684 del 19/03/2026</span>
                    </footer>
                </div>
            </div>
        }
    `,
    styles: [
        `
            .onboarding-layout {
                position: relative;
                min-height: 100vh;
                isolation: isolate;
                overflow: auto;
                background-image:
                    linear-gradient(180deg, rgba(255, 255, 255, .16), rgba(255, 255, 255, .24)),
                    var(--page-background-image);
                background-size: cover;
                background-position: center;
                background-repeat: no-repeat;
            }

            .onboarding-layout-content {
                min-height: 100vh;
                display: grid;
                place-items: center;
                padding: clamp(1rem, 3vw, 2rem);
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
                background: rgba(0, 0, 0, 0.45);
                backdrop-filter: blur(4px);
                -webkit-backdrop-filter: blur(4px);
                border-radius: 999px;
                margin: 0 auto;
                max-width: fit-content;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            }

            .layout-content-wrapper.layout-page-background {
                background: linear-gradient(180deg, rgba(255, 255, 255, 0.18), rgba(255, 255, 255, 0.28));
            }

            .layout-content-wrapper.layout-page-background nav,
            .layout-content-wrapper.layout-page-background .layout-content,
            .layout-content-wrapper.layout-page-background .internal-footer {
                position: relative;
                z-index: 1;
            }
        `
    ]
})
export class AppLayout implements OnDestroy {
    isDashboardRoute = signal(false);
    isOnboardingRoute = signal(false);
    currentContentBackground = signal('/images/backgrounds/camino-neocatecumenal-jubileo-jovenes-roma-agosto-2025-02-1024x478-1.jpg');
    pageBackgroundStyle = computed(() => `url("${this.currentContentBackground()}")`);

    private readonly fallbackContentBackground = '/images/backgrounds/comunita-bg.jpg';
    private readonly contentBackgrounds = [
        { path: '/gestionale-cn/dashboard', image: '/images/backgrounds/camino-neocatecumenal-jubileo-jovenes-roma-agosto-2025-02-1024x478-1.jpg' },
        { path: '/gestionale-cn/comunita', image: '/assets/images/dashboard-bg.jpg' },
        { path: '/gestionale-cn/convivenze', image: '/images/backgrounds/convivenze-bg.jpg' },
        { path: '/gestionale-cn/posti-convivenza', image: '/images/backgrounds/posti-convivenza-bg.jpg' },
        { path: '/gestionale-cn/richieste-strutture', image: '/images/backgrounds/richieste-strutture-bg.jpg' },
        { path: '/gestionale-cn/censimento-comunita', image: '/images/backgrounds/censimento-comunita-bg.jpg' },
        { path: '/gestionale-cn/onboarding-comunita-preview', image: '/images/backgrounds/onboarding-comunita-bg.jpg' },
        { path: '/gestionale-cn/onboarding-comunita', image: '/images/backgrounds/onboarding-comunita-bg.jpg' },
        { path: '/gestionale-cn/faq', image: '/images/backgrounds/Camino_Neocatecumenal_virgen_maria.jpg' },
        { path: '/gestionale-cn/privacy', image: '/images/backgrounds/Camino_Neocatecumenal_virgen_maria.jpg' },
        { path: '/gestionale-cn/viaggi', image: '/images/backgrounds/convivenze-bg.jpg' }
    ];

    overlayMenuOpenSubscription: Subscription;

    menuOutsideClickListener: any;

    menuScrollListener: any;

    @ViewChild(AppSidebar) appSidebar!: AppSidebar;

    constructor(
        public layoutService: LayoutService,
        public renderer: Renderer2,
        public router: Router
    ) {
        this.updateRouteState(this.router.url);

        this.overlayMenuOpenSubscription = this.layoutService.overlayOpen$.subscribe(() => {
            if (this.isOnboardingRoute()) {
                this.hideMenu();
                return;
            }

            if (!this.appSidebar?.appMenu?.el?.nativeElement || !this.appSidebar?.el?.nativeElement) {
                return;
            }

            if (!this.menuOutsideClickListener) {
                this.menuOutsideClickListener = this.renderer.listen('document', 'click', (event) => {
                    if (!this.appSidebar?.appMenu?.el?.nativeElement || !this.appSidebar?.el?.nativeElement) {
                        return;
                    }

                    const isOutsideClicked = !(
                        this.appSidebar.appMenu.el.nativeElement.isSameNode(event.target) ||
                        this.appSidebar.appMenu.el.nativeElement.contains(event.target) ||
                        this.appSidebar.el.nativeElement.isSameNode(event.target) ||
                        this.appSidebar.el.nativeElement.contains(event.target)
                    );

                    if (isOutsideClicked) {
                        this.hideMenu();
                    }
                });
            }

            if ((this.layoutService.isSlim() || this.layoutService.isSlimPlus()) && !this.menuScrollListener && this.appSidebar?.appMenu?.menuContainer?.nativeElement) {
                this.menuScrollListener = this.renderer.listen(this.appSidebar.appMenu.menuContainer.nativeElement, 'scroll', () => {
                    if (this.layoutService.isDesktop()) {
                        this.hideMenu();
                    }
                });
            }

            if (this.layoutService.layoutState().staticMenuMobileActive) {
                this.blockBodyScroll();
            }
        });

        this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe((event) => {
            this.updateRouteState(event.urlAfterRedirects);
            this.hideMenu();
        });
    }

    private updateRouteState(url: string) {
        const normalizedUrl = url.split('?')[0].split('#')[0];

        this.isDashboardRoute.set(normalizedUrl === '/gestionale-cn' || normalizedUrl === '/gestionale-cn/dashboard');

        this.isOnboardingRoute.set(
            normalizedUrl === '/gestionale-cn/onboarding-comunita' ||
            normalizedUrl === '/gestionale-cn/onboarding-comunita-preview'
        );

        this.currentContentBackground.set(this.resolveContentBackground(normalizedUrl));
    }

    private resolveContentBackground(url: string) {
        if (url === '/gestionale-cn' || url === '/gestionale-cn/dashboard') {
            return '/images/backgrounds/camino-neocatecumenal-jubileo-jovenes-roma-agosto-2025-02-1024x478-1.jpg';
        }

        return this.contentBackgrounds.find((item) => url === item.path || url.startsWith(`${item.path}/`))?.image ?? this.fallbackContentBackground;
    }

    @HostListener('document:keydown.escape')
    onEscape() {
        this.hideMenu();
    }

    hideMenu() {
        this.layoutService.layoutState.update((prev) => ({ ...prev, overlayMenuActive: false, staticMenuMobileActive: false, menuHoverActive: false }));
        this.layoutService.reset();
        if (this.menuOutsideClickListener) {
            this.menuOutsideClickListener();
            this.menuOutsideClickListener = null;
        }

        this.unblockBodyScroll();
    }

    blockBodyScroll(): void {
        if (document.body.classList) {
            document.body.classList.add('blocked-scroll');
        } else {
            document.body.className += ' blocked-scroll';
        }
    }

    unblockBodyScroll(): void {
        if (document.body.classList) {
            document.body.classList.remove('blocked-scroll');
        } else {
            document.body.className = document.body.className.replace(new RegExp('(^|\\b)' + 'blocked-scroll'.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
        }
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
            'layout-sidebar-anchored': layoutState.anchored
        };
    });

    ngOnDestroy() {
        if (this.overlayMenuOpenSubscription) {
            this.overlayMenuOpenSubscription.unsubscribe();
        }

        if (this.menuOutsideClickListener) {
            this.menuOutsideClickListener();
        }

        if (this.menuScrollListener) {
            this.menuScrollListener();
        }
    }
}