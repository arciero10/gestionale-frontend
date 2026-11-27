import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, timeout } from 'rxjs';
import { getApiConfiguration } from '../../auth/api-config';
export interface ManagedCommunityMember{personId:number;name:string;role:string;revision:string;canChange:boolean}
export interface ManagedDelegations{availablePermissions:string[];members:Array<{personId:number;name:string;permissions:string[]}>}
@Injectable({providedIn:'root'})
export class AdminCommunityRolesApi{
 private readonly http=inject(HttpClient);
 private get url(){return getApiConfiguration().apiBaseUrl;}
 members(id:number){return firstValueFrom(this.http.get<ManagedCommunityMember[]>(this.url+'/admin/communities/'+id+'/members').pipe(timeout(15000)));}
 role(communityId:number,member:ManagedCommunityMember,role:string,reason:string){
  return firstValueFrom(this.http.patch(this.url+'/admin/communities/'+communityId+'/members/'+member.personId+'/role',{role,reason,expectedRevision:member.revision}).pipe(timeout(20000)));
 }
 delegations(id:number){return firstValueFrom(this.http.get<ManagedDelegations>(this.url+'/onboarding/delegations',{params:{communityId:id}}).pipe(timeout(15000)));}
 saveDelegations(communityId:number,personId:number,permissions:string[]){
  return firstValueFrom(this.http.put(this.url+'/onboarding/delegations/'+personId,{communityId,permissions}).pipe(timeout(20000)));
 }
}
