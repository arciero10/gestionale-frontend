import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import type {CurrentUserContext} from '../src/app/auth/current-user-context';
import {hasVerifiedGlobalAdmin,communityAssociationNotice} from '../src/app/auth/platform-role';

const context=(values:Partial<CurrentUserContext>={}):CurrentUserContext=>({authenticated:true,linkedToCommunity:false,status:'UNLINKED',userId:null,personId:null,communityId:null,communityMemberId:null,communityName:null,communityNumber:null,parishName:null,role:null,permissions:[],email:null,displayName:null,...values});

test('global UI authorization has no email, localhost, localStorage or TEST hostname bypass',()=>{
  const admin=readFileSync('src/app/features/gestionaleCN/admin/platform-admin.mock.ts','utf8');
  assert.doesNotMatch(admin,/localStorage|isPlatformAdminEmail|GLOBAL_ADMIN_EMAILS|hostname|localhost|testAccess/);
  assert.match(admin,/hasVerifiedGlobalAdmin\(backendUserContext\(\)\)/);
  const app=readFileSync('src/app.ts','utf8');
  const resolver=app.split('private isCurrentGlobalAdmin(): boolean {')[1].split('private readRedirectResult')[0];
  assert.doesNotMatch(resolver,/email|username|idTokenClaims|localStorage/);
  assert.match(resolver,/state\(\) === 'ready'/);
});
test('global administrator is recognized only from the authenticated backend platform role',()=>{
  assert.equal(hasVerifiedGlobalAdmin(context({platformRoles:['GLOBAL_ADMIN']})),true);
  for(const value of [context({role:'GLOBAL_ADMIN'}),context({isOnboardingAdmin:true}),context({permissions:['GLOBAL_ADMIN']}),context(),context({authenticated:false,platformRoles:['GLOBAL_ADMIN']}),context({status:'INACTIVE',platformRoles:['GLOBAL_ADMIN']})])assert.equal(hasVerifiedGlobalAdmin(value),false);
});
test('global administrator without membership has no association warning or invented community',()=>{
  const admin=context({platformRoles:['GLOBAL_ADMIN']});
  assert.equal(communityAssociationNotice(admin),null);assert.equal(admin.communityId,null);assert.equal(admin.role,null);
});
test('existing onboarding capability receives a scoped notice, never a global role',()=>{
  const admin=context({isOnboardingAdmin:true});
  assert.equal(communityAssociationNotice(admin),'Il tuo account deve ancora essere associato a una comunità.');
  assert.equal(hasVerifiedGlobalAdmin(admin),false);
});
test('ordinary unlinked and pending community members retain their exact notices',()=>{
  assert.equal(communityAssociationNotice(context()),'Il tuo account deve ancora essere associato a una comunità.');
  assert.equal(communityAssociationNotice(context({status:'IN_ATTESA_APPROVAZIONE'})),'Richiesta di appartenenza in attesa di approvazione.');
  assert.equal(communityAssociationNotice(context({linkedToCommunity:true,role:'MEMBER'})),null);
});
test('missing and unauthenticated context cannot render an admin association exception',()=>{
  assert.equal(communityAssociationNotice(null),null);assert.equal(communityAssociationNotice(undefined),null);
  assert.equal(communityAssociationNotice(context({authenticated:false,isOnboardingAdmin:true})),null);
  assert.equal(communityAssociationNotice(context({status:'INACTIVE',platformRoles:['GLOBAL_ADMIN']})),'Account non attivo. Contatta l’amministrazione.');
});
