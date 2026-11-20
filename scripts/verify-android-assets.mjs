import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, mkdtempSync, rmSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';

const hash = file => createHash('sha256').update(readFileSync(file)).digest('hex');
function files(root, directory = root) {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? files(root, path) : [relative(root, path)];
  });
}
export function verifyAndroidWebAssets(root) {
  const configFile = join(root, 'android/app/src/main/assets/capacitor.config.json');
  if (!existsSync(configFile)) throw new Error('Capacitor assets missing: run npm run build and npx cap sync android.');
  const config = JSON.parse(readFileSync(configFile, 'utf8'));
  if (!config.webDir || !config.appId) throw new Error('Capacitor webDir/appId missing. Run npx cap sync android.');
  const source = resolve(root, config.webDir), target = join(root, 'android/app/src/main/assets/public');
  if (!existsSync(join(source, 'index.html'))) throw new Error('Angular production build missing: run npm run build.');
  const webFiles = files(source);
  const mismatches = webFiles.filter(file => !existsSync(join(target, file)) || hash(join(source, file)) !== hash(join(target, file)));
  if (mismatches.length) throw new Error(`Android web assets differ from the Angular build (${mismatches.slice(0, 5).join(', ')}). Run npx cap sync android before assembleDebug.`);
  return { appId: config.appId, files: webFiles.length, mainBundles: webFiles.filter(file => /^main-[^/\\]+\.js$/.test(file)), indexHash: hash(join(source, 'index.html')) };
}
export function verifyInstalledApk(root, appId, serial) {
  if (!/^[a-zA-Z0-9_.]+$/.test(appId)) throw new Error('Invalid Android package identifier.');
  const apk = join(root, 'android/app/build/outputs/apk/debug/app-debug.apk');
  if (!existsSync(apk)) throw new Error('Debug APK missing. Run assembleDebug first.');
  const config = JSON.parse(readFileSync(join(root, 'android/app/src/main/assets/capacitor.config.json'), 'utf8'));
  const source = resolve(root, config.webDir);
  const javaHomes = [process.env.JAVA_HOME, process.env.JDK_HOME, process.platform === 'win32' && process.env.ProgramFiles ? join(process.env.ProgramFiles, 'Android/Android Studio/jbr') : null].filter(Boolean);
  const jar = javaHomes.map(home => join(home, 'bin', process.platform === 'win32' ? 'jar.exe' : 'jar')).find(existsSync) || 'jar';
  const temporary = mkdtempSync(join(tmpdir(), 'eventi-apk-assets-'));
  try {
    execFileSync(jar, ['xf', apk, 'assets/public'], { cwd: temporary, stdio: 'pipe' });
    const mismatches = files(source).filter(file => !existsSync(join(temporary, 'assets/public', file)) || hash(join(source, file)) !== hash(join(temporary, 'assets/public', file)));
    if (mismatches.length) throw new Error(`Debug APK does not contain the current Angular build (${mismatches.slice(0, 5).join(', ')}). Run assembleDebug.`);
  } finally {
    if (dirname(temporary) === resolve(tmpdir())) rmSync(temporary, { recursive: true, force: true });
  }
  const sdk = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT || (process.env.LOCALAPPDATA ? join(process.env.LOCALAPPDATA, 'Android/Sdk') : '');
  const adb = process.env.ADB || (sdk ? join(sdk, 'platform-tools', process.platform === 'win32' ? 'adb.exe' : 'adb') : 'adb');
  const device = serial ? ['-s', serial] : [];
  const path = execFileSync(adb, [...device, 'shell', 'pm', 'path', appId], { encoding: 'utf8' }).split(/\r?\n/).find(line => line.startsWith('package:'))?.slice(8).trim();
  if (!path) throw new Error('App is not installed on the selected device.');
  const installedHash = execFileSync(adb, [...device, 'shell', 'sha256sum', path], { encoding: 'utf8' }).trim().split(/\s+/)[0];
  if (installedHash !== hash(apk)) throw new Error(`Installed APK does not match ${apk}. Install this exact file with adb install -r -t, then verify again. App data must not be cleared.`);
  return { installedApkMatches: true, apkHash: installedHash };
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
    const result = verifyAndroidWebAssets(root);
    const serialIndex = process.argv.indexOf('--device');
    console.log(JSON.stringify({ ...result, ...(process.argv.includes('--installed') ? verifyInstalledApk(root, result.appId, serialIndex >= 0 ? process.argv[serialIndex + 1] : undefined) : {}) }));
  } catch (error) { console.error('[Android assets]', error.message); process.exitCode = 1; }
}
