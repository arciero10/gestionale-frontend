import { Injectable, computed, inject, signal, effect } from '@angular/core';
import Keycloak from 'keycloak-js';
import {
  KEYCLOAK_EVENT_SIGNAL,
  KeycloakEventType,
  ReadyArgs,
  typeEventArgs
} from 'keycloak-angular';

// 1. Definiamo lo stato basato sui dati del Token Keycloak
export interface AuthState {
  isAuthenticated: boolean;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  roles: string[] | null;
  permissions: string[] | null;
  userId: string | null;
}

@Injectable({ providedIn: 'root' })
export class AuthService {

  private readonly keycloak = inject(Keycloak);
  private readonly keycloakEventSignal = inject(KEYCLOAK_EVENT_SIGNAL);

  private _state = signal<AuthState>({
    isAuthenticated: false,
    firstName: null,
    lastName: null,
    email: null,
    roles: null,
    permissions: null,
    userId: null
  });

  state = computed(() => this._state());
  isAuthenticated = computed(() => this._state().isAuthenticated);
  roles = computed(() => this._state().roles);
  permissions = computed(() => this._state().permissions);

  constructor() {

    effect(() => {
      const keycloakEvent = this.keycloakEventSignal();

      if (keycloakEvent.type === KeycloakEventType.Ready ||
        keycloakEvent.type === KeycloakEventType.AuthRefreshSuccess) {
        const authenticated = typeEventArgs<ReadyArgs>(keycloakEvent.args);
        if (authenticated) {
          this.updateStateFromKeycloak();
        } else {
          this.resetState();
        }
      }
      if (keycloakEvent.type === KeycloakEventType.AuthLogout) {
        this.resetState();
      }
    });
  }

  //Metodi di Login/Logout (ora sono solo wrapper)

  login(): void {
    this.keycloak.login();
  }

  logout(): void {
    this.keycloak.logout(); // L'URL di redirect è preso dal config
  }

  // 6. Metodi Helper per recuperare i dati

  /**
   * Aggiorna il nostro segnale (_state) leggendo i dati dal token
   * decodificato fornito da Keycloak.
   */
  private updateStateFromKeycloak(): void {
    const token = this.keycloak.tokenParsed as any; 
    if (!token) {
      this.resetState();
      return;
    }

    const firstName = token.given_name ?? null;
    const lastName = token.family_name ?? null;
    const email = token.email ?? null;
    const roles = token.roles ?? token.realm_access?.roles ?? null;
    const permissions = token.permissions ?? null; // Dal tuo mapper
    const userId = token.sub ?? null;
    this._state.set({
      isAuthenticated: true,
      firstName: firstName,
      lastName: lastName,
      email: email,
      roles: roles,
      permissions: permissions,
      userId: userId
    });
  }

  /**
   * Resetta lo stato (usato al logout).
   */
  private resetState(): void {
    this._state.set({
      isAuthenticated: false,
      firstName: null,
      lastName: null,
      email: null,
      roles: null,
      permissions: null,
      userId: null
    });
  }

  /**
   * Restituisce il token JWT grezzo (se necessario per il debug).
   */
  getToken(): string | undefined {
    return this.keycloak.token;
  }

  /**
   * Controlla se l'utente ha un permesso specifico (per la direttiva *hasPermission).
   */
  hasPermission(permission: string): boolean {
    return this._state().permissions?.includes(permission) ?? false;
  }
}