export const MSAL_CLIENT_ID = '21ee1eae-67e3-4c7c-86ab-db78994d8666';
export const MSAL_TENANT_ID = '069bb457-b363-4340-8086-d7dd3b60a2b5';
export const MSAL_EXTERNAL_TENANT_NAME = 'eventidicomunita';
export const MSAL_AUTHORITY = `https://${MSAL_EXTERNAL_TENANT_NAME}.ciamlogin.com/${MSAL_TENANT_ID}`;
export const IOS_REDIRECT_URI = 'msauth.it.panteleia.eventidicomunita://auth';
export const MOBILE_PACKAGE = 'it.panteleia.eventidicomunita';

export function authPlatform(platform: string): 'web' | 'native' {
  return platform === 'ios' || platform === 'android' ? 'native' : 'web';
}

export function validateMobileRedirect(platform: string, value: string): string {
  const url = new URL(value);
  if (url.username || url.password || url.port || url.search || url.hash) throw new Error('Invalid redirect');
  if (platform === 'ios' && value === IOS_REDIRECT_URI) return value;
  if (platform === 'android' && url.protocol === 'msauth:' && url.hostname === MOBILE_PACKAGE &&
      /^\/[A-Za-z0-9+/=]+$/.test(decodeURIComponent(url.pathname)) &&
      /^[A-Za-z0-9+/]{27}=$/.test(decodeURIComponent(url.pathname.slice(1)))) return value;
  throw new Error('Invalid redirect');
}
