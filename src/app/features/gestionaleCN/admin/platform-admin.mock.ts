import { computed, inject, Injectable } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { AuthService } from '@/auth/auth.service';

export const GLOBAL_ADMIN_EMAILS = [
    'admin@panteleiaets.onmicrosoft.com',
    'alessandro.arciero@panteleiaets.it',
    'alessandro.arciero@tiscali.it',
    'admin@eventidicomunita.it',
    'supporto@eventidicomunita.it',
    'alessandro.arciero@panteleia.it',
    'privacy@panteleia.it'
];

export const PLATFORM_ADMIN_EMAILS = GLOBAL_ADMIN_EMAILS;

export function isPlatformAdminEmail(email: string | null | undefined): boolean {
    const normalized = email?.trim().toLowerCase();

    if (!normalized) {
        return false;
    }

    return GLOBAL_ADMIN_EMAILS.includes(normalized);
}

export function isLocalAdminMockEnabled(): boolean {
    if (typeof window === 'undefined') {
        return false;
    }

    return ['localhost', '127.0.0.1'].includes(window.location.hostname) || localStorage.getItem('globalAdminMockEnabled') === 'true';
}

@Injectable({ providedIn: 'root' })
export class PlatformAdminAccess {
    private readonly authService = inject(AuthService);

    readonly isPlatformAdmin = computed(() => isPlatformAdminEmail(this.authService.state().email) || isLocalAdminMockEnabled());
}

export const platformAdminGuard: CanMatchFn = () => {
    const access = inject(PlatformAdminAccess);
    const router = inject(Router);

    return access.isPlatformAdmin() ? true : router.createUrlTree(['/forbidden']);
};

