import '@angular/compiler';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createEnvironmentInjector, runInInjectionContext } from '@angular/core';
import { CommunityMemberInvitation } from '../src/app/features/mobile/community-member-invitation';
import { OnboardingApiService, CreatedInvitation } from '../src/app/auth/onboarding-api.service';
import { CurrentUserService } from '../src/app/auth/current-user.service';
import { memberInvitationAction, CommunityMemberDetail } from '../src/app/services/community-api.service';
import { CurrentUserContext } from '../src/app/auth/current-user-context';

class InvitationHarness extends CommunityMemberInvitation {
  get result() { return this.created; }
  get inviteEmail() { return this.recipient; }
  begin() { this.open(); }
  submit() { return this.create(); }
}
const result = {id:1,invitationUrl:'https://example.test/?inviteId=public-id',mail:{to:'first@example.test',subject:'Invito',body:'Invito'}} as CreatedInvitation;
function harness(invite:()=>Promise<CreatedInvitation>) {
  const injector=createEnvironmentInjector([
    {provide:OnboardingApiService,useValue:{invite}},
    {provide:CurrentUserService,useValue:{context:()=>({communityId:91})}}
  ],null as any);
  const component=runInInjectionContext(injector,()=>new InvitationHarness());
  component.personId=1;component.email='first@example.test';
  return {component,injector};
}
test('changing to Emmanuel clears previous invitation and recipient',async()=>{
  const {component,injector}=harness(async()=>result);
  component.begin();await component.submit();assert.ok(component.result);
  component.personId=15;component.email='emmanuel@example.test';
  (component as any).ngOnChanges?.({personId:{previousValue:1,currentValue:15,firstChange:false}});
  assert.equal(component.result,null,'Previous member invitation must not hide Emmanuel invite button');
  component.begin();assert.equal(component.inviteEmail,'emmanuel@example.test');injector.destroy();
});
test('late invitation result cannot belong to another member',async()=>{
  let resolve!:(value:CreatedInvitation)=>void;
  const {component,injector}=harness(()=>new Promise(r=>resolve=r));
  component.begin();const pending=component.submit();component.personId=15;component.email='emmanuel@example.test';
  (component as any).ngOnChanges?.({personId:{previousValue:1,currentValue:15,firstChange:false}});
  resolve(result);await pending;assert.equal(component.result,null);injector.destroy();
});
test('Emmanuel invitation visibility follows account, permission, pending and email',()=>{
  const actor={authenticated:true,linkedToCommunity:true,communityId:91,role:'RESPONSIBLE',permissions:['EDIT_MEMBRI']} as CurrentUserContext;
  const detail={member:{personId:15,firstName:'Emmanuel',lastName:'Baciarini',role:'MEMBER',email:'emmanuel@example.test'},accountLinked:false,canEdit:true} as CommunityMemberDetail;
  assert.equal(memberInvitationAction(detail,actor),'INVITE');
  assert.equal(memberInvitationAction({...detail,canInvite:true},actor),'INVITE');
  assert.equal(memberInvitationAction({...detail,canInvite:false},actor),'FORBIDDEN');
  assert.equal(memberInvitationAction({...detail,member:{...detail.member,email:''}},actor),'ADD_EMAIL');
  assert.equal(memberInvitationAction({...detail,member:{...detail.member,invitationStatus:'PENDING'}},actor),'PENDING');
  assert.equal(memberInvitationAction({...detail,member:{...detail.member,accountLinked:true}},actor),'ACCOUNT_LINKED');
  assert.equal(memberInvitationAction({...detail,accountLinked:true},actor),'ACCOUNT_LINKED');
  assert.equal(memberInvitationAction(detail,null),'FORBIDDEN');
  assert.equal(memberInvitationAction(detail,{...actor,role:'MEMBER'}),'FORBIDDEN');
});
