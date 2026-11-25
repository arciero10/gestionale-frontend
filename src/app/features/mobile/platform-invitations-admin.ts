import {Component,inject,OnInit} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {PlatformInvitationsApi} from '../../auth/platform-invitations-api.service';
import {CurrentUserService} from '../../auth/current-user.service';
@Component({selector:'app-platform-invitations-admin',standalone:true,imports:[FormsModule],template:`
@if(authorized){<details><summary>Inviti alla piattaforma</summary><p>Un invito permette solo di presentare la richiesta di appartenenza. Non abilita ruoli. Nessuna email viene inviata.</p>
<form (ngSubmit)="create()" #form="ngForm"><label>Nome<input name="platformFirstName" [(ngModel)]="firstName" required maxlength="100"/></label><label>Cognome<input name="platformLastName" [(ngModel)]="lastName" required maxlength="100"/></label><label>Email destinatario<input name="platformEmail" type="email" email [(ngModel)]="email" required maxlength="256"/></label>
<button type="submit" [disabled]="busy||!form.valid"><i class="pi pi-plus" aria-hidden="true"></i> Prepara invito personale</button></form>
@if(link){<p>Link personale, valido 7 giorni. Conserva il link: non verrà mostrato di nuovo dopo la chiusura.</p><label>Link invito<input [value]="link" readonly/></label><button type="button" (click)="copy()"><i class="pi pi-copy" aria-hidden="true"></i> Copia link</button><button type="button" [disabled]="busy" (click)="revoke()"><i class="pi pi-ban" aria-hidden="true"></i> Revoca invito</button>}
<button type="button" [disabled]="busy" (click)="load()"><i class="pi pi-refresh" aria-hidden="true"></i> Aggiorna inviti</button>
@for(row of rows;track row.id){<article><strong>{{row.firstName}} {{row.lastName}}</strong><p>{{statusLabel(row.status)}}</p>@if(row.status==='PENDING'){<button type="button" [disabled]="busy" (click)="revoke(row.id)"><i class="pi pi-ban" aria-hidden="true"></i> Revoca</button>}</article>}
@if(feedback){<p role="status">{{feedback}}</p>}</details>}`,
styles:[`details{padding:16px 0;border-top:1px solid var(--color-border,#ddd)}summary{min-height:44px;font-weight:600;cursor:pointer}form{display:grid;gap:12px}label{display:grid;gap:6px}input{box-sizing:border-box;width:100%;min-width:0;min-height:48px;padding:10px;border:1px solid #9ba8af;border-radius:6px;font:inherit}button{min-height:48px;margin:8px 8px 8px 0;padding:10px 16px;border:0;border-radius:6px;background:#275b4a;color:white;font:inherit}p{line-height:1.5;overflow-wrap:anywhere}`]})
export class PlatformInvitationsAdmin implements OnInit{
  private readonly api=inject(PlatformInvitationsApi);private readonly current=inject(CurrentUserService);
  protected get authorized():boolean{return this.current.context()?.isOnboardingAdmin===true;}
  protected firstName='';protected lastName='';protected email='';protected link='';protected id='';protected busy=false;protected feedback='';
  protected rows:Awaited<ReturnType<PlatformInvitationsApi['list']>>=[];
  ngOnInit():void{if(this.authorized)void this.load();}
  protected statusLabel(status:string):string{return ({PENDING:'Da accettare',ACCEPTED:'Accettato',EXPIRED:'Scaduto',REVOKED:'Revocato'} as Record<string,string>)[status]??'Da verificare';}
  protected async load():Promise<void>{try{this.rows=await this.api.list();}catch{this.feedback='Elenco inviti piattaforma non disponibile. Verifica attivazione del servizio.';}}
  protected async create():Promise<void>{if(this.busy||!this.authorized)return;this.busy=true;this.link='';this.feedback='';try{const result=await this.api.create(this.firstName.trim(),this.lastName.trim(),this.email.trim());this.link=result.invitationUrl;this.id=result.id;this.feedback='Invito preparato. Nessuna email inviata.';}catch{this.feedback='Invito non creato. Verifica autorizzazione e attivazione del servizio.';}finally{this.busy=false;}}
  protected async copy():Promise<void>{try{await navigator.clipboard.writeText(this.link);this.feedback='Link copiato.';}catch{this.feedback='Seleziona il link per copiarlo.';}}
  protected async revoke(id=this.id):Promise<void>{if(this.busy||!id)return;this.busy=true;try{await this.api.revoke(id);if(this.id===id){this.link='';this.id='';}await this.load();this.feedback='Invito revocato.';}catch{this.feedback='Revoca non confermata. Verifica lo stato del servizio.';}finally{this.busy=false;}}
}
