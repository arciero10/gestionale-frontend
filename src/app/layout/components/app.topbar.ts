import { Component, computed, ElementRef, inject, ViewChild } from '@angular/core';
import { RouterModule } from '@angular/router';
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
            <a class="layout-topbar-logo" routerLink="/">
                <h1 class="text-xl md:text-2xl font-bold  dark:text-white leading-tight">GESTIONALE CN</h1>
            </a>
            <a #menuButton class="layout-menu-button" (click)="onMenuButtonClick()" pRipple>
                <i class="pi pi-angle-right"></i>
            </a>
        </div>

        <div class="layout-topbar-end">
            <div class="layout-topbar-actions-end">
                <ul class="layout-topbar-items">
                    <li>
                        <a pStyleClass="@next" enterFromClass="hidden" enterActiveClass="animate-scalein" leaveToClass="hidden" leaveActiveClass="animate-fadeout" [hideOnOutsideClick]="true">
                            <i class="pi pi-bell"></i>
                        </a>
                        <div class="hidden">
                            <ul class="list-none p-0 m-0">
                                <li>
                                    <a class="py-2 px-3 flex gap-2 cursor-pointer text-color hover:text-primary">
                                        <i class="pi pi-fw pi-sliders-h text-lg"></i>
                                        <span>Pending tasks</span>
                                    </a>
                                </li>
                                <li>
                                    <a class="py-2 px-3 flex gap-2 cursor-pointer text-color hover:text-primary ">
                                        <i class="pi pi-fw pi-calendar text-lg"></i>
                                        <span>Meeting today at 3pm</span>
                                    </a>
                                </li>
                                <li>
                                    <a class="py-2 px-3 flex gap-2 cursor-pointer text-color hover:text-primary">
                                        <i class="pi pi-fw pi-download text-lg"></i>
                                        <span>Download documents</span>
                                    </a>
                                </li>
                                <li>
                                    <a class="py-2 px-3 flex gap-2 cursor-pointer text-color hover:text-primary">
                                        <i class="pi pi-fw pi-bookmark text-lg"></i>
                                        <span>Book flight</span>
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </li>
                    <li class="li-config-button">
                        <a pStyleClass="@next" enterFromClass="hidden" enterActiveClass="animate-scalein" leaveToClass="hidden" leaveActiveClass="animate-fadeout" [hideOnOutsideClick]="true" aria-label="Opzioni topbar">
                            <i class="pi pi-palette"></i>
                        </a>
                        <!-- menu -->
                        <div class="hidden p-3 w-72 rounded-border bg-surface-0 dark:bg-surface-900 shadow-md">
                            <div class="flex flex-col gap-4 m-2">
                                <div class="flex flex-col gap-4">
                                    <span class="text-lg font-semibold">Topbar Themes</span>
                                    <div class="pt-2 flex gap-2 flex-wrap">
                                        @for (theme of topbarThemes; track theme.name) {
                                            <button
                                                [title]="selectedTopbarTheme()"
                                                (click)="layoutService.setTopbarTheme(theme.name)"
                                                class="w-4! h-4! aspect-square rounded-full! shadow"
                                                [style.backgroundColor]="theme.color"
                                                [ngClass]="{
                                                    'outline outline-primary': selectedTopbarTheme() === theme.name
                                                }"
                                            ></button>
                                        }
                                    </div>
                                </div>

                                <div class="flex flex-col gap-2">
                                    <span class="text-lg font-semibold">Color Scheme</span>
                                    <p-selectbutton [ngModel]="darkTheme()" (ngModelChange)="toggleDarkMode()" [options]="themeOptions" optionLabel="name" optionValue="value" [allowEmpty]="false" />
                                </div>
                            </div>
                        </div>
                    </li>
                </ul>
            </div>
        </div>
    </div>`
})
export class AppTopbar {
    @ViewChild('menuButton') menuButton!: ElementRef;

    @ViewChild('mobileMenuButton') mobileMenuButton!: ElementRef;

    constructor(public el: ElementRef) {}

    activeItem!: number;
    themeOptions = [
        { name: 'Light', value: false },
        { name: 'Dark', value: true }
    ];
    topbarThemes = [
        { name: 'light', color: '#FFFFFF' },
        { name: 'dark', color: '#212529' },
        { name: 'blue', color: '#1565C0' },
        { name: 'purple', color: '#6A1B9A' },
        { name: 'pink', color: '#AD1457' },
        { name: 'cyan', color: '#0097A7' },
        { name: 'teal', color: '#00796B' },
        { name: 'green', color: '#43A047' },
        { name: 'yellow', color: '#FBC02D' },
        { name: 'orange', color: '#FB8C00' },
        { name: 'indigo', color: '#3F51B5' }
    ];
    layoutService: LayoutService = inject(LayoutService);

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
