import {build} from 'esbuild';
import {spawnSync} from 'node:child_process';
await build({entryPoints:['tests/mobile-v5.test.ts'],outfile:'dist/mobile-v5-check.cjs',bundle:true,platform:'node',format:'cjs'});
const result=spawnSync(process.execPath,['--test','dist/mobile-v5-check.cjs'],{stdio:'inherit'});
process.exitCode=result.status??1;
