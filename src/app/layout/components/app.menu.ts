import { Component, ElementRef, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AppMenuitem } from './app.menuitem';
import { AuthService } from '@/auth/auth.service';

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
    authService = inject(AuthService);

    @ViewChild('menuContainer') menuContainer!: ElementRef;

    model: any[] = [
        {
            label: 'Gestionale',
            icon: 'pi pi-fw pi-briefcase',
            items: [
                {
                    label: 'Dashboard',
                    icon: 'pi pi-fw pi-home',
                    routerLink: ['/gestionale-cn/dashboard']
                },
                {
                    label: 'La tua Comunità',
                    icon: 'pi pi-fw pi-users',
                    routerLink: ['/gestionale-cn/comunita']
                },
                {
                    label: 'Censimento comunità',
                    icon: 'pi pi-fw pi-user-plus',
                    routerLink: ['/gestionale-cn/censimento-comunita']
                },
                {
                    label: 'Convivenze',
                    icon: 'pi pi-fw pi-calendar',
                    routerLink: ['/gestionale-cn/convivenze']
                },
                {
                    label: 'Posti di Convivenza',
                    icon: 'pi pi-fw pi-building',
                    routerLink: ['/gestionale-cn/posti-convivenza']
                },
                {
                    label: 'Richieste strutture',
                    icon: 'pi pi-fw pi-send',
                    routerLink: ['/gestionale-cn/richieste-strutture']
                },
                {
                    label: 'Viaggi / Pellegrinaggi',
                    icon: 'pi pi-fw pi-send',
                    routerLink: ['/gestionale-cn/viaggi']
                }
            ]
        },
        {
            label: 'Supporto',
            icon: 'pi pi-fw pi-question-circle',
            items: [
                {
                    label: 'Aiuto / FAQ',
                    icon: 'pi pi-fw pi-question-circle',
                    routerLink: ['/gestionale-cn/faq']
                },
                {
                    label: 'Privacy e trattamento dati',
                    icon: 'pi pi-fw pi-shield',
                    routerLink: ['/gestionale-cn/privacy']
                }
            ]
        },
        {
            label: 'Azioni rapide',
            icon: 'pi pi-fw pi-plus-circle',
            items: [
                {
                    label: 'Aggiungi membro',
                    icon: 'pi pi-fw pi-user-plus',
                    routerLink: ['/gestionale-cn/comunita']
                },
                {
                    label: 'Nuova convivenza',
                    icon: 'pi pi-fw pi-calendar-plus',
                    routerLink: ['/gestionale-cn/convivenze']
                },
                {
                    label: 'Nuovo posto',
                    icon: 'pi pi-fw pi-plus',
                    routerLink: ['/gestionale-cn/posti-convivenza']
                }
            ]
        },
        {
            label: 'Account',
            icon: 'pi pi-fw pi-user',
            items: [
                {
                    label: 'Profilo',
                    icon: 'pi pi-fw pi-id-card',
                    routerLink: ['/profile/create']
                },
                {
                    label: 'Esci',
                    icon: 'pi pi-fw pi-power-off',
                    command: () => this.authService.logout()
                }
            ]
        }
    ];
}
