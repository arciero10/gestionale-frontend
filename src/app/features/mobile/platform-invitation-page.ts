import {Component,effect,inject,OnDestroy} from '@angular/core';
import {Router} from '@angular/router';
import {FormsModule} from '@angular/forms';
import {MobileWelcome} from '../../auth/mobile-welcome';
import {MobileAuthService} from '../../auth/mobile-auth.service';
import {AuthService} from '../../auth/auth.service';
import {CurrentUserService} from '../../auth/current-user.service';
import {InvitationDeepLinkService} from '../../auth/invitation-deep-link.service';
import {PlatformInvitationsApi} from '../../auth/platform-invitations-api.service';
import {readPlatformInvitation} from '../../auth/platform-invitation';
@Component({selector:'app-platform-invitation-page',standalone:true,imports:[FormsModule,MobileWelcome],template:`
@if(mobile.native&&!ready()){<app-mobile-welcome [pendingInvitation]="true" (access)="login()"/>}
@else{<main><h1>Invito a Eventi di Comunità</h1>
@if(!ready()){<p>Accedi con l'account Microsoft destinatario, poi riapri il link personale ricevuto.</p><button type="button" (click)="login()">Accedi</button>}
@else{
@if(loading){<p role="status">Verifica invito...</p>}
@if(item){<h2>{{item.firstName}} {{item.lastName}}</h2><p>Stato: {{item.status}}</p><p>L'invito permette di richiedere l'appartenenza, senza assegnare comunità, ruoli o permessi.</p>
@if(item.status==='PENDING'||item.status==='ACCEPTED'){<label><input type="checkbox" [(ngModel)]="confirmed"/>Confermo di voler procedere con il mio invito personale</label><button type="button" [disabled]="busy||!confirmed" (click)="accept()">Continua con la richiesta</button>}}
@if(error){<p role="alert">{{error}}</p><button type="button" [disabled]="busy" (click)="load()">Riprova verifica</button>}
<button type="button" [disabled]="busy" (click)="leave()">Chiudi invito</button>
}</main>}`,styles:[`:host{display:block}main{max-width:560px;min-height:100dvh;box-sizing:border-box;margin:auto;padding:max(24px,env(safe-area-inset-top)) 20px 40px;background:var(--color-surface,#fff);color:var(--color-text-primary,#20252b)}h1{font-size:24px}h2{font-size:20px}p{line-height:1.5;overflow-wrap:anywhere}label{display:flex;gap:12px;align-items:center;min-height:48px;margin:16px 0}button{min-height:48px;padding:12px 18px;border:0;border-radius:6px;background:#275b4a;color:white;font:inherit}button:disabled{opacity:.5}`]})
export class PlatformInvitationPage implements OnDestroy{
  protected readonly mobile=inject(MobileAuthService);private readonly auth=inject(AuthService);private readonly current=inject(CurrentUserService);
  private readonly api=inject(PlatformInvitationsApi);private readonly links=inject(InvitationDeepLinkService);private readonly router=inject(Router);
  protected item:Awaited<ReturnType<PlatformInvitationsApi['inspect']>>|null=null;protected confirmed=false;protected loading=false;protected busy=false;protected error='';private generation=0;
  protected ready():boolean{return this.current.state()==='ready'&&this.current.context()?.authenticated===true;}
  constructor(){effect(()=>{this.links.pendingId();if(this.ready())void this.load();else{this.generation++;this.item=null;this.confirmed=false;}});}
  ngOnDestroy():void{this.generation++;}
  protected login():void{this.auth.login();}
  protected leave():void{this.links.clear();void this.router.navigateByUrl(this.mobile.native?this.current.context()?.linkedToCommunity?'/mobile/home':'/mobile/onboarding':'/');}
  protected async load():Promise<void>{const version=++this.generation;this.item=null;this.confirmed=false;this.error='';const token=readPlatformInvitation();if(!token){this.error='Riapri il link personale ricevuto: il codice non viene salvato sul dispositivo.';return;}this.loading=true;
    try{const item=await this.api.inspect(token);if(version===this.generation&&this.ready())this.item=item;}catch{if(version===this.generation)this.error='Invito non disponibile, servizio non attivo o account non corrispondente. Usa il destinatario corretto.';}finally{if(version===this.generation)this.loading=false;}}
  protected async accept():Promise<void>{if(this.busy||!this.confirmed||!this.ready())return;const version=this.generation;this.busy=true;this.error='';try{await this.api.accept(readPlatformInvitation());if(version!==this.generation)return;this.links.clear();await this.current.refresh();const linked=this.current.context()?.linkedToCommunity===true;await this.router.navigateByUrl(this.mobile.native?linked?'/mobile/home':'/mobile/onboarding':linked?'/gestionale-cn/dashboard':'/gestionale-cn/onboarding-comunita');}catch{this.error='Non è stato possibile confermare l’invito. Riprova la verifica.';}finally{this.busy=false;}}
}
