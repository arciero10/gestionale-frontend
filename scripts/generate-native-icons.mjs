// Deterministic native renditions of the original vector behind the web favicon.
// Development tooling only: provide sharp through NODE_PATH; no runtime dependency.
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const sharp = createRequire(import.meta.url)('sharp');
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = readFileSync(join(root, 'public/layout/images/logo/logo-cn.svg'));
async function icon(size, fraction, transparent = false) {
  const symbolSize = Math.round(size * fraction);
  const symbol = await sharp(source, { density: 300 }).resize(symbolSize, symbolSize, { fit: 'contain' }).png().toBuffer();
  return sharp({ create: { width: size, height: size, channels: transparent ? 4 : 3, background: transparent ? '#ffffff00' : '#ffffff' } })
    .composite([{ input: symbol, gravity: 'centre' }]).png().toBuffer();
}
for (const [density, size, foreground] of [['mdpi',48,108],['hdpi',72,162],['xhdpi',96,216],['xxhdpi',144,324],['xxxhdpi',192,432]]) {
  const directory = join(root, 'android/app/src/main/res', `mipmap-${density}`);
  const legacy = await icon(size, .84);
  await sharp(legacy).toFile(join(directory, 'ic_launcher.png'));
  await sharp(legacy).toFile(join(directory, 'ic_launcher_round.png'));
  // The octagonal symbol fits inside the adaptive icon's central 66dp safe circle.
  await sharp(await icon(foreground, 60/108, true)).toFile(join(directory, 'ic_launcher_foreground.png'));
}
await sharp(await icon(1024, .84)).removeAlpha().toFile(join(root, 'ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png'));
console.log('Generated Android adaptive/legacy density assets and opaque 1024px iOS AppIcon from logo-cn.svg.');
