import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom, timeout } from 'rxjs';
import { getApiConfiguration } from '../../auth/api-config';

export interface AdminParish { id:number;name:string;address:string|null;revision:string;communityCount?:number; }
export interface AdminCommunity { id:number;parishId:number;number:number;revision:string; }
export interface ParishPage { items:AdminParish[];total:number;page:number;pageSize:number; }
export interface ParishCommunities { parish:AdminParish;communities:AdminCommunity[];nextNumber:number; }
@Injectable({providedIn:'root'})
export class AdminCommunitiesApi {
 private readonly http=inject(HttpClient);
 private get url():string{return `${getApiConfiguration().apiBaseUrl}/admin/parishes`;}
 getParishes(query='',filter='all',page=1):Promise<ParishPage>{
  let params=new HttpParams().set('q',query.trim()).set('page',page).set('pageSize',25);
  if(filter!=='all')params=params.set('hasCommunities',filter==='with');
  return firstValueFrom(this.http.get<ParishPage>(this.url,{params}).pipe(timeout(15000)));
 }
 getCommunities(id:number):Promise<ParishCommunities>{return firstValueFrom(this.http.get<ParishCommunities>(`${this.url}/${id}/communities`).pipe(timeout(15000)));}
 saveParish(id:number|null,data:{name:string;address:string;expectedRevision?:string}):Promise<AdminParish>{
  return firstValueFrom((id===null?this.http.post<AdminParish>(this.url,data):this.http.put<AdminParish>(`${this.url}/${id}`,data)).pipe(timeout(20000)));
 }
 saveCommunity(parishId:number,id:number|null,data:{number:number;expectedRevision?:string}):Promise<AdminCommunity>{
  const url=`${this.url}/${parishId}/communities`;
  return firstValueFrom((id===null?this.http.post<AdminCommunity>(url,data):this.http.put<AdminCommunity>(`${url}/${id}`,data)).pipe(timeout(20000)));
 }
}
