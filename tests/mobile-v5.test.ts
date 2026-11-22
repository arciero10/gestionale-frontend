import {test} from 'node:test';
import assert from 'node:assert/strict';
import {MobileNavigationHistory,mobileParent,operationalMobileUrl} from '../src/app/features/mobile/mobile-navigation-history';
import {communityMemberSections} from '../src/app/features/mobile/community-member-sections';
const member=(personId:number,firstName:string,lastName:string,role='MEMBER')=>({personId,firstName,lastName,role});
test('role sections are ordered, complete, alphabetical and deduplicated within each section',()=>{
  const responsible=member(2,'Mario','Rossi','RESPONSIBLE');
  const sections=communityMemberSections([responsible,member(5,'Anna','Verdi','CO_RESPONSIBLE'),member(1,'Luca','Abate','PRESBYTER'),member(4,'Piero','Bianchi','CO_RESPONSIBLE'),member(3,'Paolo','Rossi'),responsible]);
  assert.deepEqual(sections.map(s=>s.title),['Presbitero','Responsabile','Corresponsabili','Fratelli']);
  assert.deepEqual(sections[2].members.map(m=>m.personId),[4,5]);
  assert.deepEqual(sections[3].members.map(m=>m.personId),[1,4,2,3,5]);
  assert.equal(sections[3].members.filter(m=>m.personId===2).length,1);
});
test('empty roles stay absent and no role or person is invented',()=>{
  assert.deepEqual(communityMemberSections([]),[]);
  const sections=communityMemberSections([member(1,'Anna','Rossi')]);assert.deepEqual(sections.map(s=>s.title),['Fratelli']);assert.equal(sections[0].members[0].role,'MEMBER');
});
test('mobile history returns through operational pages, never OTP/root',()=>{
  const history=new MobileNavigationHistory();history.visit('/');history.visit('/mobile/home');history.visit('/mobile/community-life');history.visit('/mobile/community');history.visit('/mobile/community/member/12');
  assert.equal(history.back('/mobile/community/member/12'),'/mobile/community');history.visit('/mobile/community');assert.equal(history.back('/mobile/community'),'/mobile/community-life');
  history.visit('/mobile/home');assert.equal(history.back('/mobile/home'),'/mobile/home');
  for(const url of ['/','/invite/id','/mobile/onboarding','/mobile/home?code=secret','/mobile/home#access_token=secret'])assert.equal(operationalMobileUrl(url),false);
});
test('direct/deep mobile URLs have safe parent destinations',()=>{
  for(const [url,parent] of [['/mobile/community/member/12','/mobile/community'],['/mobile/community','/mobile/community-life'],['/mobile/calendar/7','/mobile/calendario'],['/mobile/calendar/import/8','/mobile/calendario'],['/mobile/community/import/8/row/4','/mobile/community/import/8'],['/mobile/posti-convivenza','/mobile/retreats'],['/mobile/privacy','/mobile/profilo']])assert.equal(mobileParent(url),parent);
  assert.equal(new MobileNavigationHistory().back('/mobile/community/member/12'),'/mobile/community');
});
test('popstate trims existing history and logout discards it',()=>{
  const history=new MobileNavigationHistory();history.visit('/mobile/home');history.visit('/mobile/community-life');history.visit('/mobile/community');history.visit('/mobile/community-life',true);
  assert.equal(history.back('/mobile/community-life'),'/mobile/home');history.reset();assert.equal(history.back('/mobile/calendar/1'),'/mobile/calendario');
});
