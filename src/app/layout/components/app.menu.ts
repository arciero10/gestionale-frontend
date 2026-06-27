import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnDestroy, ViewChild, inject } from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { AuthService } from '@/auth/auth.service';
import { PlatformAdminAccess } from '@/features/gestionaleCN/admin/platform-admin.mock';
import { AccessContextId, ensureAccessContext, getAccessContexts, saveSelectedAccessContext } from '@/features/gestionaleCN/data/access-context.mock';
import { canPerformAction, getUserAccessContext, UserAccessContext } from '@/features/gestionaleCN/data/access-policy.mock';
import { getCurrentCommunity } from '@/features/gestionaleCN/data/community-selection.storage';
import { readProfileStatus, readProfileType, readStrutturaProfile, statusLabelStruttura } from '@/features/strutture/struttura-profile.storage';
import { AppMenuitem } from './app.menuitem';

type MenuContext = 'GLOBAL_ADMIN' | 'RESPONSABILE_COMUNITA' | 'CATECHISTA' | 'STRUTTURA' | 'FRATELLO';

interface MenuHeader {
    title: string;
    subtitle: string;
    badge: string;
}

@Component({
    selector: '[app-menu]',
    standalone: true,
    imports: [CommonModule, AppMenuitem, RouterModule],
    template: `
        <div class="menu-context-panel" [class.structure]="currentMenuContext === 'STRUTTURA'" [class.admin]="currentMenuContext === 'GLOBAL_ADMIN'">
            <span class="context-eyebrow">{{ header.badge }}</span>
            <strong>{{ header.title }}</strong>
            <small>{{ header.subtitle }}</small>

            @if (showContextSwitch) {
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
                background: rgba(255, 255, 255, 0.06);
                border: 1px solid rgba(255, 255, 255, 0.18);
                box-shadow: 0 12px 30px rgba(15, 23, 42, 0.22);
            }

            .menu-context-panel.admin {
                background: rgba(29, 78, 216, 0.18);
                border-color: rgba(147, 197, 253, 0.42);
            }

            .menu-context-panel.structure {
                background: rgba(6, 95, 70, 0.18);
                border-color: rgba(167, 243, 208, 0.35);
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
                color: #f8fafc;
                font-size: 0.98rem;
                line-height: 1.2;
            }

            .menu-context-panel small {
                color: #cbd5e1;
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
export class AppMenu implements OnDestroy {
    el = inject(ElementRef);
    authService = inject(AuthService);
    platformAdminAccess = inject(PlatformAdminAccess);
    router = inject(Router);

    contexts = getAccessContexts();
    selectedContext: AccessContextId = ensureAccessContext().id;
    currentCommunity = getCurrentCommunity();
    userContext = getUserAccessContext();
    currentMenuContext: MenuContext = this.getCurrentMenuContext();
    header: MenuHeader = this.buildHeaderForContext(this.currentMenuContext);
    model: any[] = this.buildMenuForContext(this.currentMenuContext);

    private readonly routerSubscription: Subscription;

    @ViewChild('menuContainer') menuContainer!: ElementRef;

    constructor() {
        this.routerSubscription = this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => this.refreshMenu());
    }

    get showContextSwitch(): boolean {
        return this.currentMenuContext !== 'GLOBAL_ADMIN' && this.currentMenuContext !== 'STRUTTURA' && this.contexts.length > 1;
    }

    changeContext(contextId: AccessContextId): void {
        const context = this.contexts.find((item) => item.id === contextId);

        if (!context) {
            return;
        }

        this.selectedContext = context.id;
        saveSelectedAccessContext(context.id);
        this.refreshMenu();
        this.router.navigateByUrl(context.route);
    }

    ngOnDestroy(): void {
        this.routerSubscription.unsubscribe();
    }

    private refreshMenu(): void {
        this.contexts = getAccessContexts();
        this.selectedContext = ensureAccessContext().id;
        this.currentCommunity = getCurrentCommunity();
        this.userContext = getUserAccessContext();
        this.currentMenuContext = this.getCurrentMenuContext();
        this.header = this.buildHeaderForContext(this.currentMenuContext);
        this.model = this.buildMenuForContext(this.currentMenuContext);
    }

    private getCurrentMenuContext(): MenuContext {
        const path = this.currentPath();

        if (this.isAreaStruttureRoute()) {
            return 'STRUTTURA';
        }

        if (this.isGlobalAdminRoute()) {
            return 'GLOBAL_ADMIN';
        }

        if (readProfileType() === 'struttura' && !path.startsWith('/gestionale-cn')) {
            return 'STRUTTURA';
        }

        if (this.isCatechistaContext()) {
            return 'CATECHISTA';
        }

        if (this.isResponsabileContext()) {
            return 'RESPONSABILE_COMUNITA';
        }

        return 'FRATELLO';
    }

    private isGlobalAdminRoute(): boolean {
        return this.currentPath().startsWith('/gestionale-cn/admin');
    }

    private isAreaStruttureRoute(): boolean {
        return this.currentPath().startsWith('/area-strutture');
    }

    private isResponsabileContext(): boolean {
        return this.selectedContext === 'responsabile' || this.userContext.isResponsabile;
    }

    private isCatechistaContext(): boolean {
        return this.selectedContext === 'catechista' && this.userContext.isCatechista;
    }

    private currentPath(): string {
        return this.router.url.split('?')[0].split('#')[0];
    }

    private buildHeaderForContext(context: MenuContext): MenuHeader {
        const struttura = readStrutturaProfile();
        const status = readProfileStatus();

        switch (context) {
            case 'GLOBAL_ADMIN':
                return {
                    title: 'GLOBAL ADMIN',
                    subtitle: 'Piattaforma Eventi di Comunità',
                    badge: 'Amministrazione globale'
                };
            case 'STRUTTURA':
                return {
                    title: 'AREA STRUTTURE',
                    subtitle: struttura?.nome || 'Nome struttura da completare',
                    badge: statusLabelStruttura(status)
                };
            case 'CATECHISTA':
                return {
                    title: 'Area Catechista',
                    subtitle: this.userContext.childCommunityNames.length ? this.userContext.childCommunityNames.join(', ') : 'Comunità / equipe di riferimento',
                    badge: 'Catechista'
                };
            case 'RESPONSABILE_COMUNITA':
                return {
                    title: this.currentCommunity.nomeComunita,
                    subtitle: this.currentCommunity.parrocchiaNome,
                    badge: 'Area Responsabile'
                };
            case 'FRATELLO':
            default:
                return {
                    title: 'La mia area',
                    subtitle: this.userContext.communityName || `${this.currentCommunity.nomeComunita} - ${this.currentCommunity.parrocchiaNome}`,
                    badge: 'Area personale'
                };
        }
    }

    private buildMenuForContext(context: MenuContext): any[] {
        switch (context) {
            case 'GLOBAL_ADMIN':
                return this.buildGlobalAdminMenu();
            case 'STRUTTURA':
                return this.buildStrutturaMenu();
            case 'CATECHISTA':
                return this.buildCatechistaMenu();
            case 'RESPONSABILE_COMUNITA':
                return this.buildResponsabileMenu();
            case 'FRATELLO':
            default:
                return this.buildFratelloMenu();
        }
    }

    private buildGlobalAdminMenu(): any[] {
        return [
            this.section('Amministrazione globale', 'pi pi-fw pi-shield', [
                this.link('Dashboard admin', 'pi pi-fw pi-th-large', '/gestionale-cn/admin/dashboard'),
                this.link('Utenti', 'pi pi-fw pi-id-card', '/gestionale-cn/admin/utenti'),
                this.link('Comunità', 'pi pi-fw pi-sitemap', '/gestionale-cn/admin/comunita'),
                this.link('Profili', 'pi pi-fw pi-users', '/gestionale-cn/admin/profili'),
                this.link('Strutture', 'pi pi-fw pi-building', '/gestionale-cn/admin/strutture'),
                this.link('Convivenze', 'pi pi-fw pi-calendar', '/gestionale-cn/admin/convivenze'),
                this.link('Richieste', 'pi pi-fw pi-send', '/gestionale-cn/admin/richieste'),
                this.link('Viaggi', 'pi pi-fw pi-map', '/gestionale-cn/admin/viaggi'),
                this.link('Impostazioni', 'pi pi-fw pi-cog', '/gestionale-cn/admin/impostazioni')
            ]),
            this.section('Contesti operativi', 'pi pi-fw pi-compass', [
                this.link('Area responsabile', 'pi pi-fw pi-id-card', '/gestionale-cn/dashboard'),
                this.link('Catalogo posti', 'pi pi-fw pi-building', '/gestionale-cn/posti-convivenza'),
                this.link('Area strutture', 'pi pi-fw pi-warehouse', '/area-strutture/dashboard'),
                this.link('Demo pubblica', 'pi pi-fw pi-eye', '/demo')
            ]),
            this.accountSection()
        ];
    }

    private buildResponsabileMenu(): any[] {
        const sections = [
            this.section('Gestionale', 'pi pi-fw pi-briefcase', [
                this.link('Dashboard', 'pi pi-fw pi-home', '/gestionale-cn/dashboard'),
                this.link('La tua Comunità', 'pi pi-fw pi-users', '/gestionale-cn/comunita'),
                this.link('Convivenze attive', 'pi pi-fw pi-calendar', '/gestionale-cn/convivenze'),
                this.link('Storico convivenze', 'pi pi-fw pi-history', '/gestionale-cn/convivenze/storico'),
                this.link('Posti di Convivenza', 'pi pi-fw pi-building', '/gestionale-cn/posti-convivenza'),
                this.link('Richieste strutture', 'pi pi-fw pi-send', '/gestionale-cn/richieste-strutture'),
                this.link('Viaggi / Pellegrinaggi', 'pi pi-fw pi-map', '/gestionale-cn/viaggi')
            ]),
            this.section('Azioni rapide', 'pi pi-fw pi-plus-circle', [
                this.link('Nuova convivenza', 'pi pi-fw pi-calendar-plus', '/gestionale-cn/convivenze', canPerformAction('nuova-convivenza', this.userContext)),
                this.link('Nuova richiesta struttura', 'pi pi-fw pi-send', '/gestionale-cn/richieste-strutture/nuova', canPerformAction('invia-richiesta-struttura', this.userContext)),
                this.link('Invita struttura', 'pi pi-fw pi-building', '/gestionale-cn/posti-convivenza', canPerformAction('nuovo-posto', this.userContext))
            ])
        ];

        if (this.platformAdminAccess.isPlatformAdmin()) {
            sections.push(this.section('Amministrazione', 'pi pi-fw pi-shield', [
                this.link('Vai a Global Admin', 'pi pi-fw pi-arrow-right', '/gestionale-cn/admin/dashboard')
            ]));
        }

        sections.push(this.supportSection(), this.accountSection());
        return sections;
    }

    private buildCatechistaMenu(): any[] {
        const sections = [
            this.section('Area Catechista', 'pi pi-fw pi-sitemap', [
                this.link('Dashboard catechista', 'pi pi-fw pi-home', '/gestionale-cn/catechista/dashboard'),
                this.link('Comunità seguite', 'pi pi-fw pi-users', '/gestionale-cn/catechista/comunita-figlie'),
                this.link('Convivenze catechistiche', 'pi pi-fw pi-calendar', '/gestionale-cn/catechista/convivenze'),
                this.link('Equipe catechisti', 'pi pi-fw pi-sitemap', '/gestionale-cn/catechista/equipe'),
                this.link('Calendario', 'pi pi-fw pi-calendar-clock', '/gestionale-cn/catechista/calendario'),
                this.link('Viaggi / Pellegrinaggi', 'pi pi-fw pi-map', '/gestionale-cn/viaggi')
            ])
        ];

        if (this.userContext.isResponsabile) {
            sections.push(this.section('Contesti', 'pi pi-fw pi-compass', [
                this.link('Vai ad Area Responsabile', 'pi pi-fw pi-id-card', '/gestionale-cn/dashboard')
            ]));
        }

        sections.push(this.supportSection(), this.accountSection());
        return sections;
    }

    private buildStrutturaMenu(): any[] {
        return [
            this.section('Area Strutture', 'pi pi-fw pi-building', [
                this.link('Dashboard struttura', 'pi pi-fw pi-home', '/area-strutture/dashboard'),
                this.link('Profilo struttura', 'pi pi-fw pi-id-card', '/area-strutture/profilo'),
                this.link('Foto struttura', 'pi pi-fw pi-images', '/area-strutture/foto'),
                this.link('Offerte e promo', 'pi pi-fw pi-tags', '/area-strutture/offerte'),
                this.link('Richieste ricevute', 'pi pi-fw pi-inbox', '/area-strutture/richieste'),
                this.link('Stato accreditamento', 'pi pi-fw pi-shield', '/area-strutture/profilo')
            ]),
            this.section('Supporto', 'pi pi-fw pi-question-circle', [
                this.link('Guida', 'pi pi-fw pi-question-circle', '/faq'),
                this.link('Contatta amministrazione', 'pi pi-fw pi-envelope', '/privacy')
            ]),
            this.accountSection()
        ];
    }

    private buildFratelloMenu(): any[] {
        return [
            this.section('Area personale', 'pi pi-fw pi-user', [
                this.link('Dashboard personale', 'pi pi-fw pi-home', '/gestionale-cn/dashboard'),
                this.link('Il mio profilo', 'pi pi-fw pi-id-card', '/profile/create'),
                this.link('La mia comunità', 'pi pi-fw pi-users', '/gestionale-cn/comunita'),
                this.link('Convivenze a cui partecipo', 'pi pi-fw pi-calendar', '/gestionale-cn/convivenze'),
                this.link('Storico convivenze', 'pi pi-fw pi-history', '/gestionale-cn/convivenze/storico'),
                this.link('Documenti / consensi', 'pi pi-fw pi-shield', '/gestionale-cn/privacy/compila')
            ]),
            this.supportSection(),
            this.accountSection()
        ];
    }

    private supportSection(): any {
        return this.section('Supporto', 'pi pi-fw pi-question-circle', [
            this.link('Aiuto / FAQ', 'pi pi-fw pi-question-circle', '/gestionale-cn/faq'),
            this.link('Privacy e trattamento dati', 'pi pi-fw pi-shield', '/gestionale-cn/privacy')
        ]);
    }

    private accountSection(): any {
        return this.section('Account', 'pi pi-fw pi-user', [
            this.link('Profilo', 'pi pi-fw pi-id-card', '/profile/create'),
            {
                label: 'Esci',
                icon: 'pi pi-fw pi-power-off',
                command: () => this.authService.logout()
            }
        ]);
    }

    private section(label: string, icon: string, items: any[]): any {
        return {
            label,
            icon,
            items: items.filter((item) => item.visible !== false),
            visible: items.some((item) => item.visible !== false)
        };
    }

    private link(label: string, icon: string, route: string, visible = true): any {
        return {
            label,
            icon,
            routerLink: [route],
            visible
        };
    }
}
