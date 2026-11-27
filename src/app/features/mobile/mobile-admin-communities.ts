import { Component, ElementRef, ViewChild, effect, inject, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { CurrentUserService } from '../../auth/current-user.service';
import { hasVerifiedGlobalAdmin } from '../../auth/platform-role';
import { AdminCommunitiesApi, AdminParish, AdminCommunity } from './admin-communities-api.service';

interface Editor {kind:'parish'|'community';id:number|null;parishId:number|null;parishName:string;name:string;address:string;number:number;revision?:string;}
@Component({selector:'app-mobile-admin-communities',standalone:true,imports:[FormsModule],templateUrl:'./mobile-admin-communities.html',styleUrl:'./mobile-admin-communities.scss'})
export class MobileAdminCommunities implements OnInit,OnDestroy {
 private readonly current=inject(CurrentUserService);private readonly api=inject(AdminCommunitiesApi);
 @ViewChild('editorDialog',{static:true})private dialog!:ElementRef<HTMLDialogElement>;
 private listGeneration=0;private detailGeneration=0;private destroyed=false;
 private searchTimer:ReturnType<typeof setTimeout>|null=null;
 protected searchChanged():void{if(this.searchTimer)clearTimeout(this.searchTimer);this.searchTimer=setTimeout(()=>{this.searchTimer=null;void this.load();},250);}
 protected parishes:AdminParish[]=[];protected communities:AdminCommunity[]=[];
 protected query='';protected filter='all';protected page=1;protected total=0;
 protected selected:number|null=null;protected selectedParish:AdminParish|null=null;protected nextNumber=1;
 protected loading=false;protected communityLoading=false;protected busy=false;
 protected error='';protected communityError='';protected feedback='';protected saveError='';
 protected editor:Editor|null=null;protected reviewing=false;
 constructor(){effect(()=>{if(!this.authorized){this.dialog?.nativeElement.close();this.editor=null;this.parishes=[];this.communities=[];this.saveError='';}});}
 protected get authorized():boolean{return this.current.state()==='ready'&&hasVerifiedGlobalAdmin(this.current.context());}
 private canApply(actor:number|null|undefined):boolean{return !this.destroyed&&this.authorized&&this.current.context()?.userId===actor;}
 private message(error:unknown,fallback:string):string{
  if(error instanceof HttpErrorResponse){
   if(error.status===401)return 'Sessione non valida. Accedi nuovamente.';
   if(error.status===403)return 'Operazione non autorizzata. Aggiorna il profilo e i permessi.';
   if(error.status===404)return 'Dati non disponibili. Verifica che il backend amministrativo sia attivo e aggiorna l’elenco.';
   if([400,409].includes(error.status)&&typeof error.error?.message==='string')return error.error.message;
  }
  return fallback;
 }
 ngOnInit():void{void this.load();}
 ngOnDestroy():void{if(this.searchTimer)clearTimeout(this.searchTimer);this.destroyed=true;this.listGeneration++;this.detailGeneration++;this.dialog.nativeElement.close();this.editor=null;this.parishes=[];this.communities=[];}
 protected async load(more=false):Promise<void>{
  if(!this.authorized||this.destroyed||(more&&this.loading))return;
  if(this.searchTimer){clearTimeout(this.searchTimer);this.searchTimer=null;}
  const generation=++this.listGeneration,actor=this.current.context()?.userId,page=more?this.page+1:1;
  this.loading=true;this.error='';
  try{const data=await this.api.getParishes(this.query,this.filter,page);if(this.canApply(actor)&&generation===this.listGeneration){this.parishes=more?[...new Map([...this.parishes,...data.items].map(p=>[p.id,p])).values()]:data.items;this.total=data.total;this.page=page;}}
  catch(error){if(this.canApply(actor)&&generation===this.listGeneration)this.error=this.message(error,'Parrocchie non disponibili. Riprova.');}
  finally{if(generation===this.listGeneration)this.loading=false;}
 }
 protected async select(id:number):Promise<void>{
  if(!this.authorized||this.destroyed)return;
  const generation=++this.detailGeneration,actor=this.current.context()?.userId;
  this.selected=id;this.selectedParish=null;this.communities=[];this.communityLoading=true;this.communityError='';
  try{const data=await this.api.getCommunities(id);if(this.canApply(actor)&&generation===this.detailGeneration){this.selectedParish=data.parish;this.communities=data.communities;this.nextNumber=data.nextNumber;}}
  catch(error){if(this.canApply(actor)&&generation===this.detailGeneration)this.communityError=this.message(error,'Comunità non disponibili. Riprova.');}
  finally{if(generation===this.detailGeneration)this.communityLoading=false;}
 }
 protected openParish(parish:AdminParish|null=null):void{this.open({kind:'parish',id:parish?.id??null,parishId:null,parishName:'',name:parish?.name??'',address:parish?.address??'',number:1,revision:parish?.revision});}
 protected openCommunity(community:AdminCommunity|null=null):void{
  if(!this.selectedParish)return;
  this.open({kind:'community',id:community?.id??null,parishId:this.selectedParish.id,parishName:this.selectedParish.name,name:'',address:'',number:community?.number??this.nextNumber,revision:community?.revision});
 }
 private open(editor:Editor):void{if(!this.authorized||this.busy)return;this.editor=editor;this.reviewing=false;this.saveError='';this.dialog.nativeElement.showModal();}
 protected close(event?:Event):void{if(this.busy){event?.preventDefault();return;}this.dialog.nativeElement.close();this.editor=null;this.saveError='';this.reviewing=false;}
 protected review():void{
  if(!this.editor||!this.authorized)return;
  if(this.editor.kind==='parish'&&this.editor.name.trim().length<2){this.saveError='Inserisci il nome della parrocchia.';return;}
  if(this.editor.kind==='community'&&(!Number.isInteger(this.editor.number)||this.editor.number<1||this.editor.number>2147483647)){this.saveError='Inserisci un numero intero positivo valido.';return;}
  this.saveError='';this.reviewing=true;
 }
 protected async save():Promise<void>{
  if(!this.editor||!this.reviewing||!this.authorized||this.busy)return;
  const editor={...this.editor},actor=this.current.context()?.userId;this.busy=true;this.saveError='';
  try{
   let parishId:number;let parishName:string;
   if(editor.kind==='parish'){
    const parish=await this.api.saveParish(editor.id,{name:editor.name.trim(),address:editor.address.trim(),expectedRevision:editor.revision});parishId=parish.id;parishName=parish.name;
   }else{
    await this.api.saveCommunity(editor.parishId!,editor.id,{number:editor.number,expectedRevision:editor.revision});parishId=editor.parishId!;parishName=editor.parishName;
   }
   if(!this.canApply(actor))return;
   this.busy=false;this.close();this.feedback=editor.kind==='parish'?'Parrocchia salvata correttamente.':'Comunità salvata correttamente.';
   this.query=parishName;this.filter='all';await this.load();await this.select(parishId);
  }catch(error){if(this.canApply(actor))this.saveError=this.message(error,'Salvataggio non confermato. I dati compilati restano disponibili: verifica l’elenco prima di riprovare.');}
  finally{this.busy=false;}
 }
}
