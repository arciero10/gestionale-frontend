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
  retry() { return this.resend(); }
  get label() { return this.deliveryLabel; }
  get waiting() { return this.busy; }
  get failure() { return this.error; }
  setResult(value:CreatedInvitation) { this.created=value; }
}
const result = {id:1,invitationUrl:'https://example.test/?inviteId=public-id',mail:{to:'first@example.test',subject:'Invito',body:'Invito'}} as CreatedInvitation;
function harness(invite:()=>Promise<CreatedInvitation>,extra:Record<string,unknown>={}) {
  const injector=createEnvironmentInjector([
    {provide:OnboardingApiService,useValue:{invite,...extra}},
    {provide:CurrentUserService,useValue:{context:()=>({communityId:91})}}
  ],null as any);
  const component=runInInjectionContext(injector,()=>new InvitationHarness());
  component.personId=1;component.email='first@example.test';
  return {component,injector};
}
test('changing to Emmanuel clears previous invitation and recipient',async()=>{
  const {component,injector}=harness(async()=>result);
  component.begin();await component.submit();assert.ok(component.result);
  component.personId=15;component.email='embak85@gmail.com';
  (component as any).ngOnChanges?.({personId:{previousValue:1,currentValue:15,firstChange:false}});
  assert.equal(component.result,null,'Previous member invitation must not hide Emmanuel invite button');
  component.begin();assert.equal(component.inviteEmail,'embak85@gmail.com');injector.destroy();
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
  const detail={member:{personId:15,firstName:'Emmanuel',lastName:'Baciarini',role:'MEMBER',email:'embak85@gmail.com',invitationStatus:null},accountLinked:false,canEdit:true,canInvite:true} as CommunityMemberDetail;
  assert.equal(memberInvitationAction(detail,actor),'INVITE');
  assert.equal(memberInvitationAction({...detail,canInvite:true},actor),'INVITE');
  assert.equal(memberInvitationAction({...detail,canInvite:false},actor),'FORBIDDEN');
  assert.equal(memberInvitationAction({...detail,member:{...detail.member,email:''}},actor),'ADD_EMAIL');
  assert.equal(memberInvitationAction({...detail,member:{...detail.member,invitationStatus:'PENDING'}},actor),'PENDING');
  assert.equal(memberInvitationAction({...detail,member:{...detail.member,accountLinked:true}},actor),'ACCOUNT_LINKED');
  assert.equal(memberInvitationAction({...detail,accountLinked:true},actor),'ACCOUNT_LINKED');
  assert.equal(memberInvitationAction({...detail,canInvite:undefined},null),'FORBIDDEN');
  assert.equal(memberInvitationAction({...detail,canInvite:undefined},{...actor,role:'MEMBER'}),'FORBIDDEN');
  assert.equal(memberInvitationAction({...detail,canInvite:undefined},actor),'INVITE');
  for(const status of ['EXPIRED','CANCELLED'])assert.equal(memberInvitationAction({...detail,member:{...detail.member,invitationStatus:status}},actor),'INVITE');
});
test('delivery distinguishes sent failed blocked prepared expired cancelled and linked',()=>{
  const {component,injector}=harness(async()=>result);
  for(const [emailStatus,label] of [['SENT','Invito inviato'],['FAILED','Invito creato, ma email non inviata'],['BLOCKED_BY_TEST_MODE','Invio email bloccato in ambiente TEST.'],['NOT_SENT','Invito creato · Email preparata, non inviata']] as const){
    component.setResult({...result,status:'PENDING',emailStatus});assert.equal(component.label,label);
  }
  for(const [status,label] of [['EXPIRED','Invito scaduto'],['CANCELLED','Invito annullato'],['ACCEPTED','Account collegato']]){component.setResult({...result,status});assert.equal(component.label,label);}
  injector.destroy();
});
test('retry keeps ID loading state and link; failure remains readable',async()=>{
  let resolve!:(x:CreatedInvitation)=>void;let calls=0;
  const {component,injector}=harness(async()=>{throw Error('must not create');},{resendInvitation:(id:number)=>{assert.equal(id,1);calls++;return new Promise(r=>resolve=r);}});
  component.setResult({...result,status:'PENDING',emailStatus:'FAILED'});
  const pending=component.retry();assert.equal(component.waiting,true);await component.retry();assert.equal(calls,1);
  resolve({...result,status:'PENDING',emailStatus:'SENT'});await pending;
  assert.equal(component.label,'Invito inviato');assert.equal(component.result?.invitationUrl,result.invitationUrl);assert.equal(component.waiting,false);
  injector.destroy();
  const broken=harness(async()=>result,{resendInvitation:async()=>{throw {status:500,error:{message:'SECRET_PROVIDER_DETAIL'}};}});
  broken.component.setResult({...result,status:'PENDING',emailStatus:'FAILED'});await broken.component.retry();
  assert.ok(broken.component.failure.includes('Il link resta disponibile'));assert.ok(!broken.component.failure.includes('SECRET'));broken.injector.destroy();
});
