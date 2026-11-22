import { Component, EventEmitter, Output, Input, inject, OnInit, OnChanges, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Capacitor } from '@capacitor/core';
import { OnboardingApiService } from '../../auth/onboarding-api.service';
import { CurrentUserService } from '../../auth/current-user.service';
import { readAccessInvitation } from '../../auth/onboarding-invitation';
import { InvitationDeepLinkService } from '../../auth/invitation-deep-link.service';

@Component({selector:'app-community-invitation-acceptance',standalone:true,imports:[FormsModule],styleUrl:'./directory-import.scss',template:`
  <h2>Invito nella comunità</h2>@if(loading){<p role="status">Stiamo verificando il tuo invito</p>}
  @if(invitation){<section><h2>{{invitation.communityName}}</h2><p>{{invitation.parishName}}</p><p>{{invitation.firstName}} {{invitation.lastName}}</p><p>Stato: {{statusLabel(invitation.status)}}</p>
    @if(invitation.status==='PENDING'){<label class="check"><input type="checkbox" [(ngModel)]="privacy" [disabled]="busy" />Ho letto l'informativa privacy per l'accesso alla comunità</label><a href="/privacy" target="_blank" rel="noopener">Informativa privacy</a><button class="primary full" type="button" (click)="accept()" [disabled]="busy||!privacy">Accetta invito</button>}
  </section>}
  @if(error){<p class="feedback error" role="alert">{{error}}</p><button type="button" (click)="load()" [disabled]="busy">Riprova verifica</button>}
  <button type="button" class="full" (click)="leave()" [disabled]="busy">Continua senza invito</button>`})
export class CommunityInvitationAcceptance implements OnInit, OnChanges, OnDestroy{
  @Input() inviteId='';
  @Output() readonly dismissed=new EventEmitter<void>();
  private readonly api=inject(OnboardingApiService);private readonly current=inject(CurrentUserService);private readonly router=inject(Router);
  private readonly links=inject(InvitationDeepLinkService); private generation=0;
  protected invitation:Awaited<ReturnType<OnboardingApiService['invitation']>>|null=null;protected loading=true;protected busy=false;protected error='';protected privacy=false;
  ngOnInit():void{if(!this.inviteId)void this.load();}
  ngOnChanges():void{if(this.inviteId)void this.load();}
  ngOnDestroy():void{this.generation++;}
  protected statusLabel(status:string):string{return ({PENDING:'Da accettare',EXPIRED:'Invito scaduto',CANCELLED:'Invito annullato',ACCEPTED:'Invito già utilizzato'} as Record<string,string>)[status]??'Invito non disponibile';}
  protected async load():Promise<void>{
    const generation=++this.generation;const id=this.inviteId||readAccessInvitation();this.loading=true;this.busy=false;this.error='';this.privacy=false;this.invitation=null;
    try{const item=await this.api.invitation(id);if(generation!==this.generation)return;this.invitation=item;if(item.status!=='PENDING')this.links.clear();}
    catch(error:any){if(generation===this.generation)this.error=error?.status===403?'Email non corrispondente. Accedi con l’email che ha ricevuto l’invito.':error?.status===404?'Invito non disponibile. Chiedi un nuovo link al responsabile.':'Non è stato possibile verificare l’invito. Riprova.';}
    finally{if(generation===this.generation)this.loading=false;}
  }
  protected async accept():Promise<void>{
    if(this.busy||!this.privacy||this.invitation?.status!=='PENDING')return;
    const generation=this.generation;const id=this.inviteId||readAccessInvitation();this.busy=true;this.error='';
    try{await this.api.acceptInvitation(id,this.privacy);await this.current.refresh();if(generation!==this.generation)return;if(!this.current.context()?.linkedToCommunity)throw new Error();this.links.clear();await this.router.navigateByUrl(Capacitor.isNativePlatform()?this.inviteId?'/mobile/community':'/mobile/complete-profile':'/gestionale-cn/dashboard');}
    catch(error:any){if(generation===this.generation)this.error=error?.status===403?'Email non corrispondente. Usa l’account destinatario.':error?.status===409?'Invito già utilizzato o account già collegato. Verifica lo stato dell’invito.':'Collegamento non confermato. Riprova la verifica.';}
    finally{if(generation===this.generation)this.busy=false;}
  }
  protected leave():void{this.links.clear();this.dismissed.emit();}
}
