import '@angular/compiler';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createEnvironmentInjector, runInInjectionContext, signal} from '@angular/core';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {Router} from '@angular/router';
import {Capacitor} from '@capacitor/core';
import {defer, of, throwError, Subject, Observable} from 'rxjs';
import {CurrentUserService} from '../src/app/auth/current-user.service';
import {AuthService} from '../src/app/auth/auth.service';
import {MobileAuthService} from '../src/app/auth/mobile-auth.service';
import {App} from '../src/app';

const context={authenticated:true,linkedToCommunity:true,communityId:91,permissions:[],status:'LINKED'};

test('post-login global classification uses only a ready backend role, never MSAL email or local profile',()=>{
  const app:any=Object.create(App.prototype);
  const state=signal('ready');
  let backend:any={...context,linkedToCommunity:false,communityId:null,platformRoles:['GLOBAL_ADMIN']};
  Object.assign(app,{currentUser:{state,context:()=>backend},
    authService:{state:()=>{throw new Error('EMAIL_LOOKUP_FORBIDDEN');}},
    injector:{get:()=>{throw new Error('ACCOUNT_EMAIL_LOOKUP_FORBIDDEN');}}});
  assert.equal(app.isCurrentGlobalAdmin(),true);
  for(const value of [{...context,role:'GLOBAL_ADMIN'}, {...context,isOnboardingAdmin:true}, {...context,platformRoles:[]}, {...backend,status:'INACTIVE'}]){
    backend=value;assert.equal(app.isCurrentGlobalAdmin(),false);
  }
  backend={...context,platformRoles:['GLOBAL_ADMIN']};
  for(const value of ['loading','error','disabled']){state.set(value);assert.equal(app.isCurrentGlobalAdmin(),false);}
});

for (const platform of ['ios', 'android', 'web']) test(`${platform} root never exposes protected content during loading or profile/auth errors`, () => {
  const app:any=Object.create(App.prototype);
  const state=signal('ready');
  Object.assign(app,{mobileAuth:{native:platform!=='web',signedIn:()=>app.authenticated()}, authenticated:signal(false),msalReady:signal(true),
    authErrorMessage:signal(null),forceShowOutlet:signal(true),currentPath:signal('/mobile/home'),
    currentUser:{state,context:()=>context}});
  assert.equal(app.canRenderRoute(),false);
  assert.equal(app.showLogin(),true);
  app.msalReady.set(false);assert.equal(app.showLoading(),true);assert.equal(app.canRenderRoute(),false);
  app.msalReady.set(true);app.authErrorMessage.set('Profile failure');
  assert.equal(app.showAuthError(),true);assert.equal(app.canRenderRoute(),false);
  app.currentPath.set('/gestionale-cn/convivenze');
  assert.equal(app.showAuthError(),true);assert.equal(app.canRenderRoute(),false);
  app.currentPath.set('/mobile/home');
  app.authenticated.set(true);assert.equal(app.canRenderRoute(),false);
  app.authErrorMessage.set(null);state.set('error');assert.equal(app.showAuthError(),true);assert.equal(app.canRenderRoute(),false);
  state.set('loading');assert.equal(app.showLoading(),true);assert.equal(app.canRenderRoute(),false);
  state.set('ready');assert.equal(app.canRenderRoute(),true);
  if(platform!=='web') {app.mobileAuth.signedIn=()=>false;assert.equal(app.canRenderRoute(),false);}
  app.currentPath.set('/area-strutture/dashboard');app.authenticated.set(false);state.set('error');
  assert.equal(app.showAuthError(),false);assert.equal(app.canRenderRoute(),true);
});
function profile(t:any, response:()=>Observable<any>) {
  const previous=Capacitor.isNativePlatform;Capacitor.isNativePlatform=()=>true;
  const injector=createEnvironmentInjector([{provide:HttpClient,useValue:{get:response}}],null as any);
  const service=runInInjectionContext(injector,()=>new CurrentUserService());
  t.after(()=>{service.reset();injector.destroy();Capacitor.isNativePlatform=previous;});
  return service;
}
test('native profile automatically retries a completed 503 once; concurrent callers share one request',async t=>{
  let requests=0;
  const service=profile(t,()=>defer(()=>++requests===1?throwError(()=>new HttpErrorResponse({status:503})):of({status:200,body:context})));
  const first=service.load('session');assert.equal(service.load('session'),first);await first;
  assert.equal(requests,2);assert.equal(service.state(),'ready');assert.equal(service.context()?.communityId,91);
});
test('slow profile stays loading without duplicate requests',async t=>{
  const response=new Subject<any>();let requests=0;
  const service=profile(t,()=>{requests++;return response;});const first=service.load('session');
  await new Promise(r=>setTimeout(r,40));assert.equal(service.state(),'loading');assert.equal(service.load('session'),first);
  response.next({status:200,body:context});await first;assert.equal(requests,1);assert.equal(service.state(),'ready');
});
for(const status of [400,401,403,500])test(`HTTP ${status} is a real error, never automatically replayed`,async t=>{
  let requests=0;const service=profile(t,()=>defer(()=>{requests++;return throwError(()=>new HttpErrorResponse({status}));}));
  await service.load('session');assert.equal(requests,1);assert.equal(service.state(),'error');assert.equal(service.context(),null);
  assert.equal(service.failure(),`HTTP_${status}`);
});
test('repeated transient errors are bounded to two attempts',async t=>{
  let requests=0;const service=profile(t,()=>defer(()=>{requests++;return throwError(()=>new HttpErrorResponse({status:503}));}));
  await service.load('session');assert.equal(requests,2);assert.equal(service.state(),'error');
});

