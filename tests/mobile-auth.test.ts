import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { authPlatform, IOS_REDIRECT_URI, MSAL_AUTHORITY, validateMobileRedirect } from '../src/app/auth/entra-settings';
import { MobileAuthSession, parseMobileCallback } from '../src/app/auth/mobile-auth-core';

const scope = 'api://71a9f6da-a231-4285-b475-37d2e65b8fe1/access_as_user';
const redirect = IOS_REDIRECT_URI;

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
