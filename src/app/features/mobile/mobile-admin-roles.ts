import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CurrentUserService } from '../../auth/current-user.service';
import { hasVerifiedGlobalAdmin } from '../../auth/platform-role';
import { OnboardingApiService,BackendParish,BackendCommunity } from '../../auth/onboarding-api.service';
import { AdminCommunityRolesApi,ManagedCommunityMember,ManagedDelegations } from './admin-community-roles-api.service';
@Component({selector:'app-mobile-admin-roles',standalone:true,imports:[FormsModule],styleUrl:'./mobile-admin-workflow.scss',template:`
 @if(authorized){
 <h1>Incarichi e deleghe</h1>
 <label>Parrocchia<select aria-label="Parrocchia" [(ngModel)]="parishId" (ngModelChange)="chooseParish()" [disabled]="busy"><option [ngValue]="null">Seleziona parrocchia</option>@for(p of parishes;track p.id){<option [ngValue]="p.id">{{p.name}} · {{p.address}}</option>}</select></label>
 <label>Comunità<select aria-label="Comunità" [(ngModel)]="communityId" (ngModelChange)="load()" [disabled]="busy||!parishId"><option [ngValue]="null">Seleziona comunità</option>@for(c of communities;track c.id){<option [ngValue]="c.id">{{c.number}}ª Comunità</option>}</select></label>
 @if(feedback){<p role="status">{{feedback}}</p>}
 @if(loading){<p>Caricamento...</p>}
 @else{
 @for(member of members;track member.personId){
 <button class="request" type="button" [disabled]="busy||!member.canChange" (click)="edit(member)"><strong>{{member.name}}</strong><span>{{roleLabel(member.role)}}</span><i class="pi pi-angle-right" aria-hidden="true"></i></button>
 }@empty{@if(communityId){<p>Nessun membro attivo nella comunità.</p>}}
 }
 @if(selected;as member){
 <dialog open aria-labelledby="role-title"><h2 id="role-title">{{member.name}}</h2>
 <label>Ruolo comunitario<select aria-label="Ruolo comunitario" [(ngModel)]="role" [disabled]="busy"><option value="MEMBER">Fratello / Sorella</option><option value="RESPONSIBLE">Responsabile</option><option value="CO_RESPONSIBLE">Corresponsabile</option></select></label>
 <label>Motivazione e verifica<textarea [(ngModel)]="reason" maxlength="500" [disabled]="busy"></textarea></label>
 <button type="button" [disabled]="busy||!reason.trim()||role===member.role" (click)="confirm='role'">Verifica modifica ruolo</button>
 @if(member.role==='CO_RESPONSIBLE'){
 <h3>Deleghe operative</h3>
 @for(permission of delegationData.availablePermissions;track permission){
 <label class="permission"><input type="checkbox" [checked]="permissions.includes(permission)" [disabled]="busy" (change)="toggle(permission,$any($event.target).checked)" />{{permissionLabels[permission]||permission}}</label>
 }
 <button type="button" [disabled]="busy" (click)="confirm='delegations'">Verifica deleghe</button>
 }
 @if(confirm){<p>Confermi la modifica di {{confirm==='role'?'ruolo':'deleghe'}} per {{member.name}}?</p><button type="button" [disabled]="busy" (click)="save()">Conferma e salva</button><button type="button" [disabled]="busy" (click)="confirm=null">Annulla modifica</button>}
 <button type="button" [disabled]="busy" (click)="selected=null">Chiudi</button>
 </dialog>
 }
 }@else{<p role="alert">Accesso non autorizzato.</p>}
 `})
