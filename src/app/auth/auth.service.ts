import { Injectable, Injector, computed, inject, signal } from '@angular/core';
import { MsalService } from '@azure/msal-angular';
import { Router } from '@angular/router';
import { MobileAuthService } from './mobile-auth.service';
import { CurrentUserService } from './current-user.service';
import { backendUserContext } from './current-user-context';

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
  private readonly injector = inject(Injector);
  private readonly mobile = inject(MobileAuthService);
  private get msalService(): MsalService { return this.injector.get(MsalService); }
  private _state = signal<AuthState>(this.buildStateFromToken());

  state = computed(() => {
    if (!this.mobile.native) return this._state();
    const context = backendUserContext();
    return { ...this.emptyState(), isAuthenticated: this.mobile.signedIn(),
      firstName: context?.displayName ?? null, email: context?.email ?? null,
      userId: context?.userId?.toString() ?? null, roles: context?.role ? [context.role] : [], permissions: context?.permissions ?? [] };
  });
  isAuthenticated = computed(() => this.state().isAuthenticated);
  roles = computed(() => this.state().roles);
  permissions = computed(() => this.state().permissions);

  login(): void {
    if (this.mobile.native) { void this.loginNative().catch(() => undefined); return; }
    sessionStorage.setItem('eventiComunità.authIntent', 'login');
    this.msalService.loginRedirect({
      scopes: ['openid', 'profile', 'email']
    }).subscribe({
      error: (error) => console.error('[AUTH] errore loginRedirect:', error)
    });
  }

  logout(): void {
    if (this.mobile.native) {
      this.mobile.logout();
      this.injector.get(CurrentUserService).reset();
      void this.injector.get(Router).navigateByUrl('/', { replaceUrl: true });
      return;
    }
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

  async loginNative(): Promise<void> {
    await this.mobile.login();
    const currentUser = this.injector.get(CurrentUserService);
    await currentUser.load(this.mobile.sessionKey);
    if (currentUser.state() !== 'ready' || !currentUser.context()?.authenticated) {
      this.mobile.logout();
      currentUser.reset();
      throw new Error('Impossibile verificare il profilo. Controlla la connessione e riprova.');
    }
    const target = currentUser.context()?.linkedToCommunity ? '/gestionale-cn/dashboard' : '/gestionale-cn/onboarding-comunita';
    if (!await this.injector.get(Router).navigateByUrl(target, { replaceUrl: true }))
      throw new Error('Impossibile aprire il profilo. Riprova.');
  }

  getToken(): string | undefined {
    if (this.mobile.native) return undefined;
    return localStorage.getItem('id_token') ?? undefined;
  }

  hasPermission(permission: string): boolean {
    return this.state().permissions?.includes(permission) ?? false;
  }

  private buildStateFromToken(): AuthState {
    if (this.mobile.native) return this.emptyState();
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
