import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

test('full authentication age is recorded only by SDK sign-in completion, never unlock or refresh', () => {
  const ios=readFileSync(new URL('../native/entra-native-auth/ios/Sources/EntraNativeAuthPlugin/EntraNativeAuthPlugin.swift',import.meta.url),'utf8');
  const android=readFileSync(new URL('../native/entra-native-auth/android/src/main/java/it/panteleia/entranativeauth/EntraNativeAuthPlugin.kt',import.meta.url),'utf8');
  assert.equal((ios.match(/fullAuthentication\.record\(/g)||[]).length,1);
  assert.equal((android.match(/fullAuthentication\.record\(/g)||[]).length,1);
  assert.ok(ios.includes('(1...30).contains(days)'));
  assert.ok(android.includes('require(it in 1..30)'));
});

test('iOS silent token acquisition reuses the configured PCA and private cache', () => {
  const source = readFileSync(new URL('../native/entra-native-auth/ios/Sources/EntraNativeAuthPlugin/EntraNativeAuthPlugin.swift', import.meta.url), 'utf8');
  assert.ok(source.includes('config.cacheConfig.keychainSharingGroup = bundle'));
  assert.ok(source.includes('application.acquireTokenSilent(with: parameters)'));
  assert.ok(source.includes('MSALSilentTokenParameters(scopes: scopes, account: account.account)'));
  assert.doesNotMatch(source, /account\.getAccessToken\(parameters:/);
  assert.ok(source.includes('guard unlocked, UIApplication.shared.applicationState == .active'));
  assert.ok(source.includes('epoch == generation'));
});

test('iOS registers both query schemes required by MSAL 2.17 redirect validation', () => {
  const plist = readFileSync(new URL('../ios/App/App/Info.plist', import.meta.url), 'utf8');
  const queries = plist.match(/<key>LSApplicationQueriesSchemes<\/key>\s*<array>([\s\S]*?)<\/array>/)?.[1];
  assert.ok(queries, 'Missing MSAL query schemes');
  for (const scheme of ['msauthv2', 'msauthv3']) {
    assert.ok(queries.includes(`<string>${scheme}</string>`));
  }
  assert.ok(plist.includes('<string>msauth.it.panteleia.eventidicomunita</string>'));
});
