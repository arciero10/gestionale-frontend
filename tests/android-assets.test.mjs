import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { verifyAndroidWebAssets } from '../scripts/verify-android-assets.mjs';

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'eventi-android-assets-'));
  t.after(() => { assert.equal(dirname(root), resolve(tmpdir())); rmSync(root, { recursive: true, force: true }); });
  const source = join(root, 'dist/browser'), target = join(root, 'android/app/src/main/assets/public');
  mkdirSync(source, { recursive: true }); mkdirSync(target, { recursive: true });
  writeFileSync(join(dirname(target), 'capacitor.config.json'), JSON.stringify({ appId: 'it.panteleia.eventidicomunita', webDir: 'dist/browser' }));
  writeFileSync(join(source, 'index.html'), '<script src="main-current.js"></script>');
  writeFileSync(join(source, 'main-current.js'), 'app-community-member-invitation');
  return { root, source, target };
}
test('rejects old Android index even if assembleDebug previously succeeded', t => {
  const { root, target } = fixture(t); writeFileSync(join(target, 'index.html'), '<script src="main-old.js"></script>');
  assert.throws(() => verifyAndroidWebAssets(root), /Android web assets differ/);
});
test('rejects missing or different invitation bundle after a partial sync', t => {
  const { root, source, target } = fixture(t); writeFileSync(join(target, 'index.html'), '<script src="main-current.js"></script>');
  assert.throws(() => verifyAndroidWebAssets(root), /main-current.js/);
  writeFileSync(join(target, 'main-current.js'), 'older-component');
  assert.throws(() => verifyAndroidWebAssets(root), /main-current.js/);
});
test('accepts matching Angular and native assets', t => {
  const { root, target } = fixture(t);
  writeFileSync(join(target, 'index.html'), '<script src="main-current.js"></script>');
  writeFileSync(join(target, 'main-current.js'), 'app-community-member-invitation');
  assert.deepEqual(verifyAndroidWebAssets(root).mainBundles, ['main-current.js']);
});
