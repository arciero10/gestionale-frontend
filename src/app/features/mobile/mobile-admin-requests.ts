import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CurrentUserService } from '../../auth/current-user.service';
import { hasVerifiedGlobalAdmin } from '../../auth/platform-role';
import { OnboardingApiService, BackendParish } from '../../auth/onboarding-api.service';
import { AdminRequestsApi, AdmissionRow, ParishReportRow } from './admin-requests-api.service';

@Component({selector:'app-mobile-admin-requests',standalone:true,imports:[FormsModule,DatePipe,RouterLink],
 template: `
 @if(authorized){
 <h1>Richieste e approvazioni</h1>
 <button type="button" (click)="loadReports()" [disabled]="busy">Segnalazioni parrocchie</button>
 <form class="filters" (ngSubmit)="load(1)">
 <label>Categoria<select name="category" [(ngModel)]="filters.category" (ngModelChange)="load(1)">
 @for(option of categories;track option[0]){<option [value]="option[0]">{{option[1]}}</option>}
 </select></label>
 <details><summary>Filtri</summary>
 <label>Parrocchia<select name="parishId" [(ngModel)]="filters.parishId"><option value="">Tutte</option>@for(p of parishes;track p.id){<option [value]="p.id">{{p.name}} · {{p.address}}</option>}</select></label>
 <label>Numero comunità<input name="communityNumber" type="number" min="1" [(ngModel)]="filters.communityNumber" /></label>
 <label>Ruolo<select name="role" [(ngModel)]="filters.role"><option value="">Tutti</option><option value="MEMBER">Fratello / Sorella</option><option value="RESPONSIBLE">Responsabile</option><option value="CO_RESPONSIBLE">Corresponsabile</option></select></label>
 <label>Stato<select name="status" [(ngModel)]="filters.status"><option value="IN_ATTESA_APPROVAZIONE">In attesa</option><option value="APPROVATA">Approvata</option><option value="RESPINTA">Rifiutata</option><option value="ALL">Tutti</option></select></label>
 <label>Dal<input name="from" type="date" [(ngModel)]="filters.from" /></label><label>Al<input name="to" type="date" [(ngModel)]="filters.to" /></label>
 <button type="submit" [disabled]="busy"><i class="pi pi-filter" aria-hidden="true"></i> Applica filtri</button>
 </details></form>
 @if(feedback){<p role="status">{{feedback}}</p>}
 @if(loading){<p role="status">Caricamento richieste...</p>}
 @else{
 <p>{{total}} richieste</p>
 @for(row of rows;track row.id){
 <button class="request" type="button" (click)="open(row)" [disabled]="busy">
 <strong>{{row.firstName}} {{row.lastName}}</strong><span>{{row.parishName}} · {{row.communityNumber}}ª Comunità</span>
 <span>{{roleLabel(row.requestedRole)}} · {{statusLabel(row.queueStatus)}}</span><time>{{row.submittedAt | date:'dd/MM/yyyy'}}</time>
 @if(row.needsCommunityCensus){<span>Comunità da censire</span>}
 <i class="pi pi-angle-right" aria-hidden="true"></i></button>
 }@empty{<p>Nessuna richiesta corrispondente ai filtri.</p>}
 <nav aria-label="Pagine richieste"><button type="button" [disabled]="page===1||busy" (click)="load(page-1)" aria-label="Pagina precedente"><i class="pi pi-chevron-left" aria-hidden="true"></i></button><span>{{page}}</span><button type="button" [disabled]="page*25>=total||busy" (click)="load(page+1)" aria-label="Pagina successiva"><i class="pi pi-chevron-right" aria-hidden="true"></i></button></nav>
 }
 @if(reports!==null){
 <section><h2>Parrocchie segnalate</h2>
 @for(report of reports;track report.id){<article class="request"><strong>{{report.name}}</strong><span>{{report.address}}</span><span>Segnalazione utente, non dato ufficiale</span><button type="button" [disabled]="busy" (click)="reportSelected=report;reportReason='';reportParishId=null;reportConfirm=false">Verifica segnalazione</button></article>}
 @empty{<p>Nessuna segnalazione aperta.</p>}
 </section>
 }
 @if(reportSelected;as report){
 <dialog open aria-labelledby="report-title"><h2 id="report-title">{{report.name}}</h2><p>{{report.address}}</p>
 <label>Parrocchia censita verificata<select [(ngModel)]="reportParishId"><option [ngValue]="null">Seleziona record esistente</option>@for(p of parishes;track p.id){<option [ngValue]="p.id">{{p.name}} · {{p.address}}</option>}</select></label>
 <label>Elementi verificati<textarea [(ngModel)]="reportReason" maxlength="500"></textarea></label>
 @if(reportConfirm){<p>Confermi il collegamento della segnalazione al record selezionato?</p><button type="button" [disabled]="busy" (click)="resolveReport()">Conferma verifica</button>}
 @else{<button type="button" [disabled]="busy||!reportParishId||!reportReason.trim()" (click)="reportConfirm=true">Verifica collegamento</button>}
 <a routerLink="/mobile/admin/communities">Censisci una parrocchia dopo verifica</a><button type="button" [disabled]="busy" (click)="reportSelected=null">Chiudi</button></dialog>
 }
 @if(selected;as row){
 <dialog open aria-labelledby="request-title">
 <h2 id="request-title">{{row.firstName}} {{row.lastName}}</h2><p>{{row.parishName}} · {{row.communityNumber}}ª Comunità</p><p>{{roleLabel(row.requestedRole)}} · {{row.requestedStage}}</p>
 @if(row.referentName){<p>Referente: {{row.referentName}} {{row.referentContact}}</p>}
 @if(row.canReview){
 <label>Collegamento persona<select [(ngModel)]="personId"><option [ngValue]="null">Nuova persona dopo verifica</option>@for(p of row.candidates||[];track p.id){<option [ngValue]="p.id">{{p.name}}</option>}</select></label>
 <label>Motivazione / elementi verificati<textarea [(ngModel)]="reason" maxlength="500" rows="4"></textarea></label>
 @if(!confirmation){<div class="actions"><button type="button" [disabled]="busy||!reason.trim()" (click)="confirmation='approve'">Approva</button><button type="button" [disabled]="busy||!reason.trim()" (click)="confirmation='reject'">Rifiuta</button><button type="button" [disabled]="busy||!reason.trim()" (click)="confirmation='information'">Richiedi informazioni</button></div>}
 @else{<p>Confermi {{actionLabel}} per questa richiesta?</p><button type="button" [disabled]="busy||!reason.trim()" (click)="save()">Conferma decisione</button><button type="button" [disabled]="busy" (click)="confirmation=null">Annulla decisione</button>}
 }@else{<p>Questa richiesta non è modificabile dal tuo account.</p>}
 <a routerLink="/mobile/admin/communities">Parrocchie e comunità</a>
 <button type="button" [disabled]="busy" (click)="selected=null">Chiudi</button></dialog>
 }
 }@else{<p role="alert">Accesso non autorizzato.</p>}
 `,styleUrl:'./mobile-admin-workflow.scss'})
