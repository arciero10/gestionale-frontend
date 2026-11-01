import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { authPlatform, IOS_REDIRECT_URI, MSAL_AUTHORITY, validateMobileRedirect } from '../src/app/auth/entra-settings';
import { MobileAuthSession, parseMobileCallback } from '../src/app/auth/mobile-auth-core';
import { loadNativeAuthRedirect, NativeAuthConfigError } from '../src/app/auth/native-auth-config';
import { EntraNativeSession, NativeAuthBridge, NativeOutcome, NativeStart, NativeSubmission } from '../src/app/auth/entra-native-core';
import { postLoginDestination } from '../src/app/auth/post-login-route';

test('post-login keeps browser dashboard and selects native home/onboarding by backend linkage', () => {
  assert.equal(postLoginDestination(true, true), '/mobile/home');
  assert.equal(postLoginDestination(true, false), '/mobile/onboarding');
  assert.equal(postLoginDestination(false, true), '/gestionale-cn/dashboard');
  assert.equal(postLoginDestination(false, false), '/gestionale-cn/onboarding-comunita');
});

class SdkMock implements NativeAuthBridge {
  calls: string[] = [];
  cached = false;
  unlocked = false;
  next: NativeOutcome = { step: 'authenticated' };
  input?: NativeStart;
  submission?: NativeSubmission;
  configure = async () => undefined;
  start = async (input: NativeStart) => { this.calls.push('start'); this.input = input; this.cached = true; this.unlocked = this.next.step === 'authenticated'; return this.next; };
  submit = async (submission: NativeSubmission) => { this.submission = submission; this.unlocked = this.next.step === 'authenticated'; return this.next; };
  resend = async () => ({ step: 'code' } as NativeOutcome);
  restore = async () => { this.unlocked = false; return { step: this.cached ? 'unlock' : 'login' } as NativeOutcome; };
  unlock = async () => { this.calls.push('OS-unlock'); assert.ok(this.cached); this.unlocked = true; return { step: 'authenticated' } as NativeOutcome; };
  lock = async () => { this.unlocked = false; };
  cancel = async () => { this.unlocked = false; };
  logout = async () => { this.calls.push('cache-signout'); this.cached = false; this.unlocked = false; };
  getAccessToken = async () => { assert.ok(this.unlocked); return { accessToken: 'api-access-token' }; };
}