export class MobileAdminRoles implements OnInit,OnDestroy{
 private readonly current=inject(CurrentUserService);private readonly onboarding=inject(OnboardingApiService);private readonly api=inject(AdminCommunityRolesApi);
 protected get authorized(){return this.current.state()==='ready'&&hasVerifiedGlobalAdmin(this.current.context());}
 protected parishes:BackendParish[]=[];protected communities:BackendCommunity[]=[];protected parishId:number|null=null;protected communityId:number|null=null;
 protected members:ManagedCommunityMember[]=[];protected selected:ManagedCommunityMember|null=null;
 protected delegationData:ManagedDelegations={availablePermissions:[],members:[]};protected permissions:string[]=[];
 protected role='MEMBER';protected reason='';protected confirm:'role'|'delegations'|null=null;
 protected loading=false;protected busy=false;protected feedback='';private destroyed=false;private generation=0;
 protected readonly permissionLabels:Record<string,string>={APPROVE_MEMBERS:'Approvare Fratelli / Sorelle',EDIT_MEMBRI:'Gestire membri',EDIT_COMUNITA:'Aggiornare comunità',EDIT_CALENDAR:'Gestire calendario',EDIT_AVVISI:'Gestire avvisi',EDIT_GROUPS:'Gestire gruppi',CREATE_CONVIVENZA:'Creare convivenze',EDIT_CONVIVENZA:'Gestire convivenze'};
 private valid(actor:unknown,generation:number){return !this.destroyed&&this.authorized&&actor===this.current.context()&&generation===this.generation;}
 async ngOnInit(){const actor=this.current.context(),generation=++this.generation;try{const rows=await this.onboarding.getParishes();if(this.valid(actor,generation))this.parishes=rows;}catch{this.feedback='Parrocchie non disponibili.';}}
 ngOnDestroy(){this.destroyed=true;this.generation++;this.parishes=[];this.communities=[];this.members=[];this.selected=null;this.delegationData={availablePermissions:[],members:[]};this.permissions=[];this.reason='';}
 protected async chooseParish(){
  const actor=this.current.context(),generation=++this.generation;this.communityId=null;this.communities=[];this.members=[];this.selected=null;this.loading=true;
  try{if(this.parishId){const rows=await this.onboarding.getCommunities(this.parishId);if(this.valid(actor,generation))this.communities=rows;}}
  catch{if(this.valid(actor,generation))this.feedback='Comunità non disponibili.';}finally{if(this.valid(actor,generation))this.loading=false;}
 }
 protected async load(){
  const actor=this.current.context(),generation=++this.generation;this.members=[];this.selected=null;this.feedback='';this.loading=true;
  try{if(this.communityId){const [members,delegations]=await Promise.all([this.api.members(this.communityId),this.api.delegations(this.communityId)]);if(this.valid(actor,generation)){this.members=members;this.delegationData=delegations;}}}
  catch{if(this.valid(actor,generation))this.feedback='Incarichi non disponibili. Riprova.';}finally{if(this.valid(actor,generation))this.loading=false;}
 }
 protected edit(member:ManagedCommunityMember){if(!this.authorized||!member.canChange)return;this.selected=member;this.role=member.role;this.reason='';this.confirm=null;this.permissions=[...(this.delegationData.members.find(x=>x.personId===member.personId)?.permissions||[])];}
 protected toggle(permission:string,checked:boolean){this.permissions=checked?[...new Set([...this.permissions,permission])]:this.permissions.filter(x=>x!==permission);}
 protected async save(){
  if(this.busy||!this.authorized||!this.communityId||!this.selected||!this.confirm||this.confirm==='role'&&!this.reason.trim())return;
  const actor=this.current.context(),generation=this.generation;this.busy=true;
  try{if(this.confirm==='role')await this.api.role(this.communityId,this.selected,this.role,this.reason.trim());else await this.api.saveDelegations(this.communityId,this.selected.personId,this.permissions);
   if(this.valid(actor,generation)){this.selected=null;await this.load();this.feedback='Incarico aggiornato. I nuovi permessi saranno verificati dal backend alla prossima richiesta.';}}
  catch{if(this.valid(actor,generation))this.feedback='Modifica non salvata. Aggiorna e verifica i dati.';}finally{if(!this.destroyed&&actor===this.current.context())this.busy=false;}
 }
 protected roleLabel(role:string){return ({MEMBER:'Fratello / Sorella',RESPONSIBLE:'Responsabile',CO_RESPONSIBLE:'Corresponsabile'} as Record<string,string>)[role]||role;}
}