export class MobileAdminRequests implements OnInit,OnDestroy{
 private readonly current=inject(CurrentUserService);private readonly api=inject(AdminRequestsApi);private readonly onboarding=inject(OnboardingApiService);
 protected get authorized(){return this.current.state()==='ready'&&hasVerifiedGlobalAdmin(this.current.context());}
 protected filters={category:'RESPONSIBLE',parishId:'',communityNumber:'',role:'',status:'IN_ATTESA_APPROVAZIONE',from:'',to:''};
 protected readonly categories=[['RESPONSIBLE','Responsabili da approvare'],['CO_RESPONSIBLE','Corresponsabili da approvare'],['NEW_COMMUNITY','Nuove comunità da censire'],['SENZA_APPROVATORE','Fratelli senza approvatore'],['ALL','Tutte le richieste']];
 protected rows:AdmissionRow[]=[];protected parishes:BackendParish[]=[];protected selected:AdmissionRow|null=null;
 protected reason='';protected personId:number|null=null;protected confirmation:'approve'|'reject'|'information'|null=null;
 protected total=0;protected page=1;protected loading=false;protected busy=false;protected feedback='';
 protected reports:ParishReportRow[]|null=null;protected reportSelected:ParishReportRow|null=null;protected reportParishId:number|null=null;protected reportReason='';protected reportConfirm=false;
 private generation=0;private destroyed=false;
 protected get actionLabel(){return this.confirmation==='approve'?'l’approvazione':this.confirmation==='reject'?'il rifiuto':'la richiesta di informazioni';}
 async ngOnInit(){try{const data=await this.onboarding.getParishes();if(!this.destroyed&&this.authorized)this.parishes=data;}catch{}await this.load(1);}
 ngOnDestroy(){this.destroyed=true;this.generation++;this.rows=[];this.parishes=[];this.selected=null;this.reason='';this.reports=null;this.reportSelected=null;this.reportReason='';}
 private valid(actor:unknown,generation:number){return !this.destroyed&&this.authorized&&actor===this.current.context()&&generation===this.generation;}
 protected async load(page:number){
  if(!this.authorized)return;const actor=this.current.context(),generation=++this.generation;this.loading=true;this.feedback='';this.selected=null;
  try{const result=await this.api.list({...this.filters,from:this.filters['from']?this.filters['from']+'T00:00:00Z':'',to:this.filters['to']?this.filters['to']+'T23:59:59.999Z':''},page);
   if(this.valid(actor,generation)){this.rows=result.items;this.total=result.total;this.page=page;}}
  catch{if(this.valid(actor,generation)){this.rows=[];this.total=0;this.feedback='Impossibile caricare le richieste. Riprova.';}}
  finally{if(this.valid(actor,generation))this.loading=false;}
 }
 protected async open(row:AdmissionRow){if(this.busy||!this.authorized)return;const actor=this.current.context(),generation=++this.generation;this.busy=true;
  try{const detail=await this.api.detail(row.id);if(this.valid(actor,generation)){this.selected={...row,...detail};this.reason='';this.personId=null;this.confirmation=null;}}
  catch{if(this.valid(actor,generation))this.feedback='Dettaglio non disponibile.';}finally{if(this.valid(actor,generation))this.busy=false;}}
 protected async save(){
  if(this.busy||!this.authorized||!this.selected?.canReview||!this.confirmation||!this.reason.trim())return;
  const actor=this.current.context(),generation=this.generation;this.busy=true;
  try{await this.api.review(this.selected.id,this.confirmation,this.reason.trim(),this.personId??undefined);
   if(this.valid(actor,generation)){this.selected=null;await this.load(this.page);this.feedback='Decisione registrata.';}}
  catch{if(this.valid(actor,generation))this.feedback='Decisione non salvata. Aggiorna la richiesta e verifica i dati.';}
  finally{if(!this.destroyed&&actor===this.current.context())this.busy=false;}
 }
 protected async loadReports(){
  if(!this.authorized||this.busy)return;const actor=this.current.context(),generation=this.generation;this.busy=true;
  try{const rows=await this.api.reports();if(this.valid(actor,generation))this.reports=rows;}
  catch{if(this.valid(actor,generation))this.feedback='Segnalazioni non disponibili.';}finally{if(this.valid(actor,generation))this.busy=false;}
 }
 protected async resolveReport(){
  if(!this.authorized||this.busy||!this.reportSelected||!this.reportParishId||!this.reportConfirm||!this.reportReason.trim())return;
  const actor=this.current.context(),generation=this.generation;this.busy=true;
  try{await this.api.resolveReport(this.reportSelected.id,this.reportParishId,this.reportReason.trim());if(this.valid(actor,generation)){this.reportSelected=null;this.reports=null;this.feedback='Segnalazione verificata sul record esistente.';}}
  catch{if(this.valid(actor,generation))this.feedback='Verifica non salvata. Aggiorna e riprova.';}finally{if(this.valid(actor,generation))this.busy=false;}
 }
 protected roleLabel(role:string){return ({MEMBER:'Fratello / Sorella',RESPONSIBLE:'Responsabile',CO_RESPONSIBLE:'Corresponsabile'} as Record<string,string>)[role]||role;}
 protected statusLabel(status:string){return ({SENZA_APPROVATORE:'Senza approvatore',GLOBAL_ADMIN_REVIEW:'Verifica amministrativa',IN_ATTESA_APPROVAZIONE:'In attesa',APPROVATA:'Approvata',RESPINTA:'Rifiutata'} as Record<string,string>)[status]||status;}
}
