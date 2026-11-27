import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CurrentUserService } from '../../auth/current-user.service';
import { hasVerifiedGlobalAdmin } from '../../auth/platform-role';
import { BackendParish, BackendCommunity, OnboardingApiService } from '../../auth/onboarding-api.service';

@Component({selector:'app-mobile-admin-communities',standalone:true,imports:[FormsModule],template:`
 @if(authorized){
  <h1>Parrocchie e comunità</h1>
  <label class="search"><i class="pi pi-search" aria-hidden="true"></i><input aria-label="Cerca parrocchia" placeholder="Cerca parrocchia" [(ngModel)]="query" type="search" /></label>
  @if(loading){<p role="status">Caricamento parrocchie...</p>}
  @if(error){<p role="alert">{{error}}</p><button type="button" (click)="load()">Riprova</button>}
  @for(parish of filtered;track parish.id){
   <section class="parish"><button class="parish-name" type="button" [attr.aria-expanded]="selected===parish.id" (click)="select(parish.id)"><span><strong>{{parish.name}}</strong>@if(parish.address){<small>{{parish.address}}</small>}</span><i [class]="selected===parish.id?'pi pi-angle-down':'pi pi-angle-right'" aria-hidden="true"></i></button>
    @if(selected===parish.id){<div class="communities">
     @if(communityLoading){<p role="status">Caricamento comunità...</p>}
     @else if(communityError){<p role="alert">{{communityError}}</p><button type="button" (click)="select(parish.id)">Riprova</button>}
     @else{<ul>@for(community of communities;track community.id){<li>{{community.number}}ª Comunità</li>}@empty{<li>Nessuna comunità censita.</li>}</ul>}
    </div>}
   </section>
  }@empty{ @if(!loading&&!error){<p role="status">Nessuna parrocchia trovata.</p>} }
 }@else{<p role="alert">Accesso amministrativo non autorizzato.</p>}
`,styles:[`:host{display:block;min-width:0}h1{font-size:25px;overflow-wrap:anywhere}.search{display:flex;align-items:center;gap:12px;padding:0 12px;background:white;border:1px solid var(--color-divider);border-radius:6px;margin-bottom:20px}.search input{width:100%;min-width:0;min-height:48px;border:0;background:transparent;font:inherit}.parish{border-bottom:1px solid var(--color-divider)}button{min-height:48px;font:inherit;border:0;border-radius:4px;padding:12px;background:var(--color-primary);color:white}.parish-name{display:flex;align-items:center;gap:12px;text-align:left;width:100%;background:white;color:var(--color-text-primary);min-height:72px;border-radius:0}.parish-name>span{flex:1;min-width:0}.parish-name strong,.parish-name small{display:block;overflow-wrap:anywhere}.parish-name small{margin-top:6px;color:var(--color-text-secondary)}.communities{padding:8px 16px;background:var(--color-tint)}ul{list-style:none;padding:0;margin:0}li{padding:14px 0;border-bottom:1px solid var(--color-divider)}p{line-height:1.5;overflow-wrap:anywhere}button:focus-visible,input:focus-visible{outline:3px solid var(--color-focus);outline-offset:2px}`]})
export class MobileAdminCommunities implements OnInit,OnDestroy{
 private readonly current=inject(CurrentUserService);
 private readonly api=inject(OnboardingApiService);
 private generation=0;private destroyed=false;
 protected parishes:BackendParish[]=[];protected communities:BackendCommunity[]=[];
 protected query='';protected selected:number|null=null;protected loading=false;protected communityLoading=false;protected error='';protected communityError='';
 protected get authorized():boolean{return this.current.state()==='ready'&&hasVerifiedGlobalAdmin(this.current.context());}
 protected get filtered():BackendParish[]{const text=this.query.trim().toLocaleLowerCase('it');return this.parishes.filter(p=>p.name.toLocaleLowerCase('it').includes(text));}
 ngOnInit():void{void this.load();}
 ngOnDestroy():void{this.destroyed=true;this.generation++;this.parishes=[];this.communities=[];}
 protected async load():Promise<void>{
  if(!this.authorized||this.destroyed)return;
  this.loading=true;this.error='';
  try{const rows=await this.api.getParishes();if(this.authorized&&!this.destroyed)this.parishes=rows.slice().sort((a,b)=>a.name.localeCompare(b.name,'it'));}
  catch{if(this.authorized&&!this.destroyed)this.error='Parrocchie non disponibili. Riprova.';}
  finally{this.loading=false;}
 }
 protected async select(id:number):Promise<void>{
  if(!this.authorized||this.destroyed)return;
  const generation=++this.generation;this.selected=id;this.communities=[];this.communityLoading=true;this.communityError='';
  try{const rows=await this.api.getCommunities(id);if(this.authorized&&!this.destroyed&&generation===this.generation)this.communities=rows.slice().sort((a,b)=>a.number-b.number);}
  catch{if(this.authorized&&!this.destroyed&&generation===this.generation)this.communityError='Comunità non disponibili. Riprova.';}
  finally{if(generation===this.generation)this.communityLoading=false;}
 }
}
