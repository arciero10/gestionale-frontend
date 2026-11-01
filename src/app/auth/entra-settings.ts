export const MSAL_CLIENT_ID = '21ee1eae-67e3-4c7c-86ab-db78994d8666';
export const MSAL_TENANT_ID = '069bb457-b363-4340-8086-d7dd3b60a2b5';
export const MSAL_EXTERNAL_TENANT_NAME = 'eventidicomunita';
export const MSAL_AUTHORITY = `https://${MSAL_EXTERNAL_TENANT_NAME}.ciamlogin.com/${MSAL_TENANT_ID}`;
export const IOS_REDIRECT_URI = 'msauth.it.panteleia.eventidicomunita://auth';
export const MOBILE_PACKAGE = 'it.panteleia.eventidicomunita';

export function authPlatform(platform: string): 'web' | 'native' {
  return platform === 'ios' || platform === 'android' ? 'native' : 'web';
}

export function parseMobileUri(value: string): { scheme: string; host: string; path: string; params: URLSearchParams; query: boolean; fragment: boolean } {
  const separator = value.indexOf('://');
  const scheme = value.slice(0, separator);
  if (separator < 1 || !/^[a-z][a-z0-9+.-]*$/i.test(scheme) || /[\u0000-\u0020\u007f\\]/.test(value))
    throw new Error('Invalid mobile URI');
  const remainder = value.slice(separator + 3);
  const authority = remainder.split(/[/?#]/, 1)[0];
  if (!authority || authority.includes('@') || authority.includes(':')) throw new Error('Invalid mobile authority');
  // Chromium 124 treats msauth as an opaque URL. Use its HTTPS parser only to
  // inspect authority/query; never rewrite the registered URI or encoded path.
  const parsed = new URL(`https://${remainder}`);
  if (authority.toLowerCase() !== parsed.hostname) throw new Error('Invalid mobile host');
  return { scheme: scheme.toLowerCase(), host: parsed.hostname,
    path: remainder.slice(authority.length).split(/[?#]/, 1)[0], params: parsed.searchParams,
    query: value.includes('?'), fragment: value.includes('#') };
}

export function validateMobileRedirect(platform: string, value: string): string {
  const url = parseMobileUri(value);
  if (url.query || url.fragment) throw new Error('Invalid redirect');
  if (platform === 'ios' && value === IOS_REDIRECT_URI) return value;
  if (platform === 'android' && url.scheme === 'msauth' && url.host === MOBILE_PACKAGE &&
      url.path.startsWith('/') && /^[A-Za-z0-9+/]{27}=$/.test(decodeURIComponent(url.path.slice(1)))) return value;
  throw new Error('Invalid redirect');
}
