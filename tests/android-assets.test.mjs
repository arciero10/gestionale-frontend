import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { compareAndroidAssetDirectories, verifyAndroidWebAssets } from '../scripts/verify-android-assets.mjs';

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

function matchingFixture(t) {
  const result = fixture(t);
  writeFileSync(join(result.target, 'index.html'), '<script src="main-current.js"></script>');
  writeFileSync(join(result.target, 'main-current.js'), 'app-community-member-invitation');
  return result;
}

test('ignores web association documents in sync and extracted APK comparisons', t => {
  const { root, source, target } = matchingFixture(t);
  for (const file of ['.well-known/apple-app-site-association', '.well-known/apple-app-site-association.json', '.well-known/assetlinks.json', '.well-known/nested/other.json', 'apple-app-site-association', 'apple-app-site-association.json', 'assetlinks.json']) {
    mkdirSync(dirname(join(source, file)), { recursive: true });
    writeFileSync(join(source, file), '{}');
  }
  assert.equal(verifyAndroidWebAssets(root).files, 2);
  assert.deepEqual(compareAndroidAssetDirectories(source, target).mismatches, []);
  // Even a different association file is irrelevant to the packaged application.
  writeFileSync(join(target, 'assetlinks.json'), 'different web deployment');
  assert.deepEqual(compareAndroidAssetDirectories(source, target).mismatches, []);
});

test('still rejects stale main, index and lazy chunks when association files are absent', t => {
  const { root, source, target } = matchingFixture(t);
  mkdirSync(join(source, '.well-known'));
  writeFileSync(join(source, '.well-known/assetlinks.json'), '{}');
  writeFileSync(join(source, 'chunk-current.js'), 'current lazy component');
  writeFileSync(join(target, 'chunk-current.js'), 'old lazy component');
  assert.deepEqual(compareAndroidAssetDirectories(source, target).mismatches, ['chunk-current.js']);
  assert.throws(() => verifyAndroidWebAssets(root), /chunk-current.js/);
  writeFileSync(join(target, 'chunk-current.js'), 'current lazy component');
  writeFileSync(join(target, 'main-current.js'), 'old main with same filename');
  assert.deepEqual(compareAndroidAssetDirectories(source, target).mismatches, ['main-current.js']);
  assert.throws(() => verifyAndroidWebAssets(root), /main-current.js/);
  writeFileSync(join(target, 'main-current.js'), 'app-community-member-invitation');
  writeFileSync(join(target, 'index.html'), 'stale index');
  assert.deepEqual(compareAndroidAssetDirectories(source, target).mismatches, ['index.html']);
  assert.throws(() => verifyAndroidWebAssets(root), /index.html/);
});
