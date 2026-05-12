import { Component, ElementRef, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AppMenuitem } from './app.menuitem';
import { AuthService } from '@/auth/auth.service';
import { PlatformAdminAccess } from '@/features/gestionaleCN/admin/platform-admin.mock';
import { AccessContextId, ensureAccessContext, getAccessContexts, saveSelectedAccessContext } from '@/features/gestionaleCN/data/access-context.mock';
import { getCurrentCommunity } from '@/features/gestionaleCN/data/community-selection.storage';

@Component({
    selector: '[app-menu]',
    standalone: true,
    imports: [CommonModule, AppMenuitem, RouterModule],
    template: `
        <div class="menu-context-panel">
            <span class="context-eyebrow">Area attiva</span>
            <strong>{{ activeContextLabel }}</strong>
            <small>{{ currentCommunity.nomeComunita }} - {{ currentCommunity.parrocchiaNome }}</small>

            @if (contexts.length > 1) {
                <label for="accessContextSwitch">Cambia area</label>
                <select id="accessContextSwitch" [value]="selectedContext" (change)="changeContext($any($event.target).value)">
                    @for (context of contexts; track context.id) {
                        <option [value]="context.id">{{ context.label }}</option>
                    }
                </select>
            }
        </div>

        <ul class="layout-menu" #menuContainer>
            <ng-container *ngFor="let item of model; let i = index">
                <li app-menuitem *ngIf="!item.separator" [item]="item" [index]="i" [root]="true"></li>
                <li *ngIf="item.separator" class="menu-separator"></li>
            </ng-container>
        </ul>
    `,
    styles: [
        `
            .menu-context-panel {
                margin: 0.75rem 0.85rem 1rem;
                padding: 0.9rem;
                display: grid;
                gap: 0.35rem;
                border-radius: 14px;
                color: #f8fafc;
                background: rgba(15, 23, 42, 0.72);
                border: 1px solid rgba(255, 255, 255, 0.16);
                box-shadow: 0 12px 30px rgba(15, 23, 42, 0.22);
            }

            .menu-context-panel .context-eyebrow,
            .menu-context-panel label {
                color: #cbd5e1;
                font-size: 0.72rem;
                font-weight: 800;
                text-transform: uppercase;
                letter-spacing: 0.02em;
            }

            .menu-context-panel strong {
                color: #ffffff;
                font-size: 0.98rem;
                line-height: 1.2;
            }

            .menu-context-panel small {
                color: #e2e8f0;
                font-size: 0.78rem;
                line-height: 1.25;
            }

            .menu-context-panel select {
                width: 100%;
                min-height: 40px;
                margin-top: 0.1rem;
                padding: 0.45rem 0.6rem;
                border-radius: 10px;
                color: #0f172a;
                background: rgba(255, 255, 255, 0.94);
                border: 1px solid rgba(255, 255, 255, 0.35);
                outline: none;
            }
        `
    ]
})
export class AppMenu {
    el = inject(ElementRef);
    authService = inject(AuthService);
    platformAdminAccess = inject(PlatformAdminAccess);
    router = inject(Router);
    contexts = getAccessContexts();
    selectedContext: AccessContextId = ensureAccessContext().id;
    currentCommunity = getCurrentCommunity();
    hasResponsibleContext = this.contexts.some((context) => context.id === 'responsabile');
    hasCatechistContext = this.contexts.some((context) => context.id === 'catechista');

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
                    label: 'Area Responsabile',
                    icon: 'pi pi-fw pi-id-card',
                    routerLink: ['/gestionale-cn/responsabile/dashboard'],
                    visible: this.hasResponsibleContext
                },
                {
                    label: 'Censimento comunità',
                    icon: 'pi pi-fw pi-user-plus',
                    routerLink: ['/gestionale-cn/censimento-comunita'],
                    visible: this.hasResponsibleContext
                },
                {
                    label: 'Area Catechista',
                    icon: 'pi pi-fw pi-sitemap',
                    routerLink: ['/gestionale-cn/catechista/dashboard'],
                    visible: this.hasCatechistContext
                },
                {
                    label: 'Convivenze attive',
                    icon: 'pi pi-fw pi-calendar',
                    routerLink: ['/gestionale-cn/convivenze']
                },
                {
                    label: 'Storico convivenze',
                    icon: 'pi pi-fw pi-history',
                    routerLink: ['/gestionale-cn/convivenze/storico']
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
            label: 'Admin piattaforma',
            icon: 'pi pi-fw pi-shield',
            visible: this.platformAdminAccess.isPlatformAdmin(),
            items: [
                {
                    label: 'Dashboard admin',
                    icon: 'pi pi-fw pi-th-large',
                    routerLink: ['/gestionale-cn/admin']
                },
                {
                    label: 'Strutture',
                    icon: 'pi pi-fw pi-building',
                    routerLink: ['/gestionale-cn/admin/strutture']
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
        }
    ];

    get activeContextLabel(): string {
        return this.contexts.find((context) => context.id === this.selectedContext)?.label ?? 'La mia comunità';
    }

    changeContext(contextId: AccessContextId): void {
        const context = this.contexts.find((item) => item.id === contextId);

        if (!context) {
            return;
        }

        this.selectedContext = context.id;
        saveSelectedAccessContext(context.id);
        this.router.navigateByUrl(context.route);
    }
}
