import { IOS_REDIRECT_URI, validateMobileRedirect } from './entra-settings';

export class NativeAuthConfigError extends Error {
  constructor(readonly reason: 'asset-url' | 'asset-request' | 'asset-http' | 'asset-json' | 'asset-shape' | 'redirect-missing' | 'redirect-invalid') { super(reason); }
}

export async function loadNativeAuthRedirect(platform: string, baseURI: string, request: typeof fetch = fetch): Promise<string> {
  let url: string;
  try { url = new URL('native-auth.json', baseURI).href; }
  catch { throw new NativeAuthConfigError('asset-url'); }
  let response: Response;
  try { response = await request(url, { cache: 'no-store' }); }
  catch { throw new NativeAuthConfigError('asset-request'); }
  if (!response.ok) throw new NativeAuthConfigError('asset-http');
  let config: unknown;
  try { config = await response.json(); }
  catch { throw new NativeAuthConfigError('asset-json'); }
  if (!config || typeof config !== 'object' || Array.isArray(config)) throw new NativeAuthConfigError('asset-shape');
  const value = platform === 'ios' ? IOS_REDIRECT_URI : (config as Record<string, unknown>)['androidRedirectUri'];
  if (value == null || value === '') throw new NativeAuthConfigError('redirect-missing');
  if (typeof value !== 'string') throw new NativeAuthConfigError('redirect-invalid');
  try { return validateMobileRedirect(platform, value); }
  catch { throw new NativeAuthConfigError('redirect-invalid'); }
}
