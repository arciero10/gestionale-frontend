import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MobileAuthService } from '../../auth/mobile-auth.service';

@Component({selector:'app-mobile-account-security', standalone:true, template:`
  <h1>Account e sicurezza</h1>
  <section><h2>Accesso Microsoft</h2><p>Esci prima di accedere con un altro account. I dati della comunità restano conservati sul server.</p>
  <button type="button" [disabled]="busy" (click)="logout()"><i class="pi pi-sign-out" aria-hidden="true"></i> {{busy ? 'Disconnessione...' : "Esci dall'account"}}</button></section>
  @if(error){<p role="alert">{{error}}</p>}
`,styles:[`:host{display:block;min-width:0}h1{font-size:25px}h2{font-size:19px;margin-top:28px}p{line-height:1.6;overflow-wrap:anywhere}button{display:flex;align-items:center;justify-content:center;gap:10px;min-height:52px;width:100%;padding:14px;border:0;border-radius:6px;background:var(--color-primary);color:white;font:inherit;margin-top:24px;white-space:normal}button:disabled{opacity:.6}button:focus-visible{outline:3px solid var(--color-focus);outline-offset:3px}`]})
export class MobileAccountSecurity {
  private readonly mobile = inject(MobileAuthService);
  private readonly router = inject(Router);
  protected busy=false;
  protected error='';
  protected async logout():Promise<void>{
    if(this.busy)return;
    this.busy=true;this.error='';
    try{await this.mobile.logout();await this.router.navigateByUrl('/',{replaceUrl:true});}
    catch{this.error='Disconnessione non completata. Riprova prima di cambiare account.';}
    finally{this.busy=false;}
  }
}
