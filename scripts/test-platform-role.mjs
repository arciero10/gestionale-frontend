import {build} from 'esbuild';
import {spawnSync} from 'node:child_process';
await build({entryPoints:['tests/platform-role.test.ts'],outfile:'dist/platform-role-check.cjs',bundle:true,platform:'node',format:'cjs'});
const result=spawnSync(process.execPath,['--test','dist/platform-role-check.cjs'],{stdio:'inherit'});
process.exitCode=result.status??1;
