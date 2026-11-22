import {build} from 'esbuild';
import {spawnSync} from 'node:child_process';
await build({entryPoints:['tests/auth-completion.test.ts'],outfile:'dist/auth-completion-check.mjs',bundle:true,platform:'node',format:'esm',packages:'external',plugins:[{
  name:'isolate-root-config',setup(build){
    build.onResolve({filter:/mobile-auth\.service$/},()=>({path:'mobile-service',namespace:'test-mobile'}));
    build.onLoad({filter:/.*/,namespace:'test-mobile'},()=>({contents:'export class MobileAuthService {}',loader:'js'}));
    build.onResolve({filter:/^\.\/app\.config$/},()=>({path:'app-config',namespace:'test-config'}));
    build.onLoad({filter:/.*/,namespace:'test-config'},()=>({contents:'export const MSAL_AUTHORITY="https://example.test";',loader:'js'}));
  }
}]});
const result=spawnSync(process.execPath,['--test','dist/auth-completion-check.mjs'],{stdio:'inherit'});
process.exitCode=result.status??1;
