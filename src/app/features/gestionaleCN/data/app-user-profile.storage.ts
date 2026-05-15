export type AppUserStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

export const APP_USER_PROFILE_KEY = 'app_user_profile';
export const APP_USER_STATUS_KEY = 'app_user_status';

export interface AppUserProfile {
    communitySelected: boolean;
    numeroComunita: number;
    nomeComunita: string;
    parrocchiaNome: string;
    diocesiNome: string;
    settoreNome: string;
    tappaCammino: string;
    carisma: string;
    carismi: string[];
    telefono?: string;
    privacyConsenso: boolean;
    isCatechista: boolean;
    comunitaFiglieAssociate: unknown[];
    createdAt: string;
    updatedAt: string;
}

export function getAppUserProfile(): AppUserProfile | null {
    const raw = localStorage.getItem(APP_USER_PROFILE_KEY);

    if (!raw) {
        return null;
    }

    try {
        return JSON.parse(raw) as AppUserProfile;
    } catch {
        return null;
    }
}

export function getAppUserStatus(): AppUserStatus | null {
    const value = localStorage.getItem(APP_USER_STATUS_KEY);

    return isAppUserStatus(value) ? value : null;
}

export function hasAppUserProfile(): boolean {
    return getAppUserProfile() !== null;
}

export function isAppUserApproved(): boolean {
    return hasAppUserProfile() && getAppUserStatus() === 'approved';
}

export function saveAppUserProfile(profile: AppUserProfile, status: AppUserStatus = 'pending'): void {
    localStorage.setItem(APP_USER_PROFILE_KEY, JSON.stringify(profile));
    localStorage.setItem(APP_USER_STATUS_KEY, status);
}

export function isAppUserStatus(value: string | null): value is AppUserStatus {
    return value === 'pending' || value === 'approved' || value === 'rejected' || value === 'suspended';
}
