import {build} from 'esbuild';
import {spawnSync} from 'node:child_process';
await build({entryPoints:['tests/member-invitation.test.ts'],outfile:'dist/member-invitation-check.mjs',bundle:true,platform:'node',format:'esm',packages:'external'});
const result=spawnSync(process.execPath,['--test','dist/member-invitation-check.mjs'],{stdio:'inherit'});
process.exitCode=result.status??1;
