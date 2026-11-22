import { invitationIdFromLocation, invitationPath, PUBLIC_INVITATION_ID } from './invitation-link';
const KEY = 'onboarding.invitation';
const ACCESS_KEY = 'community.access-invite';
export function rememberAccessInvitation(id: string): void {
    if (!PUBLIC_INVITATION_ID.test(id)) return;
    try { sessionStorage.setItem(ACCESS_KEY, JSON.stringify({ id, expiresAt: Date.now() + 3600000 })); } catch { /* Never grants access. */ }
}
export function readAccessInvitation(): string {
    try { const item = JSON.parse(sessionStorage.getItem(ACCESS_KEY) ?? 'null');
        if (typeof item?.id === 'string' && PUBLIC_INVITATION_ID.test(item.id) && typeof item.expiresAt === 'number' && item.expiresAt > Date.now()) return item.id;
        sessionStorage.removeItem(ACCESS_KEY); return '';
    } catch { return ''; }
}
export function clearAccessInvitation(): void { try { sessionStorage.removeItem(ACCESS_KEY); } catch { /* UI hint only. */ } }
export function pendingInvitationRoute(): string { return invitationPath(readAccessInvitation()); }
export function clearSessionPreservingInvitation(): void {
    const pending = readAccessInvitation() ? sessionStorage.getItem(ACCESS_KEY) : null;
    sessionStorage.clear();
    if (pending) sessionStorage.setItem(ACCESS_KEY, pending); // Preserve original one-hour expiry.
}

export function rememberOnboardingInvitation(): void {
    const inviteId = invitationIdFromLocation(window.location.pathname, window.location.search);
    if (inviteId) rememberAccessInvitation(inviteId);
    else if (window.location.pathname.startsWith('/invite/')) clearAccessInvitation();
    const token = new URLSearchParams(window.location.search).get('invitationToken');
    if (!token || !/^[a-f0-9]{64}$/i.test(token)) return;
    try { sessionStorage.setItem(KEY, JSON.stringify({ token, expiresAt: Date.now() + 3600000 })); } catch { /* URL remains usable if session storage is unavailable. */ }
}

export function readOnboardingInvitation(): string {
    try {
        const value: unknown = JSON.parse(sessionStorage.getItem(KEY) ?? 'null');
        if (value && typeof value === 'object') {
            const stored = value as { token?: unknown; expiresAt?: unknown };
            if (typeof stored.token === 'string' && /^[a-f0-9]{64}$/i.test(stored.token) &&
                typeof stored.expiresAt === 'number' && stored.expiresAt > Date.now()) return stored.token;
        }
    } catch { /* No usable invitation. */ }
    return '';
}

export function clearOnboardingInvitation(): void {
    try { sessionStorage.removeItem(KEY); } catch { /* The server remains authoritative. */ }
}
