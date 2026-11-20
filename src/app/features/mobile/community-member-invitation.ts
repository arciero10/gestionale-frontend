import { Component, Input, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { OnboardingApiService, CreatedInvitation } from '../../auth/onboarding-api.service';
import { CurrentUserService } from '../../auth/current-user.service';

@Component({selector:'app-community-member-invitation',standalone:true,imports:[FormsModule],styleUrl:'./directory-import.scss',template:`
  <section><h2>Accesso all'app</h2>
    @if (!opened && !created) { <button type="button" class="primary full" (click)="open()">{{ email || recipient ? "Invita nell'app" : 'Aggiungi email e invita' }}</button> }
    @if (opened) {
      <form #form="ngForm" (ngSubmit)="create()"><label>Email per l'invito<input type="email" name="inviteEmail" [(ngModel)]="recipient" required email maxlength="256" [disabled]="busy" /></label>
      <button type="submit" class="primary full" [disabled]="busy || form.invalid">{{ busy ? 'Preparazione...' : 'Crea invito' }}</button></form>
    }
    @if (created) { <p class="badge" role="status">Invito creato · Email preparata, non inviata</p><p>Condividi il link con il destinatario.</p>
      <label>Link invito<input [value]="created.invitationUrl" readonly /></label><div class="actions"><button type="button" (click)="copy()">Copia link</button><a class="primary" [href]="mailLink">Apri email</a><button type="button" (click)="cancel()" [disabled]="busy">Annulla invito</button></div>
    }
    @if (feedback) { <p role="status">{{ feedback }}</p> }@if (error) { <p class="error feedback" role="alert">{{ error }}</p> }
  </section>`})
export class CommunityMemberInvitation {
  @Input({required:true}) personId!:number;
  @Input() email = '';
  private readonly api=inject(OnboardingApiService); private readonly current=inject(CurrentUserService);
  protected opened=false; protected busy=false; protected recipient=''; protected error=''; protected feedback=''; protected created:CreatedInvitation|null=null;
  protected open():void { this.recipient=this.recipient||this.email; this.opened=true; }
  protected get mailLink():string { const mail=this.created?.mail; return mail ? `mailto:${encodeURIComponent(mail.to)}?subject=${encodeURIComponent(mail.subject)}&body=${encodeURIComponent(mail.body)}` : ''; }
  protected async create():Promise<void> {
    const communityId=this.current.context()?.communityId;if(this.busy||!communityId||!this.recipient.trim())return;
    this.busy=true;this.error='';this.feedback='';
    try { this.created=await this.api.invite(communityId,this.personId,this.recipient.trim());this.opened=false; }
    catch(error:any){this.error=error?.error?.message??'Invito non creato. Verifica email e autorizzazioni.';}finally{this.busy=false;}
  }
  protected async copy():Promise<void>{try{await navigator.clipboard.writeText(this.created!.invitationUrl);this.feedback='Link copiato.';}catch{this.feedback='Copia il link dal campo visibile.';}}
  protected async cancel():Promise<void>{if(!this.created||this.busy)return;this.busy=true;try{await this.api.cancelInvitation(this.created.id);this.created=null;this.feedback='Invito annullato.';}catch{this.error='Impossibile annullare. Riprova.';}finally{this.busy=false;}}
}
