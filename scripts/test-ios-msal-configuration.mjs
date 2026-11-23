import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

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
