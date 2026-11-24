export function profileFailureCode(error: unknown): string {
  const e = error as { status?: unknown; name?: unknown; error?: { profileFailure?: unknown }; profileFailure?: unknown; code?: unknown };
  const kind = e?.error?.profileFailure ?? e?.profileFailure;
  if (['TIMEOUT', 'TLS', 'CONNECTIVITY', 'NETWORK', 'PAYLOAD'].includes(String(kind))) return String(kind);
  if (e?.name === 'TimeoutError') return 'TIMEOUT';
  if (typeof e?.status === 'number' && e.status >= 100 && e.status <= 599) return `HTTP_${e.status}`;
  if (e?.status === 0) return 'NETWORK';
  if (typeof e?.code === 'string' && e.code.startsWith('AUTH_')) return 'TOKEN';
  return 'CLIENT_RESPONSE';
}

// Diagnostic only: decoding is NOT JWT validation and never grants access.
export function apiTokenMetadata(token: string, apiScope: string) {
  try {
    if (token.length > 65536 || token.split('.').length !== 3) throw new Error();
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const claims = JSON.parse(atob(payload.padEnd(Math.ceil(payload.length / 4) * 4, '=')));
    const slash = apiScope.lastIndexOf('/'), resource = apiScope.slice(0, slash), scope = apiScope.slice(slash + 1);
    return { jwt: true, audienceMatches: claims.aud === resource || claims.aud === resource.replace(/^api:\/\//, ''),
      scopePresent: typeof claims.scp === 'string' && claims.scp.split(/\s+/).includes(scope),
      expired: typeof claims.exp === 'number' ? claims.exp <= Date.now() / 1000 : null };
  } catch { return { jwt: false, audienceMatches: null, scopePresent: null, expired: null }; }
}
