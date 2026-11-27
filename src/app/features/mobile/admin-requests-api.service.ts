import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom, timeout } from 'rxjs';
import { getApiConfiguration } from '../../auth/api-config';

export interface AdmissionRow {
  id:number;firstName:string;lastName:string;parishId:number;parishName:string;communityNumber:number;
  requestedRole:string;requestedStage:string;status:string;queueStatus:string;needsCommunityCensus:boolean;canReview:boolean;
  submittedAt:string;referentName?:string;referentContact?:string;candidates?:Array<{id:number;name:string}>;
}
export interface ParishReportRow{id:number;name:string;address:string|null;submittedAt:string;source:'USER_REPORT_NOT_OFFICIAL'}
@Injectable({providedIn:'root'})
export class AdminRequestsApi {
  private readonly http=inject(HttpClient);
  private get url(){return getApiConfiguration().apiBaseUrl+'/admin/membership-requests';}
  list(filters:Record<string,string>,page:number){
    let params=new HttpParams().set('page',page);
    for(const [key,value] of Object.entries(filters))if(value)params=params.set(key,value);
    return firstValueFrom(this.http.get<{items:AdmissionRow[];total:number}>(this.url,{params}).pipe(timeout(15000)));
  }
  detail(id:number){return firstValueFrom(this.http.get<AdmissionRow>(this.url+'/'+id).pipe(timeout(15000)));}
  review(id:number,action:'approve'|'reject'|'information',reason:string,personId?:number){
    return firstValueFrom(this.http.post(this.url+'/'+id+'/'+action,{reason,...(personId?{personId}:{})}).pipe(timeout(20000)));
  }
  reports(){return firstValueFrom(this.http.get<ParishReportRow[]>(getApiConfiguration().apiBaseUrl+'/admin/parish-reports').pipe(timeout(15000)));}
  resolveReport(id:number,parishId:number,reason:string){return firstValueFrom(this.http.post(getApiConfiguration().apiBaseUrl+'/admin/parish-reports/'+id+'/resolve',{parishId,reason}).pipe(timeout(20000)));}
}