test('native password flow uses SDK, exposes only access token and no retained credentials', async () => {
  const sdk = new SdkMock(), session = new EntraNativeSession(sdk);
  await session.start({ flow: 'signin', method: 'password', email: 'user@example.test', password: 'test-only' });
  assert.equal(sdk.input?.flow, 'signin');
  assert.equal(await session.accessToken(), 'api-access-token');
  assert.equal(JSON.stringify(session.outcome).includes('test-only'), false);
  assert.deepEqual(sdk.calls, ['start']);
});
test('native OTP challenge and resend never open a browser', async () => {
  const sdk = new SdkMock(), session = new EntraNativeSession(sdk);
  sdk.next = { step: 'code' };
  await session.start({ flow: 'signin', method: 'otp', email: 'user@example.test' });
  assert.equal(sdk.input?.password, undefined);
  assert.equal(session.signedIn, false);
  await assert.rejects(session.accessToken());
  await session.resend();
  sdk.next = { step: 'authenticated' };
  await session.submit({ code: '000000' });
  assert.ok(session.signedIn);
});
test('native signup follows OTP, password and required attributes', async () => {
  const sdk = new SdkMock(), session = new EntraNativeSession(sdk);
  sdk.next = { step: 'code' };
  await session.start({ flow: 'signup', method: 'password', email: 'user@example.test' });
  sdk.next = { step: 'password' }; await session.submit({ code: '000000' });
  sdk.next = { step: 'attributes', attributes: [{ name: 'givenName', required: true }] };
  await session.submit({ password: 'test-only' });
  assert.equal(session.outcome.attributes?.[0].name, 'givenName');
  sdk.next = { step: 'authenticated' }; await session.submit({ attributes: { givenName: 'Test' } });
  assert.equal(await session.accessToken(), 'api-access-token');
});
test('native password reset completion is not authentication', async () => {
  const sdk = new SdkMock(), session = new EntraNativeSession(sdk);
  sdk.next = { step: 'code' }; await session.start({ flow: 'reset', method: 'otp', email: 'user@example.test' });
  sdk.next = { step: 'password' }; await session.submit({ code: '000000' });
  sdk.next = { step: 'complete' }; await session.submit({ password: 'test-only' });
  assert.equal(session.signedIn, false);
  await assert.rejects(session.accessToken());
});
test('SDK cache restore requires OS unlock before any token access', async () => {
  const sdk = new SdkMock(); sdk.cached = true;
  const session = new EntraNativeSession(sdk);
  assert.equal((await session.restore()).step, 'unlock');
  await assert.rejects(session.accessToken());
  await session.unlock(); assert.equal(await session.accessToken(), 'api-access-token');
  await session.lock(); await assert.rejects(session.accessToken());
  await session.unlock(); await session.logout();
  assert.equal(sdk.cached, false);
  assert.equal((await session.restore()).step, 'login');
});
test('SDK unlock cancellation retains locked state and permits new login', async () => {
  const sdk = new SdkMock(); sdk.cached = true;
  const session = new EntraNativeSession(sdk);
  await session.restore();
  sdk.unlock = async () => { throw new Error('CANCELLED'); };
  await assert.rejects(session.unlock()); assert.equal(session.signedIn, false);
  await session.cancel(); assert.equal(session.outcome.step, 'login');
});
test('only SDK browser-required outcome offers explicit fallback', async () => {
  const sdk = new SdkMock(), session = new EntraNativeSession(sdk);
  sdk.next = { step: 'fallback' };
  await session.start({ flow: 'signin', method: 'password', email: 'user@example.test' });
  assert.equal(session.outcome.step, 'fallback');
  assert.equal(session.signedIn, false);
  assert.deepEqual(sdk.calls, ['start']);
});
test('logout during delayed native sign-in rejects late result', async () => {
  const sdk = new SdkMock(), session = new EntraNativeSession(sdk);
  let complete!: (value: NativeOutcome) => void;
  sdk.start = () => new Promise(resolve => complete = resolve);
  const pending = session.start({ flow: 'signin', method: 'otp', email: 'user@example.test' });
  await session.logout(); complete({ step: 'authenticated' });
  await assert.rejects(pending); assert.equal(session.signedIn, false);
});

const scope = 'api://71a9f6da-a231-4285-b475-37d2e65b8fe1/access_as_user';
const redirect = IOS_REDIRECT_URI;
const androidRedirect = 'msauth://it.panteleia.eventidicomunita/JZgztu6QTut3eSpu8X%2F%2FiyoHt%2Fg%3D';

