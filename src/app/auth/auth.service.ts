import { Injectable, computed, signal } from '@angular/core';

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
  private _state = signal<AuthState>(this.buildStateFromToken());

  state = computed(() => this._state());
  isAuthenticated = computed(() => this._state().isAuthenticated);
  roles = computed(() => this._state().roles);
  permissions = computed(() => this._state().permissions);

  login(): void {
    window.location.href =
      'https://eventidicomunita.ciamlogin.com/eventidicomunita.onmicrosoft.com/oauth2/v2.0/authorize?p=signup-signin&client_id=21ee1eae-67e3-4c7c-86ab-db78994d8666&redirect_uri=http://localhost:4200&response_type=id_token&scope=openid%20profile%20email&nonce=defaultNonce';
  }

  logout(): void {
    localStorage.removeItem('id_token');
    sessionStorage.clear();

    this.resetState();

    window.location.href =
      'https://eventidicomunita.ciamlogin.com/eventidicomunita.onmicrosoft.com/oauth2/v2.0/logout?p=signup-signin&post_logout_redirect_uri=http%3A%2F%2Flocalhost%3A4200';
  }

  refreshState(): void {
    this._state.set(this.buildStateFromToken());
  }

  getToken(): string | undefined {
    return localStorage.getItem('id_token') ?? undefined;
  }

  hasPermission(permission: string): boolean {
    return this._state().permissions?.includes(permission) ?? false;
  }

  private buildStateFromToken(): AuthState {
    const token = localStorage.getItem('id_token');

    if (!token) {
      return this.emptyState();
    }

    const payload = this.decodeToken(token);

    return {
      isAuthenticated: true,
      firstName: payload.given_name ?? null,
      lastName: payload.family_name ?? payload.surname ?? null,
      email: payload.email ?? payload.emails?.[0] ?? payload.preferred_username ?? null,
      roles: payload.roles ?? payload.realm_access?.roles ?? ['USER'],
      permissions: payload.permissions ?? [],
      userId: payload.sub ?? null
    };
  }

  private decodeToken(token: string): any {
    try {
      const base64Payload = token
        .split('.')[1]
        .replace(/-/g, '+')
        .replace(/_/g, '/');

      return JSON.parse(atob(base64Payload));
    } catch (error) {
      console.error('[AUTH] errore decodifica token:', error);
      return {};
    }
  }

  private resetState(): void {
    this._state.set(this.emptyState());
  }

  private emptyState(): AuthState {
    return {
      isAuthenticated: false,
      firstName: null,
      lastName: null,
      email: null,
      roles: null,
      permissions: null,
      userId: null
    };
  }
}