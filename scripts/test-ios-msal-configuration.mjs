import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

test('iOS registers both query schemes required by MSAL 2.17 redirect validation', () => {
  const plist = readFileSync(new URL('../ios/App/App/Info.plist', import.meta.url), 'utf8');
  const queries = plist.match(/<key>LSApplicationQueriesSchemes<\/key>\s*<array>([\s\S]*?)<\/array>/)?.[1];
  assert.ok(queries, 'Missing MSAL query schemes');
  for (const scheme of ['msauthv2', 'msauthv3']) {
    assert.ok(queries.includes(`<string>${scheme}</string>`));
  }
  assert.ok(plist.includes('<string>msauth.it.panteleia.eventidicomunita</string>'));
});
