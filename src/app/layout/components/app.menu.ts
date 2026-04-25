import { AreasType } from './../../models/macro-area';
import { Component, ElementRef, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AppMenuitem } from './app.menuitem';

@Component({
    selector: '[app-menu]',
    standalone: true,
    imports: [CommonModule, AppMenuitem, RouterModule],
    template: `<ul class="layout-menu" #menuContainer>
        <ng-container *ngFor="let item of model; let i = index">
            <li app-menuitem *ngIf="!item.separator" [item]="item" [index]="i" [root]="true"></li>
            <li *ngIf="item.separator" class="menu-separator"></li>
        </ng-container>
    </ul> `
})
export class AppMenu {
    el = inject(ElementRef);

    @ViewChild('menuContainer') menuContainer!: ElementRef;

    model: any[] = [
        {
            label: 'Home',
            icon: 'pi pi-home',
            items: [
                {
                    label: 'Dahsboard',
                    icon: 'pi pi-fw pi-home',
                    routerLink: ['/']
                }
            ]
        },
        {
            label: 'Gestionale CN',
            icon: 'pi pi-fw pi-briefcase',
            items: [
                {
                    label: 'Convivenze',
                    icon: 'pi pi-fw pi-home',
                    routerLink: [`/gestionale-cn/convivenze/${AreasType.Convivenze}`]
                },
                {
                    label: 'Viaggi',
                    icon: 'pi pi-fw pi-money-bill',
                    routerLink: [`/gestionale-cn/viaggi/${AreasType.Viaggi}`]
                }
            ]
        },
        {
            label: 'User Management',
            icon: 'pi pi-fw pi-user',
            items: [
                {
                    label: 'Lista',
                    icon: 'pi pi-fw pi-list',
                    routerLink: ['profile/list']
                },
                {
                    label: 'Create',
                    icon: 'pi pi-fw pi-plus',
                    routerLink: ['profile/create']
                }
            ]
        }
    ];
}
