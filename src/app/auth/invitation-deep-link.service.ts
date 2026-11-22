import { Injectable, InjectionToken, NgZone, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { invitationPath, parseInvitationDeepLink, PUBLIC_INVITATION_ID } from './invitation-link';
import { readAccessInvitation, rememberAccessInvitation, clearAccessInvitation } from './onboarding-invitation';

export const INVITATION_LINK_PLATFORM = new InjectionToken('InvitationLinkPlatform', {providedIn:'root',factory:()=>({
  native:Capacitor.isNativePlatform(),
  listen:(handler:(url:string)=>void)=>App.addListener('appUrlOpen',({url})=>handler(url)),
  launch:()=>App.getLaunchUrl()
})});

@Injectable({providedIn:'root'})
export class InvitationDeepLinkService {
  private readonly router = inject(Router);
  private readonly zone = inject(NgZone);
  private readonly platform = inject(INVITATION_LINK_PLATFORM);
  readonly pendingId = signal(readAccessInvitation());
  private initialization: Promise<void> | null = null;
  initialize(): Promise<void> {
    if (!this.platform.native) return Promise.resolve();
    return this.initialization ??= (async()=>{
      await this.platform.listen(url=>{ void this.handle(url); });
      const launch = await this.platform.launch();
      if (launch?.url) await this.handle(launch.url);
    })();
  }
  remember(id:string):boolean {
    if (!PUBLIC_INVITATION_ID.test(id)) return false;
    if (readAccessInvitation() !== id) rememberAccessInvitation(id);
    this.pendingId.set(id); return true;
  }
  clear():void { clearAccessInvitation(); this.pendingId.set(''); }
  async handle(raw:string):Promise<boolean> {
    const id = parseInvitationDeepLink(raw);
    if (!id) return false;
    this.remember(id);
    return this.zone.run(async()=>{
      const path = invitationPath(id);
      if (this.router.url.split('?')[0] !== path) await this.router.navigateByUrl(path);
      return true;
    });
  }
}
