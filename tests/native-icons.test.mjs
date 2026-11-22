import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
function png(path, size, opaque = false) {
  const bytes = readFileSync(resolve(path));
  assert.equal(bytes.subarray(1,4).toString(), 'PNG');
  assert.equal(bytes.readUInt32BE(16), size);
  assert.equal(bytes.readUInt32BE(20), size);
  if (opaque) assert.ok([0,2,3].includes(bytes[25]), 'iOS icon has no alpha channel');
}
test('Android launcher and adaptive foreground density assets exist with safe-area sizes', () => {
  for (const [density,size,foreground] of [['mdpi',48,108],['hdpi',72,162],['xhdpi',96,216],['xxhdpi',144,324],['xxxhdpi',192,432]]) {
    const base = `android/app/src/main/res/mipmap-${density}/`;
    png(base+'ic_launcher.png',size);png(base+'ic_launcher_round.png',size);png(base+'ic_launcher_foreground.png',foreground);
  }
  for (const name of ['ic_launcher','ic_launcher_round']) {
    const xml=readFileSync(`android/app/src/main/res/mipmap-anydpi-v26/${name}.xml`,'utf8');
    assert.match(xml,/@color\/ic_launcher_background/);assert.match(xml,/@mipmap\/ic_launcher_foreground/);
  }
});
test('iOS universal icon is opaque 1024px and native application identifiers are unchanged', () => {
  const base='ios/App/App/Assets.xcassets/AppIcon.appiconset/';
  const catalog=JSON.parse(readFileSync(base+'Contents.json','utf8'));
  for(const image of catalog.images){assert.equal(image.size,'1024x1024');png(base+image.filename,1024,true);}
  assert.match(readFileSync('android/app/build.gradle','utf8'),/applicationId "it\.panteleia\.eventidicomunita"/);
  assert.match(readFileSync('ios/App/App.xcodeproj/project.pbxproj','utf8'),/PRODUCT_BUNDLE_IDENTIFIER = it\.panteleia\.eventidicomunita;/);
});
