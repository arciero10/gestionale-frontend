const KEY = 'onboarding.invitation';

export function rememberOnboardingInvitation(): void {
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
