import { computed, inject, Injectable } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { AuthService } from '@/auth/auth.service';

const PLATFORM_ADMIN_EMAILS = new Set([
    'admin@eventidicomunita.it',
    'supporto@eventidicomunita.it',
    'alessandro.arciero@panteleia.it',
    'privacy@panteleia.it'
]);

const PLATFORM_ADMIN_DOMAINS = ['@panteleia.it'];

export function isPlatformAdminEmail(email: string | null | undefined): boolean {
    const normalized = email?.trim().toLowerCase();

    if (!normalized) {
        return false;
    }

    return PLATFORM_ADMIN_EMAILS.has(normalized) || PLATFORM_ADMIN_DOMAINS.some((domain) => normalized.endsWith(domain));
}

@Injectable({ providedIn: 'root' })
export class PlatformAdminAccess {
    private readonly authService = inject(AuthService);

    readonly isPlatformAdmin = computed(() => isPlatformAdminEmail(this.authService.state().email));
}

export const platformAdminGuard: CanMatchFn = () => {
    const access = inject(PlatformAdminAccess);
    const router = inject(Router);

    return access.isPlatformAdmin() ? true : router.createUrlTree(['/gestionale-cn/dashboard']);
};
