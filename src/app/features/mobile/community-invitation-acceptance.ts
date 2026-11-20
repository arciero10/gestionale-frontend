import { Component, EventEmitter, Output, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Capacitor } from '@capacitor/core';
import { OnboardingApiService } from '../../auth/onboarding-api.service';
import { CurrentUserService } from '../../auth/current-user.service';
import { readAccessInvitation, clearAccessInvitation } from '../../auth/onboarding-invitation';

@Component({selector:'app-community-invitation-acceptance',standalone:true,imports:[FormsModule],styleUrl:'./directory-import.scss',template:`
  <h1>Invito nella comunità</h1>@if(loading){<p role="status">Verifica invito...</p>}
  @if(invitation){<section><h2>{{invitation.communityName}}</h2><p>{{invitation.parishName}}</p><p>{{invitation.firstName}} {{invitation.lastName}}</p><p>Stato: {{invitation.status==='PENDING'?'Da accettare':invitation.status}}</p>
    @if(invitation.status==='PENDING'){<label class="check"><input type="checkbox" [(ngModel)]="privacy" [disabled]="busy" />Ho letto l'informativa privacy per l'accesso alla comunità</label><a href="/privacy" target="_blank" rel="noopener">Informativa privacy</a><button class="primary full" type="button" (click)="accept()" [disabled]="busy||!privacy">Accetta invito</button>}
  </section>}
  @if(error){<p class="feedback error" role="alert">{{error}}</p><button type="button" (click)="load()" [disabled]="busy">Riprova verifica</button>}
  <button type="button" class="full" (click)="leave()" [disabled]="busy">Continua senza invito</button>`})
export class CommunityInvitationAcceptance implements OnInit{
  @Output() readonly dismissed=new EventEmitter<void>();
  private readonly api=inject(OnboardingApiService);private readonly current=inject(CurrentUserService);private readonly router=inject(Router);
  protected invitation:Awaited<ReturnType<OnboardingApiService['invitation']>>|null=null;protected loading=true;protected busy=false;protected error='';protected privacy=false;
  ngOnInit():void{void this.load();}
  protected async load():Promise<void>{this.loading=true;this.error='';try{this.invitation=await this.api.invitation(readAccessInvitation());}catch(error:any){this.error=error?.error?.message??'Invito non disponibile. Chiedi al responsabile di verificarlo.';}finally{this.loading=false;}}
  protected async accept():Promise<void>{if(this.busy||!this.privacy)return;this.busy=true;this.error='';try{await this.api.acceptInvitation(readAccessInvitation(),this.privacy);await this.current.refresh();if(!this.current.context()?.linkedToCommunity)throw new Error();clearAccessInvitation();await this.router.navigateByUrl(Capacitor.isNativePlatform()?'/mobile/complete-profile':'/gestionale-cn/dashboard');}catch(error:any){this.error=error?.error?.message??'Collegamento non confermato. Verifica il tuo profilo prima di riprovare.';}finally{this.busy=false;}}
  protected leave():void{clearAccessInvitation();this.dismissed.emit();}
}
