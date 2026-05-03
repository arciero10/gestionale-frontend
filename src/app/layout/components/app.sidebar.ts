import { Component, ElementRef, ViewChild } from '@angular/core';
import { AppMenu } from './app.menu';
import { LayoutService } from '@/layout/service/layout.service';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { getCurrentCommunity } from '../../features/gestionaleCN/data/community-selection.storage';

@Component({
    selector: '[app-sidebar]',
    standalone: true,
    imports: [AppMenu, RouterModule, CommonModule],
    template: ` <div class="layout-sidebar" (mouseenter)="onMouseEnter()" (mouseleave)="onMouseLeave()">
        <div class="layout-sidebar-top">
            <a routerLink="/gestionale-cn/dashboard" class="flex items-center gap-3 no-underline text-white">
                <span class="w-10 h-10 rounded-md bg-white/10 border border-white/20 flex items-center justify-center font-bold">CN</span>
                <span class="layout-sidebar-logo brand-neocat text-lg tracking-normal">Gestionale CN</span>
                <span class="layout-sidebar-logo-slim w-10 h-10 rounded-md bg-white/10 border border-white/20 flex items-center justify-center font-bold">CN</span>
            </a>
            <button class="layout-sidebar-anchor" type="button" (click)="anchor()"></button>
        </div>
        <div class="px-6 pb-4 text-sm text-surface-500 dark:text-surface-300 layout-sidebar-logo">
            <div class="font-semibold text-surface-700 dark:text-surface-100">{{ nomeComunita }}</div>
            <div>{{ parrocchia }}</div>
        </div>
        <div class="layout-menu-container">
            <div app-menu></div>
        </div>
    </div>`
})
export class AppSidebar {
    timeout: any = null;

    get nomeComunita() {
        return getCurrentCommunity().nomeComunita;
    }

    get parrocchia() {
        return getCurrentCommunity().parrocchiaNome;
    }

    @ViewChild(AppMenu) appMenu!: AppMenu;

    constructor(
        public layoutService: LayoutService,
        public el: ElementRef
    ) {}

    get menuProfilePosition() {
        return this.layoutService.layoutConfig().menuProfilePosition;
    }

    onMouseEnter() {
        if (!this.layoutService.layoutState().anchored) {
            if (this.timeout) {
                clearTimeout(this.timeout);
                this.timeout = null;
            }

            this.layoutService.layoutState.update((state) => {
                if (!state.sidebarActive) {
                    return {
                        ...state,
                        sidebarActive: true
                    };
                }
                return state;
            });
        }
    }

    onMouseLeave() {
        if (!this.layoutService.layoutState().anchored) {
            if (!this.timeout) {
                this.timeout = setTimeout(() => {
                    this.layoutService.layoutState.update((state) => {
                        if (state.sidebarActive) {
                            return {
                                ...state,
                                sidebarActive: false
                            };
                        }
                        return state;
                    });
                }, 300);
            }
        }
    }

    anchor() {
        this.layoutService.layoutState.update((state) => ({
            ...state,
            anchored: !state.anchored
        }));
    }
}
