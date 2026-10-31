import { build } from 'esbuild';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const directory = await mkdtemp(join(tmpdir(), 'eventi-mobile-auth-'));
try {
  const outfile = join(directory, 'checks.cjs');
  await build({ entryPoints: ['tests/mobile-auth.test.ts'], outfile, bundle: true, platform: 'node', format: 'cjs',
    banner: { js: 'globalThis.window = { crypto: { getRandomValues: require("node:crypto").webcrypto.getRandomValues.bind(require("node:crypto").webcrypto) } };' } });
  const result = spawnSync(process.execPath, ['--test', outfile], { stdio: 'inherit' });
  process.exitCode = result.status ?? 1;
} finally { await rm(directory, { recursive: true, force: true }); }
