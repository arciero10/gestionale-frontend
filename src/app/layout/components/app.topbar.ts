import { Component, computed, ElementRef, inject, ViewChild } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { StyleClassModule } from 'primeng/styleclass';
import { LayoutService } from '@/layout/service/layout.service';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { RippleModule } from 'primeng/ripple';
import { SelectButtonModule } from 'primeng/selectbutton';
import { FormsModule } from '@angular/forms';
import { ToggleSwitchModule } from 'primeng/toggleswitch';

@Component({
    selector: '[app-topbar]',
    standalone: true,
    imports: [RouterModule, CommonModule, FormsModule, ButtonModule, SelectButtonModule, ToggleSwitchModule, StyleClassModule, InputTextModule, ButtonModule, IconFieldModule, InputIconModule, RippleModule],
    template: `<div
        class="layout-topbar"
        [ngClass]="{
            'border-bottom-none': layoutService.layoutConfig().topbarTheme !== 'light'
        }"
    >
        <div class="layout-topbar-start">
            <a class="layout-topbar-logo" [routerLink]="homeLink">
                <h1 class="brand-neocat text-xl md:text-2xl font-normal dark:text-white leading-tight">GESTIONALE CN</h1>
            </a>
            <a #menuButton class="layout-menu-button" (click)="onMenuButtonClick()" pRipple>
                <i class="pi pi-angle-right"></i>
            </a>
        </div>

        <div class="layout-topbar-end">
            @if (isDemoRoute) {
                <a routerLink="/" class="demo-access-link">Accedi all'app</a>
            }
        </div>
    </div>`
    ,
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
export class AppTopbar {
    @ViewChild('menuButton') menuButton!: ElementRef;

    @ViewChild('mobileMenuButton') mobileMenuButton!: ElementRef;

    constructor(
        public el: ElementRef,
        private router: Router
    ) {}

    activeItem!: number;
    themeOptions = [
        { name: 'Light', value: false },
        { name: 'Dark', value: true }
    ];
    topbarThemes = [
        { name: 'light', color: '#FFFFFF' },
        { name: 'dark', color: '#212529' },
        { name: 'blue', color: '#0f2d52' },
        { name: 'cyan', color: '#0097A7' },
        { name: 'teal', color: '#00796B' },
        { name: 'green', color: '#43A047' },
        { name: 'indigo', color: '#3F51B5' }
    ];
    layoutService: LayoutService = inject(LayoutService);

    get isDemoRoute() {
        const url = this.router.url.split('?')[0].split('#')[0];
        return url === '/demo' || url.startsWith('/demo/');
    }

    get homeLink() {
        return this.isDemoRoute ? '/demo/dashboard' : '/gestionale-cn/dashboard';
    }

    darkTheme = computed(() => this.layoutService.layoutConfig().darkTheme);
    selectedTopbarTheme = computed(() => {
        return this.layoutService.layoutConfig().topbarTheme;
    });

    onMenuButtonClick() {
        this.layoutService.onMenuToggle();
    }

    toggleDarkMode() {
        const supportsViewTransition = 'startViewTransition' in document;

        if (!supportsViewTransition) {
            this.executeDarkModeToggle();
            return;
        }

        (document as any).startViewTransition(() => this.executeDarkModeToggle());
    }

    executeDarkModeToggle() {
        this.layoutService.layoutConfig.update((state) => ({
            ...state,
            darkTheme: !state.darkTheme,
            menuTheme: !state.darkTheme ? 'dark' : 'light'
        }));
    }
}