function configFetch(value: unknown, status = 200): typeof fetch {
  return (async () => new Response(JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json' } })) as typeof fetch;
}

test('Android loads native-auth.json relative to document base URI and preserves encoded redirect', async () => {
  let requested = '';
  const request: typeof fetch = async (url, options) => {
    requested = String(url); assert.equal(options?.cache, 'no-store');
    return new Response(JSON.stringify({ androidRedirectUri: androidRedirect }));
  };
  assert.equal(await loadNativeAuthRedirect('android', 'https://localhost/', request), androidRedirect);
  assert.equal(requested, 'https://localhost/native-auth.json');
  await loadNativeAuthRedirect('android', 'https://app.example/nested/', request);
  assert.equal(requested, 'https://app.example/nested/native-auth.json');
});

test('opaque custom-scheme URL parser from Chromium 124 cannot reject valid Android redirect', async () => {
  const OriginalURL = globalThis.URL;
  class Chromium124URL extends OriginalURL {
    constructor(value: string | URL, base?: string | URL) {
      if (String(value).startsWith('msauth://')) {
        super('https://opaque.invalid');
        Object.defineProperty(this, 'hostname', { value: '' });
        Object.defineProperty(this, 'pathname', { value: String(value).slice('msauth:'.length) });
      } else super(value, base);
    }
  }
  globalThis.URL = Chromium124URL;
  try {
    assert.equal(new URL(androidRedirect).hostname, '');
    assert.equal(validateMobileRedirect('android', androidRedirect), androidRedirect);
    assert.equal(await loadNativeAuthRedirect('android', 'https://localhost/', configFetch({ androidRedirectUri: androidRedirect })), androidRedirect);
    assert.equal(parseMobileCallback(`${androidRedirect}?code=verified&state=expected`, androidRedirect, 'expected'), 'verified');
  } finally { globalThis.URL = OriginalURL; }
});

test('missing Android redirect is classified separately from malformed asset, HTTP and invalid URI', async () => {
  for (const value of [{}, { androidRedirectUri: '' }, { androidRedirectUri: null }])
    await assert.rejects(loadNativeAuthRedirect('android', 'https://localhost/', configFetch(value)),
      (error: unknown) => error instanceof NativeAuthConfigError && error.reason === 'redirect-missing');
  await assert.rejects(loadNativeAuthRedirect('android', 'https://localhost/', configFetch(null)),
    (error: unknown) => error instanceof NativeAuthConfigError && error.reason === 'asset-shape');
  await assert.rejects(loadNativeAuthRedirect('android', 'https://localhost/', configFetch({}, 404)),
    (error: unknown) => error instanceof NativeAuthConfigError && error.reason === 'asset-http');
  await assert.rejects(loadNativeAuthRedirect('android', 'https://localhost/', configFetch({ androidRedirectUri: 'msauth://wrong/hash' })),
    (error: unknown) => error instanceof NativeAuthConfigError && error.reason === 'redirect-invalid');
  await assert.rejects(loadNativeAuthRedirect('android', 'https://localhost/', configFetch({ androidRedirectUri: 123 })),
    (error: unknown) => error instanceof NativeAuthConfigError && error.reason === 'redirect-invalid');
});

test('iOS keeps its registered redirect and capacitor asset origin', async () => {
  let requested = '';
  assert.equal(await loadNativeAuthRedirect('ios', 'capacitor://localhost/', async url => {
    requested = String(url); return new Response('{}');
  }), IOS_REDIRECT_URI);
  assert.equal(requested, 'capacitor://localhost/native-auth.json');
});

function fixture(result: Record<string, unknown> = { access_token: 'api-access', id_token: 'not-a-bearer', token_type: 'Bearer', expires_in: '3600', refresh_token: 'refresh' }) {
  let opened = '', exchanges = 0, lastBody = '', closes = 0;
  const session = new MobileAuthSession({
    open: async url => { opened = url; }, close: async () => { closes++; }, changed: () => {},
    request: async (url, method, body) => {
      if (method === 'GET') return { authorization_endpoint: `${MSAL_AUTHORITY}/oauth2/v2.0/authorize`, token_endpoint: `${MSAL_AUTHORITY}/oauth2/v2.0/token` };
      exchanges++; lastBody = body!; return result;
    }
  }, redirect, scope);
  async function start() {
    const login = session.login();
    // Attach a handler immediately so expected failures are never unhandled.
    void login.catch(() => undefined);
    for (let i = 0; i < 100 && !opened; i++) await new Promise(r => setTimeout(r, 2));
    assert.ok(opened);
    return { login, url: new URL(opened) };
  }
  return { session, start, exchanges: () => exchanges, body: () => new URLSearchParams(lastBody), closes: () => closes };
}

test('platform selection preserves browser and selects both native platforms', () => {
  assert.equal(authPlatform('web'), 'web'); assert.equal(authPlatform('ios'), 'native'); assert.equal(authPlatform('android'), 'native');
});
test('real redirect config required; Android never accepts missing or dummy hash', () => {
  assert.equal(validateMobileRedirect('ios', redirect), redirect);
  for (const value of ['', 'msauth://it.panteleia.eventidicomunita/CHANGE_ME', 'https://evil.example'])
    assert.throws(() => validateMobileRedirect('android', value));
});
test('callback URI, state, code and duplicate parameters are checked', () => {
  assert.equal(parseMobileCallback(`${redirect}?code=abc&state=expected`, redirect, 'expected'), 'abc');
  for (const url of [`${redirect}?code=abc&state=other`, `${redirect}?code=abc`, `${redirect}?code=abc&code=x&state=expected`,
    `${redirect}?code=abc&state=expected&state=expected`, `${redirect}/wrong?code=abc&state=expected`, 'https://evil.example?code=x&state=expected'])
    assert.throws(() => parseMobileCallback(url, redirect, 'expected'));
});
test('PKCE S256 lifecycle; exchange once; API bearer is access token only', async () => {
  const f = fixture(), { login, url } = await f.start();
  assert.equal(url.searchParams.get('response_type'), 'code');
  assert.equal(url.searchParams.get('code_challenge_method'), 'S256');
  assert.ok(url.searchParams.get('scope')?.includes(scope));
  const callback = `${redirect}?code=authorization-code&state=${url.searchParams.get('state')}`;
  await Promise.all([f.session.callback(callback), f.session.callback(callback)]); await login;
  assert.equal(f.exchanges(), 1);
  assert.equal(createHash('sha256').update(f.body().get('code_verifier')!).digest('base64url'), url.searchParams.get('code_challenge'));
  assert.equal(await f.session.accessToken(), 'api-access');
  assert.ok(f.closes() > 0); f.session.logout();
  assert.equal(f.session.signedIn, false); await assert.rejects(f.session.accessToken());
  await f.session.callback(callback); assert.equal(f.exchanges(), 1);
});
test('wrong state cannot reach the token endpoint', async () => {
  const f = fixture(), { login } = await f.start();
  await f.session.callback(`${redirect}?code=x&state=wrong`);
  await assert.rejects(login); assert.equal(f.exchanges(), 0); assert.equal(f.session.signedIn, false);
});
test('ID token alone cannot become an API bearer', async () => {
  const f = fixture({ id_token: 'id-only', token_type: 'Bearer', expires_in: '3600' }), { login, url } = await f.start();
  await f.session.callback(`${redirect}?code=x&state=${url.searchParams.get('state')}`);
  await assert.rejects(login); assert.equal(f.session.signedIn, false); await assert.rejects(f.session.accessToken());
});
test('logout clears pending PKCE and ignores late callback', async () => {
  const f = fixture(), { login, url } = await f.start(); f.session.logout();
  await assert.rejects(login); await f.session.callback(`${redirect}?code=x&state=${url.searchParams.get('state')}`);
  assert.equal(f.exchanges(), 0); assert.equal(f.session.signedIn, false);
});
test('expired access token uses refresh and concurrent API calls share one exchange', async () => {
  const f = fixture({ access_token: 'access', token_type: 'Bearer', expires_in: '1', refresh_token: 'refresh' });
  const { login, url } = await f.start(); await f.session.callback(`${redirect}?code=x&state=${url.searchParams.get('state')}`); await login;
  const tokens = await Promise.all([f.session.accessToken(), f.session.accessToken()]);
  assert.deepEqual(tokens, ['access', 'access']); assert.equal(f.exchanges(), 2);
  assert.equal(f.body().get('grant_type'), 'refresh_token'); f.session.logout();
});
test('no refresh token means expired session, not ID-token fallback', async () => {
  const f = fixture({ access_token: 'short', id_token: 'id', token_type: 'Bearer', expires_in: '1' });
  const { login, url } = await f.start(); await f.session.callback(`${redirect}?code=x&state=${url.searchParams.get('state')}`); await login;
  await assert.rejects(f.session.accessToken()); assert.equal(f.session.signedIn, false);
});

test('logout during token exchange cannot resurrect the session', async () => {
  let opened = '', exchangeStarted = false;
  let respond!: (value: unknown) => void;
  const response = new Promise(resolve => { respond = resolve; });
  const session = new MobileAuthSession({
    open: async url => { opened = url; }, close: async () => {}, changed: () => {},
    request: async (_url, method) => {
      if (method === 'GET') return { authorization_endpoint: `${MSAL_AUTHORITY}/oauth2/v2.0/authorize`, token_endpoint: `${MSAL_AUTHORITY}/oauth2/v2.0/token` };
      exchangeStarted = true; return response;
    }
  }, redirect, scope);
  const login = session.login(); void login.catch(() => undefined);
  for (let i = 0; i < 100 && !opened; i++) await new Promise(r => setTimeout(r, 2));
  const callback = session.callback(`${redirect}?code=x&state=${new URL(opened).searchParams.get('state')}`);
  for (let i = 0; i < 100 && !exchangeStarted; i++) await new Promise(r => setTimeout(r, 2));
  assert.ok(exchangeStarted); session.logout();
  respond({ access_token: 'late', token_type: 'Bearer', expires_in: '3600' });
  await callback; await assert.rejects(login); assert.equal(session.signedIn, false);
});
