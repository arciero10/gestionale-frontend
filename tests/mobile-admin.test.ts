import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {postLoginDestination} from '../src/app/auth/post-login-route';
import {hasVerifiedGlobalAdmin} from '../src/app/auth/platform-role';
import {matchesParish, normalizedParishText} from '../src/app/auth/parish-search';
const context:any={authenticated:true,status:'UNLINKED',linkedToCommunity:false,permissions:[],role:null};
test('parish suggestions match name/locality, accents, apostrophes and common saint abbreviations',()=>{
 assert.ok(matchesParish('Santa Maria delle Grazie - Roma','s maria grazie roma'));
 assert.ok(matchesParish("Sant'Agnese",'sant agnese'));
 assert.ok(matchesParish('Gesù a Roma','gesu roma'));
 assert.ok(!matchesParish('Santa Maria - Roma','milano'));
 assert.equal(normalizedParishText('S. Maria'),normalizedParishText('Santa Maria'));
});
test('native onboarding never generates fictitious communities and supports an explicit census request',()=>{
 const page=readFileSync('src/app/features/gestionaleCN/onboarding-comunita/onboarding-comunita.ts','utf8');
 assert.match(page,/mobileRuntime && communityNotListed/);
 assert.match(page,/!mobileRuntime && \(ruoloComunitario === 'responsabile'/);
 assert.match(page,/declaredRoles = COMMUNITY_ONBOARDING_ROLES.slice\(0,3\)/);
 assert.match(page,/filterMatchMode/);
 assert.match(page,/selectedBackendAddress/);
});
test('verified global admin enters mobile administration without a community',()=>{
 assert.equal(postLoginDestination(true,false,hasVerifiedGlobalAdmin({...context,platformRoles:['GLOBAL_ADMIN']})),'/mobile/admin');
});
test('onboarding capability, email and community role cannot grant global access',()=>{
 for(const data of [{isOnboardingAdmin:true},{email:'admin@example.invalid'},{role:'GLOBAL_ADMIN'},{permissions:['GLOBAL_ADMIN']}]){
  assert.equal(postLoginDestination(true,false,hasVerifiedGlobalAdmin({...context,...data})),'/mobile/onboarding');
 }
});
test('ordinary mobile home and web destinations remain unchanged',()=>{
 assert.equal(postLoginDestination(true,true),'/mobile/home');assert.equal(postLoginDestination(false,true),'/gestionale-cn/dashboard');
});
test('mobile admin routes and template deny absent or revoked role',()=>{
 const routes=readFileSync('src/app/features/mobile/mobile.routes.ts','utf8');
 assert.equal((routes.match(/canMatch: \[mobileGlobalAdminGuard\]/g)||[]).length,6);
 assert.match(routes,/current.state\(\) === 'ready' && hasVerifiedGlobalAdmin/);
 const page=readFileSync('src/app/features/mobile/mobile-admin.ts','utf8');assert.match(page,/@if \(authorized\)/);assert.doesNotMatch(page,/HttpClient|localStorage|isOnboardingAdmin/);
});
test('parish administration uses protected API and ignores late responses after logout or parish changes',()=>{
 const page=readFileSync('src/app/features/mobile/mobile-admin-communities.ts','utf8');
 assert.match(page,/this.api.getParishes\(this.query,this.filter,page\)/);assert.match(page,/this.api.getCommunities\(id\)/);
 assert.match(page,/this.canApply\(actor\)&&generation===this.detailGeneration/);
 assert.doesNotMatch(page,/localStorage|\.post\(|\.put\(|mock|fixture/i);
 const routes=readFileSync('src/app/features/mobile/mobile.routes.ts','utf8');assert.ok(routes.indexOf("path: 'admin/communities'")<routes.indexOf("path: 'admin\/:section'"));
});
test('geography writes require review and use revision checks without onboarding-admin grants',()=>{
 const page=readFileSync('src/app/features/mobile/mobile-admin-communities.ts','utf8');
 const api=readFileSync('src/app/features/mobile/admin-communities-api.service.ts','utf8');
 const html=readFileSync('src/app/features/mobile/mobile-admin-communities.html','utf8');
 assert.match(page,/!this.reviewing\|\|!this.authorized\|\|this.busy/);assert.match(page,/expectedRevision:editor.revision/);
 assert.match(api,/apiBaseUrl}\/admin\/parishes/);assert.doesNotMatch(api,/onboarding|AllowAnonymous|isOnboardingAdmin|localStorage/);
 assert.match(html,/Conferma e salva/);assert.match(html,/<dialog/);
});
test('logout awaits native cleanup, never clears server data or all local preferences',()=>{
 const page=readFileSync('src/app/features/mobile/mobile-account-security.ts','utf8');
 assert.match(page,/await this.mobile.logout\(\);await this.router.navigateByUrl/);assert.doesNotMatch(page,/localStorage.clear|sessionStorage.clear|HttpClient/);
});

test('approval queues use global API, explicit decisions and actor/generation checks',()=>{
 const page=readFileSync('src/app/features/mobile/mobile-admin-requests.ts','utf8');
 const api=readFileSync('src/app/features/mobile/admin-requests-api.service.ts','utf8');
 for(const category of ['RESPONSIBLE','CO_RESPONSIBLE','NEW_COMMUNITY','SENZA_APPROVATORE','ALL'])assert.ok(page.includes(category));
 assert.match(page,/hasVerifiedGlobalAdmin/);assert.match(page,/actor===this.current.context\(\)&&generation===this.generation/);
 assert.match(page,/!this.selected\?\.canReview\|\|!this.confirmation/);assert.match(page,/this.rows=\[\];this.parishes=\[\];this.selected=null/);
 assert.match(api,/\/admin\/membership-requests/);assert.doesNotMatch(api,/localStorage|isOnboardingAdmin|Bearer/);
});

test('community role and delegation UI never mutates a global role or stores account data',()=>{
 const page=readFileSync('src/app/features/mobile/mobile-admin-roles.ts','utf8');
 const api=readFileSync('src/app/features/mobile/admin-community-roles-api.service.ts','utf8');
 assert.match(page,/Conferma e salva/);assert.match(page,/this.selected=null;this.delegationData=/);
 assert.match(api,/expectedRevision:member.revision/);assert.match(api,/\/onboarding\/delegations/);
 assert.doesNotMatch(api,/GLOBAL_ADMIN|localStorage|Users/);
 const onboarding=readFileSync('src/app/features/gestionaleCN/onboarding-comunita/onboarding-comunita.ts','utf8');
 assert.match(onboarding,/Area personale provvisoria/);assert.match(onboarding,/SENZA_APPROVATORE/);
 const route=readFileSync('src/app/features/mobile/mobile.routes.ts','utf8');
 assert.doesNotMatch(route,/context\?\.isOnboardingAdmin/);
});
