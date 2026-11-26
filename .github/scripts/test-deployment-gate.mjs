import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {verifyProtection, verifyRemote} from './verify-test-environment.mjs';

const fixture = () => ({name:'TEST', can_admins_bypass:false, protection_rules:[{type:'required_reviewers',prevent_self_review:true,reviewers:[{type:'User',reviewer:{id:1}}]}],deployment_branch_policy:{custom_branch_policies:true,protected_branches:false}});
const policies = {total_count:1,branch_policies:[{name:'main',type:'branch'}]};
test('protected TEST main-only environment passes', () => verifyProtection(fixture(), policies));
test('missing or bypassable approvals fail closed', () => {
  for (const change of [{can_admins_bypass:true},{can_admins_bypass:undefined},{name:'PROD'},{protection_rules:[]}])
    assert.throws(() => verifyProtection({...fixture(),...change}, policies));
  const e=fixture(); e.protection_rules[0].prevent_self_review=false;
  assert.throws(() => verifyProtection(e,policies));
});
test('wildcard, tags and extra branches cannot deploy', () => {
  for (const branches of [[{name:'*',type:'branch'}],[{name:'main',type:'tag'}],[...policies.branch_policies,{name:'other',type:'branch'}]])
    assert.throws(() => verifyProtection(fixture(),{total_count:branches.length,branch_policies:branches}));
});
test('push, pull request, other repository or branch cannot reach approval API', async () => {
  for(const patch of [{GITHUB_EVENT_NAME:'push'},{GITHUB_EVENT_NAME:'pull_request'},{GITHUB_REF:'refs/heads/other'},{GITHUB_REPOSITORY:'other/repo'},{GH_TOKEN:''}])
    await assert.rejects(verifyRemote({...context,...patch},()=>{throw new Error('MUST_NOT_FETCH');}),/CONTEXT_INVALID/);
});
const context={GITHUB_EVENT_NAME:'workflow_dispatch',GITHUB_REF:'refs/heads/main',GITHUB_REPOSITORY:'arciero10/gestionale-frontend',GH_TOKEN:'fixture-not-a-real-token'};
test('unsupported plans and unavailable settings block publication', async () => {
  for(const status of [401,403,404,422,500])
    await assert.rejects(verifyRemote(context,async()=>({ok:false,status})),new RegExp(`HTTP_${status}`));
});
test('verified remote settings pass without outputting credentials', async () => {
  let calls=0;
  await verifyRemote(context,async url=>{calls++;return {ok:true,json:async()=>url.endsWith('deployment-branch-policies')?policies:fixture()};});
  assert.equal(calls,2);
});
test('Azure publication is manual-only, environment-protected and separate from CI', () => {
  const workflow=readFileSync(new URL('../workflows/azure-static-web-apps-yellow-coast-0f8a2be10.yml',import.meta.url),'utf8');
  const ci=workflow.split('  ci:')[1].split('  deploy_test:')[0];
  assert.doesNotMatch(ci,/secrets\.|Azure\/|azure\/|action: upload|environment:/);
  assert.match(workflow,/github.event_name == 'workflow_dispatch' && inputs.destination == 'TEST'/);
  assert.match(workflow,/environment: TEST/);
  assert.match(workflow,/cancel-in-progress: false/);
  assert.doesNotMatch(workflow,/pull_request_target|action: "?close|workflow_run|id-token: write/);
});
test('external TestFlight distribution no longer has automatic triggers',()=>{
  const w=readFileSync(new URL('../workflows/testflight-external.yml',import.meta.url),'utf8');
  assert.doesNotMatch(w,/workflow_run:|schedule:|push:/);
  assert.match(w,/inputs.confirm_distribution/);
});
