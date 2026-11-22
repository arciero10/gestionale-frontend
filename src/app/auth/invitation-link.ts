export const INVITATION_ORIGIN = 'https://test.eventidicomunita.it';
export const PUBLIC_INVITATION_ID = /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i;

export function invitationIdFromLocation(path: string, search = ''): string {
  const match = /^\/invite\/([a-f0-9-]+)\/?$/i.exec(path);
  const params = new URLSearchParams(search);
  if (match) return PUBLIC_INVITATION_ID.test(match[1]) && !params.has('inviteId') ? match[1] : '';
  if (path !== '/' && path !== '/invite') return '';
  const values = params.getAll('inviteId');
  return values.length === 1 && PUBLIC_INVITATION_ID.test(values[0]) ? values[0] : '';
}

export function parseInvitationDeepLink(raw: string): string {
  try {
    const url = new URL(raw);
    if (url.origin !== INVITATION_ORIGIN || url.username || url.password || url.hash) return '';
    return invitationIdFromLocation(url.pathname, url.search);
  } catch { return ''; }
}

export function invitationPath(id: string): string {
  return PUBLIC_INVITATION_ID.test(id) ? '/invite/' + id : '';
}
