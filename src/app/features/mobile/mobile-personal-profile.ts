import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommunityApiService, OwnCommunityProfile } from '../../services/community-api.service';
import { CurrentUserService } from '../../auth/current-user.service';

export function dismissProfilePrompt(userId: number | null | undefined): void { if(!userId)return;try{localStorage.setItem('community.profile-prompted:'+userId,'1');}catch{/* UI preference only. */} }
@Component({selector:'app-mobile-personal-profile',standalone:true,imports:[FormsModule,RouterLink],styleUrl:'./mobile-community.scss',template:`
  <a class="back" routerLink="/mobile/home"><i class="pi pi-arrow-left" aria-hidden="true"></i>Home</a><h1>Completa il tuo profilo</h1><p class="muted">I campi sono facoltativi. Puoi completarli anche più tardi.</p>
  @if(loading){<p role="status">Caricamento profilo...</p>}
  @if(profile;as person){<form class="member-form" #form="ngForm" (ngSubmit)="save()">
    <header class="profile-head"><span class="avatar">@if(preview || person.photoUrl){<img [src]="preview || person.photoUrl" alt="Foto profilo" referrerpolicy="no-referrer" (error)="person.photoUrl = null; clearPreview()" />}@else{ {{person.firstName.charAt(0)}}{{person.lastName.charAt(0)}} }</span><strong>{{person.firstName}} {{person.lastName}}</strong></header>
    <label>{{person.photoUrl || preview ? 'Cambia foto' : 'Carica foto'}}<input type="file" accept="image/jpeg,image/png,image/webp" (change)="selectPhoto($event)" [disabled]="busy" /></label>
    @if(person.photoUrl || preview){<button type="button" class="secondary" (click)="remove()" [disabled]="busy">Rimuovi foto</button>}
    @if(photoNotice){<p role="status">{{photoNotice}}</p>}
    <label>Telefono opzionale<input name="phone" type="tel" [(ngModel)]="person.phone" maxlength="32" [disabled]="busy" /></label>
    <label>Email personale opzionale<input name="email" type="email" email [(ngModel)]="person.email" maxlength="256" [disabled]="busy" /></label>
    <small>L'email personale non cambia l'identità di accesso Microsoft.</small>
    <label>Data di nascita opzionale<input name="birthDate" type="date" [(ngModel)]="person.birthDate" min="1900-01-01" [max]="today" [disabled]="busy" /></label>
    <a class="back" routerLink="/mobile/privacy">Preferenze notifiche</a>
    <button class="primary" type="submit" [disabled]="busy || form.invalid">{{busy?'Salvataggio...':'Salva profilo'}}</button>
  </form>}
  @if(error){<p class="feedback" role="alert">{{error}}</p><button class="secondary" type="button" (click)="load()" [disabled]="busy">Riprova caricamento</button>}
  <button class="secondary" type="button" (click)="later()" [disabled]="busy">Completa più tardi</button>`})
export class MobilePersonalProfile implements OnInit,OnDestroy{
  private readonly api=inject(CommunityApiService);private readonly current=inject(CurrentUserService);private readonly router=inject(Router);
  protected profile:OwnCommunityProfile|null=null;protected busy=false;protected loading=true;protected error='';protected preview='';protected photoNotice='';private removePhoto=false;
  protected get today():string{const now=new Date();return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;}
  ngOnInit():void{void this.load();}ngOnDestroy():void{this.clearPreview();}
  protected async load():Promise<void>{this.loading=true;this.error='';try{this.profile=await this.api.getProfile();}catch{this.error='Profilo non disponibile. Riprova.';}finally{this.loading=false;}}
  protected clearPreview():void{if(this.preview)URL.revokeObjectURL(this.preview);this.preview='';}
  protected selectPhoto(event:Event):void{const file=(event.target as HTMLInputElement).files?.[0];if(!file)return;if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>5000000){this.photoNotice='Seleziona una foto JPG, PNG o WebP fino a 5 MB.';return;}this.clearPreview();this.preview=URL.createObjectURL(file);this.photoNotice='Anteprima locale: caricamento foto non ancora disponibile. La foto non sarà salvata.';}
  protected remove():void{this.clearPreview();if(this.profile)this.profile.photoUrl=null;this.removePhoto=true;this.photoNotice='La rimozione sarà salvata con il profilo.';}
  protected async save():Promise<void>{if(!this.profile||this.busy)return;this.busy=true;this.error='';try{await this.api.saveProfile(this.profile,this.removePhoto);dismissProfilePrompt(this.current.context()?.userId);await this.router.navigateByUrl('/mobile/home');}catch(error:any){this.error=error?.error?.message??'Profilo non salvato. I dati compilati restano disponibili.';}finally{this.busy=false;}}
  protected async later():Promise<void>{dismissProfilePrompt(this.current.context()?.userId);await this.router.navigateByUrl('/mobile/home');}
}
