const KEY = 'onboarding.invitation';
const ACCESS_KEY = 'community.access-invite';
export function rememberAccessInvitation(id: string): void {
    if (!/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(id)) return;
    try { sessionStorage.setItem(ACCESS_KEY, JSON.stringify({ id, expiresAt: Date.now() + 3600000 })); } catch { /* Never grants access. */ }
}
export function readAccessInvitation(): string {
    try { const item = JSON.parse(sessionStorage.getItem(ACCESS_KEY) ?? 'null');
        return typeof item?.id === 'string' && /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(item.id) && item.expiresAt > Date.now() ? item.id : '';
    } catch { return ''; }
}
export function clearAccessInvitation(): void { try { sessionStorage.removeItem(ACCESS_KEY); } catch { /* UI hint only. */ } }

export function rememberOnboardingInvitation(): void {
    const inviteId = new URLSearchParams(window.location.search).get('inviteId');
    if (inviteId) rememberAccessInvitation(inviteId);
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
