import { Component, ElementRef, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
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
    router = inject(Router);

    @ViewChild('menuContainer') menuContainer!: ElementRef;

    get isDemoRoute() {
        const url = this.router.url.split('?')[0].split('#')[0];
        return url === '/demo' || url.startsWith('/demo/');
    }

    get basePath() {
        return this.isDemoRoute ? '/demo' : '/gestionale-cn';
    }

    get model(): any[] {
        return [
            {
                label: this.isDemoRoute ? 'Demo gestionale' : 'Gestionale',
                icon: 'pi pi-fw pi-briefcase',
                items: [
                    {
                        label: 'Dashboard',
                        icon: 'pi pi-fw pi-home',
                        routerLink: [`${this.basePath}/dashboard`]
                    },
                    {
                        label: 'La tua Comunità',
                        icon: 'pi pi-fw pi-users',
                        routerLink: [`${this.basePath}/comunita`]
                    },
                    {
                        label: 'Convivenze',
                        icon: 'pi pi-fw pi-calendar',
                        routerLink: [`${this.basePath}/convivenze`]
                    },
                    {
                        label: 'Posti di Convivenza',
                        icon: 'pi pi-fw pi-building',
                        routerLink: [`${this.basePath}/posti-convivenza`]
                    },
                    {
                        label: 'Viaggi / Pellegrinaggi',
                        icon: 'pi pi-fw pi-send',
                        routerLink: [`${this.basePath}/viaggi`]
                    },
                    {
                        label: 'Aiuto / FAQ',
                        icon: 'pi pi-fw pi-question-circle',
                        routerLink: [this.isDemoRoute ? '/faq' : '/gestionale-cn/faq']
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
                        routerLink: [`${this.basePath}/comunita`]
                    },
                    {
                        label: 'Nuova convivenza',
                        icon: 'pi pi-fw pi-calendar-plus',
                        routerLink: [`${this.basePath}/convivenze`]
                    },
                    {
                        label: 'Nuovo posto',
                        icon: 'pi pi-fw pi-plus',
                        routerLink: [`${this.basePath}/posti-convivenza`]
                    }
                ]
            },
            {
                label: this.isDemoRoute ? 'Accesso' : 'Account',
                icon: 'pi pi-fw pi-user',
                items: this.isDemoRoute
                    ? [
                          {
                              label: "Accedi all'app",
                              icon: 'pi pi-fw pi-sign-in',
                              routerLink: ['/']
                          }
                      ]
                    : [
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
}
