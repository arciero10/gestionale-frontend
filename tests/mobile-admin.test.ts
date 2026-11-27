import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {postLoginDestination} from '../src/app/auth/post-login-route';
import {hasVerifiedGlobalAdmin} from '../src/app/auth/platform-role';
const context:any={authenticated:true,status:'UNLINKED',linkedToCommunity:false,permissions:[],role:null};
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
 assert.equal((routes.match(/canMatch: \[mobileGlobalAdminGuard\]/g)||[]).length,3);
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
