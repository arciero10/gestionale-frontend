import {Injectable,inject} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {firstValueFrom,timeout} from 'rxjs';
import {getApiConfiguration} from './api-config';
@Injectable({providedIn:'root'})
export class PlatformInvitationsApi{
  private readonly http=inject(HttpClient);
  private get url():string{return getApiConfiguration().apiBaseUrl+'/platform-invitations';}
  access():Promise<{inviteOnly:boolean;admitted:boolean}>{return firstValueFrom(this.http.get<{inviteOnly:boolean;admitted:boolean}>(this.url+'/access').pipe(timeout(15000)));}
  inspect(token:string):Promise<{firstName:string;lastName:string;status:string;expiresAt:string}>{return firstValueFrom(this.http.post<any>(this.url+'/inspect',{token}).pipe(timeout(15000)));}
  accept(token:string):Promise<unknown>{return firstValueFrom(this.http.post(this.url+'/accept',{token,confirm:true}).pipe(timeout(15000)));}
  create(firstName:string,lastName:string,email:string):Promise<{id:string;invitationUrl:string;expiresAt:string;deliveryStatus:string}>{return firstValueFrom(this.http.post<any>(this.url,{firstName,lastName,email,days:7}).pipe(timeout(15000)));}
  revoke(id:string):Promise<unknown>{return firstValueFrom(this.http.post(this.url+'/'+encodeURIComponent(id)+'/revoke',{}).pipe(timeout(15000)));}
  list():Promise<Array<{id:string;firstName:string;lastName:string;status:string;expiresAt:string}>>{return firstValueFrom(this.http.get<any>(this.url).pipe(timeout(15000)));}
}
