import '@angular/compiler';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createEnvironmentInjector,runInInjectionContext,NgZone} from '@angular/core';
import {Router} from '@angular/router';
import {InvitationDeepLinkService,INVITATION_LINK_PLATFORM} from '../src/app/auth/invitation-deep-link.service';
import {parseInvitationDeepLink,invitationIdFromLocation,invitationPath} from '../src/app/auth/invitation-link';
import {rememberAccessInvitation,readAccessInvitation,clearSessionPreservingInvitation,pendingInvitationRoute} from '../src/app/auth/onboarding-invitation';

const id='aaaaaaaa-1234-4321-8123-aaaaaaaaaaaa', second='bbbbbbbb-1234-4321-8123-bbbbbbbbbbbb';
test('SWA AASA MIME rewrite has matching extensionless and JSON assets',()=>{
  const config=JSON.parse(readFileSync('staticwebapp.config.json','utf8'));
  const route=config.routes.find((r:any)=>r.route==='/.well-known/apple-app-site-association');
  assert.equal(route.rewrite,'/.well-known/apple-app-site-association.json');
  assert.deepEqual(JSON.parse(readFileSync('public'+route.route,'utf8')),JSON.parse(readFileSync('public'+route.rewrite,'utf8')));
});
function storage(){const map=new Map<string,string>();Object.defineProperty(globalThis,'sessionStorage',{configurable:true,value:{getItem:(k:string)=>map.get(k)??null,setItem:(k:string,v:string)=>map.set(k,v),removeItem:(k:string)=>map.delete(k),clear:()=>map.clear()}});return map;}
test('only trusted HTTPS host and canonical or unambiguous legacy IDs are accepted',()=>{
  assert.equal(parseInvitationDeepLink(`https://test.eventidicomunita.it/invite/${id}`),id);
  assert.equal(parseInvitationDeepLink(`https://test.eventidicomunita.it/?inviteId=${id}`),id);
  assert.equal(invitationIdFromLocation(`/invite/${id}`),id);
  for(const raw of [`https://evil.example/invite/${id}`,`http://test.eventidicomunita.it/invite/${id}`,`https://test.eventidicomunita.it:444/invite/${id}`,`https://user@ test.eventidicomunita.it/invite/${id}`,`https://user:pass@test.eventidicomunita.it/invite/${id}`,`https://test.eventidicomunita.it/other/${id}`,`https://test.eventidicomunita.it/invite/not-a-guid`,`https://test.eventidicomunita.it/?inviteId=${id}&inviteId=${second}`,`https://test.eventidicomunita.it/invite/${id}?inviteId=${second}`,`https://test.eventidicomunita.it/invite/${id}#token=secret`,`msauth://it.panteleia.eventidicomunita/callback`])assert.equal(parseInvitationDeepLink(raw),'',raw);
  assert.equal(invitationPath('bad'),'');
});
test('pending public ID survives auth cleanup without retaining auth state or extending TTL',()=>{
  storage();rememberAccessInvitation(id);const raw=sessionStorage.getItem('community.access-invite');sessionStorage.setItem('auth-secret','fake');
  clearSessionPreservingInvitation();assert.equal(sessionStorage.getItem('auth-secret'),null);assert.equal(sessionStorage.getItem('community.access-invite'),raw);
  assert.equal(pendingInvitationRoute(),`/invite/${id}`);
  sessionStorage.setItem('community.access-invite',JSON.stringify({id,expiresAt:Date.now()-1}));assert.equal(readAccessInvitation(),'');assert.equal(sessionStorage.getItem('community.access-invite'),null);
});
test('cold start and warm appUrlOpen use one listener, ignore auth callbacks and clear pending',async()=>{
  storage();let callback!:(url:string)=>void;let listens=0;const paths:string[]=[];
  const router={url:'/',navigateByUrl:async(path:string)=>{router.url=path;paths.push(path);return true;}};
  const injector=createEnvironmentInjector([
    {provide:Router,useValue:router},{provide:NgZone,useValue:{run:(fn:()=>unknown)=>fn()}},
    {provide:INVITATION_LINK_PLATFORM,useValue:{native:true,listen:async(fn:any)=>{listens++;callback=fn;},launch:async()=>({url:`https://test.eventidicomunita.it/invite/${id}`})}}
  ],null as any);
  const service=runInInjectionContext(injector,()=>new InvitationDeepLinkService());
  await service.initialize();await service.initialize();assert.equal(listens,1);assert.equal(readAccessInvitation(),id);assert.deepEqual(paths,[`/invite/${id}`]);
  callback(`https://test.eventidicomunita.it/invite/${id}`);await Promise.resolve();assert.equal(paths.length,1);
  callback(`https://test.eventidicomunita.it/invite/${second}`);await Promise.resolve();assert.equal(readAccessInvitation(),second);assert.equal(router.url,`/invite/${second}`);
  assert.equal(await service.handle('msauth://it.panteleia.eventidicomunita/callback'),false);assert.equal(paths.length,2);
  service.clear();assert.equal(readAccessInvitation(),'');assert.equal(service.pendingId(),'');injector.destroy();
});
