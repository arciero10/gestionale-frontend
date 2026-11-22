import { Component, Injector, effect, inject } from '@angular/core';
import { MsalService } from '@azure/msal-angular';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { CommunityInvitationAcceptance } from './community-invitation-acceptance';
import { InvitationDeepLinkService } from '../../auth/invitation-deep-link.service';
import { AuthService } from '../../auth/auth.service';
import { MobileAuthService } from '../../auth/mobile-auth.service';
import { CurrentUserService } from '../../auth/current-user.service';
import { PUBLIC_INVITATION_ID } from '../../auth/invitation-link';
import { MobileWelcome } from '../../auth/mobile-welcome';

@Component({selector:'app-invitation-page',standalone:true,imports:[CommunityInvitationAcceptance,MobileWelcome],template:`
  @if (mobile.native && valid && !ready()) { <app-mobile-welcome [pendingInvitation]="true" (access)="login()" /> }
  @else {
  <main class="invite-page"><div>
    <h1>Invito a Eventi di Comunità</h1>
    @if (!valid) { <p role="alert">Link invito non valido.</p> }
    @else if (ready()) { <app-community-invitation-acceptance [inviteId]="id" (dismissed)="leave()" /> }
    @else { <p role="status">Stiamo verificando il tuo invito</p><p>Accedi con l'email che ha ricevuto l'invito per verificarne lo stato.</p>
      <button type="button" (click)="login()">Accedi a Eventi di Comunità</button><p>L'invito può essere aperto anche nell'app Eventi di Comunità, se installata.</p> }
  </div></main> }`,styles:[`
    :host{display:block}.invite-page{min-height:100dvh;background:#f5f6fa;color:#212529;padding:max(24px,env(safe-area-inset-top)) max(20px,env(safe-area-inset-right)) max(32px,env(safe-area-inset-bottom));font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}.invite-page>div{max-width:560px;margin:auto}h1{font:600 26px Georgia,serif;color:#1f264b;line-height:1.4;letter-spacing:0}p{line-height:1.6;overflow-wrap:anywhere}button{min-height:48px;padding:12px 18px;background:#1f264b;color:white;border:0;border-radius:8px;font:inherit;cursor:pointer}button:focus-visible{outline:3px solid #756021;outline-offset:3px}
  `]})
export class InvitationPage {
  private readonly params = toSignal(inject(ActivatedRoute).paramMap);
  protected readonly mobile = inject(MobileAuthService);
  private readonly auth = inject(AuthService);
  private readonly injector = inject(Injector);
  private readonly current = inject(CurrentUserService);
  private readonly links = inject(InvitationDeepLinkService);
  private readonly router = inject(Router);
  protected get id():string { return this.params()?.get('inviteId') ?? ''; }
  protected get valid():boolean { return PUBLIC_INVITATION_ID.test(this.id); }
  protected ready():boolean {
    if(this.mobile.native)return this.mobile.signedIn();
    this.auth.state(); // Re-evaluate after the root finishes the existing MSAL callback.
    try{return !!this.injector.get(MsalService).instance.getActiveAccount();}catch{return false;}
  }
  constructor(){
    effect(()=>{const id=this.params()?.get('inviteId')??'';if(PUBLIC_INVITATION_ID.test(id))this.links.remember(id);});
  }
  protected login():void { if(this.valid){this.links.remember(this.id);this.auth.login();} }
  protected leave():void { this.links.clear(); void this.router.navigateByUrl(this.mobile.native?this.current.context()?.linkedToCommunity?'/mobile/community':'/mobile/onboarding':'/'); }
}
