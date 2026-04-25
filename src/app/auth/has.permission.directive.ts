import { Directive, Input, OnDestroy, OnInit, TemplateRef, ViewContainerRef, inject } from '@angular/core';
import Keycloak from 'keycloak-js';
import { KEYCLOAK_EVENT_SIGNAL, KeycloakEventType, ReadyArgs, typeEventArgs } from 'keycloak-angular';
import { effect } from '@angular/core';

@Directive({
    selector: '[hasPermission]', // Come usarla: *hasPermission="'canCreate'"
    standalone: true,
})
export class HasPermissionDirective implements OnInit {

    private readonly keycloak = inject(Keycloak);
    // Reagisce ai cambiamenti (login, token refresh)
    private readonly keycloakEventSignal = inject(KEYCLOAK_EVENT_SIGNAL);

    private requiredPermission: string = '';
    private hasView = false;

    constructor(
        private templateRef: TemplateRef<any>,
        private viewContainer: ViewContainerRef
    ) {
        // Reagisce ai cambiamenti di stato di Keycloak
        effect(() => {
            const keycloakEvent = this.keycloakEventSignal();

            // Se il token è pronto o si è aggiornato, rivaluta i permessi
            if (keycloakEvent.type === KeycloakEventType.Ready ||
                keycloakEvent.type === KeycloakEventType.AuthRefreshSuccess) {
                this.checkPermission();
            }

            // Se l'utente fa logout, pulisci la vista
            if (keycloakEvent.type === KeycloakEventType.AuthLogout) {
                this.viewContainer.clear();
                this.hasView = false;
            }
        });
    }

    @Input()
    set hasPermission(permission: string) {
        this.requiredPermission = permission;
        this.checkPermission();
    }

    ngOnInit(): void {
        this.checkPermission();
    }

    private checkPermission(): void {
        // Ottieni i permessi dall'Access Token (tokenParsed)
        const permissions = (this.keycloak.tokenParsed as any)?.permissions || [];

        // Controlla se l'utente ha il permesso e se la vista non è già stata creata
        if (permissions.includes(this.requiredPermission) && !this.hasView) {
            this.hasView = true;
            this.viewContainer.createEmbeddedView(this.templateRef);
        }
        // Se non ha il permesso e la vista esiste, distruggila
        else if (!permissions.includes(this.requiredPermission) && this.hasView) {
            this.hasView = false;
            this.viewContainer.clear();
        }
    }
}