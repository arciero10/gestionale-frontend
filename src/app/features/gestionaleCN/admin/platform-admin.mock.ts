import { computed, inject, Injectable } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { backendUserContext } from '@/auth/current-user-context';
import { hasVerifiedGlobalAdmin } from '@/auth/platform-role';

@Injectable({ providedIn: 'root' })
export class PlatformAdminAccess {
    readonly isPlatformAdmin = computed(() => hasVerifiedGlobalAdmin(backendUserContext()));
}

export const platformAdminGuard: CanMatchFn = () => {
    const access = inject(PlatformAdminAccess);
    const router = inject(Router);
    return access.isPlatformAdmin() ? true : router.createUrlTree(['/forbidden']);
};