test('native transport cancellation is not retried as connectivity failure',async t=>{
  let requests=0;const service=profile(t,()=>defer(()=>{requests++;return throwError(()=>new HttpErrorResponse({status:0,error:{profileFailure:'CANCELLED'}}));}));
  await service.load('session');assert.equal(requests,1);assert.equal(service.failure(),'CANCELLED');assert.equal(service.context(),null);
});

test('manual retry after a 403 uses the same session but verifies profile again',async t=>{
  let requests=0;const service=profile(t,()=>defer(()=>++requests===1?throwError(()=>new HttpErrorResponse({status:403})):of({status:200,body:context})));
  await service.load('session');assert.equal(requests,1);assert.equal(service.context(),null);
  await service.load('session');assert.equal(requests,2);assert.equal(service.state(),'ready');
});

test('background invalidation prevents a late successful profile from granting access',async t=>{
  const response=new Subject<any>();const service=profile(t,()=>response);
  const pending=service.load('old-session');service.reset();response.next({status:200,body:context});await pending;
  assert.equal(service.context(),null);assert.equal(service.state(),'disabled');
});
test('logout cancels a scheduled retry and cannot restore the old profile',async t=>{
  let requests=0;const service=profile(t,()=>defer(()=>{requests++;return throwError(()=>new HttpErrorResponse({status:503}));}));
  const first=service.load('session');service.reset();await first;assert.equal(requests,1);assert.equal(service.context(),null);
});
test('malformed successful profile is not retried or accepted',async t=>{
  let requests=0;const service=profile(t,()=>{requests++;return of({status:200,body:{authenticated:true,linkedToCommunity:true,communityId:0}});});
  await service.load('session');assert.equal(requests,1);assert.equal(service.state(),'error');
  assert.equal(service.failure(),'PAYLOAD');
});
test('native completion is single-flight and cannot navigate after logout',async t=>{
  let release!:()=>void;const gate=new Promise<void>(r=>release=r);let loads=0,navigations=0;
  const mobile={native:true,signedIn:()=>signedIn,sessionKey:'session'};let signedIn=true;
  const current={load:async()=>{loads++;await gate;},state:()=> 'ready',context:()=>context};
  const injector=createEnvironmentInjector([{provide:MobileAuthService,useValue:mobile},{provide:CurrentUserService,useValue:current},{provide:Router,useValue:{navigateByUrl:async()=>{navigations++;return true;}}}],null as any);
  t.after(()=>injector.destroy());const auth=runInInjectionContext(injector,()=>new AuthService());
  const first=auth.loginNative();assert.equal(auth.loginNative(),first);signedIn=false;release();
  await assert.rejects(first,/Sessione cambiata/);assert.equal(loads,1);assert.equal(navigations,0);
});
test('web account resolution waits for initialization and a single redirect completion',async()=>{
  let initialize!:()=>void,redirect!: (result:any)=>void;let callbacks=0,queries=0,routes=0;let account:any=null;
  const init=new Observable<void>(s=>{initialize=()=>{s.next();s.complete();};});
  const callback=new Observable<any>(s=>{callbacks++;redirect=result=>{s.next(result);s.complete();};});
  const msal={initialize:()=>init,handleRedirectObservable:()=>callback,instance:{getAllAccounts:()=>{queries++;return account?[account]:[];},getActiveAccount:()=>account,setActiveAccount:(value:any)=>account=value}};
  const app:any=Object.create(App.prototype);
  Object.assign(app,{injector:{get:()=>msal},msalInitPromise:null,redirectResultPromise:null,authenticated:signal(false),msalReady:signal(false),authErrorMessage:signal(null),router:{url:'/'},getBrowserPath:()=> '/',resolvePostLoginRoute:async()=>{routes++;}});
  const resolving=app.resolveRouteFromMsalAccount('redirect');
  assert.equal(queries,0);initialize();await new Promise(r=>setTimeout(r,0));
  const same=app.readRedirectResult();assert.equal(callbacks,1);assert.equal(queries,0);
  await new Promise(r=>setTimeout(r,4200));assert.equal(queries,0,'No zero-account decision while the callback is still processing');
  // Delayed account is delivered by callback, not obtained through speculative polling.
  redirect({account:{homeAccountId:'test'}});await same;await resolving;
  assert.equal(callbacks,1);assert.equal(queries,1);assert.equal(routes,1);assert.equal(app.authenticated(),true);
});
