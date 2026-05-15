import { Injectable, computed, inject, signal } from '@angular/core';
import { MsalService } from '@azure/msal-angular';

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
  private readonly msalService = inject(MsalService);
  private _state = signal<AuthState>(this.buildStateFromToken());

  state = computed(() => this._state());
  isAuthenticated = computed(() => this._state().isAuthenticated);
  roles = computed(() => this._state().roles);
  permissions = computed(() => this._state().permissions);

  login(): void {
    sessionStorage.setItem('eventiComunità.authIntent', 'login');
    this.msalService.loginRedirect({
      scopes: ['openid', 'profile', 'email']
    }).subscribe({
      error: (error) => console.error('[AUTH] errore loginRedirect:', error)
    });
  }

  logout(): void {
    localStorage.removeItem('id_token');
    sessionStorage.clear();

    this.resetState();

    this.msalService.initialize().subscribe({
      next: () => this.msalService.logoutRedirect(),
      error: (error) => console.error('[AUTH] errore logoutRedirect:', error)
    });
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
      email: payload.email ?? payload.emails?.[0] ?? payload.preferred_username ?? payload.upn ?? null,
      roles: payload.roles ?? payload.realm_access?.roles ?? ['USER'],
      permissions: payload.permissions ?? [],
      userId: payload.oid ?? payload.sub ?? null
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
