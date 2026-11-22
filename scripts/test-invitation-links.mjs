import {build} from 'esbuild';
import {spawnSync} from 'node:child_process';
await build({entryPoints:['tests/invitation-links.test.ts'],outfile:'dist/invitation-links-check.cjs',bundle:true,platform:'node',format:'cjs'});
const result=spawnSync(process.execPath,['--test','dist/invitation-links-check.cjs'],{stdio:'inherit'});
process.exitCode=result.status??1;
