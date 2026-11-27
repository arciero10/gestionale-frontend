import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom, timeout } from 'rxjs';
import { getApiConfiguration } from './api-config';
import { CurrentUserContext } from './current-user-context';
import { CommunityApiService, CommunityView } from '../services/community-api.service';

export interface BackendParish { id: number; name: string; address: string | null; }
export interface BackendCommunity { id: number; number: number; }
export interface CompleteOnboardingRequest {
    firstName: string; lastName: string; parishId: number; communityNumber: number;
    role: string; phone: string; stage: string; privacyConsent: boolean; invitationToken?: string;
}
export interface CommunityAccessRequest {
    referentName?:string;referentContact?:string;
    email?: string; candidates?: Array<{id: number; name: string; reasons: string[]}>;
    id: number; firstName: string; lastName: string; parishId: number; parishName: string;
    communityNumber: number; requestedRole: string; requestedStage: string; status: string; submittedAt: string;
    existingPeople: Array<{ id: number; name: string }>;
    canApprove: boolean; canReject: boolean;
}
export interface OnboardingResult { status: string; requestId: number; context: CurrentUserContext; }
export interface CommunityInvitation { id: number; publicId: string; personId: number; status: string; expiresAt: string; emailStatus?: 'NOT_SENT' | 'SENT' | 'FAILED' | 'BLOCKED_BY_TEST_MODE'; emailSentAt?: string; emailLastAttemptAt?: string; emailAttemptCount?: number }
export interface CreatedInvitation extends CommunityInvitation { invitationUrl: string; deliveryStatus: string; mail: { to: string; subject: string; body: string } }
export interface OwnOnboardingRequest {
    queueStatus?:string;applicationAccess?:string;needsCommunityCensus?:boolean;reviewMessage?:string|null;
    referentName?:string;referentContact?:string;responsibleAvailable?:boolean;
    firstName: string; lastName: string; phone: string; parishId: number; communityNumber: number;
    requestedRole: string; requestedStage: string; status: string; parishName?: string;
}
export type CommunityData = CommunityView;

@Injectable({ providedIn: 'root' })
export class OnboardingApiService {
    private readonly http = inject(HttpClient);
    private readonly community = inject(CommunityApiService);
    private get url(): string { return `${getApiConfiguration().apiBaseUrl}/onboarding`; }
    getParishes(): Promise<BackendParish[]> {
        return firstValueFrom(this.http.get<BackendParish[]>(`${this.url}/parishes`).pipe(timeout(15000)));
    }
    reportMissingParish(name:string,address:string):Promise<{status:string;officialRecordCreated:false}>{
        return firstValueFrom(this.http.post<{status:string;officialRecordCreated:false}>(`${this.url}/parish-reports`,{name,address}).pipe(timeout(15000)));
    }
    getCommunities(parishId: number): Promise<BackendCommunity[]> {
        return firstValueFrom(this.http.get<BackendCommunity[]>(`${this.url}/parishes/${parishId}/communities`).pipe(timeout(15000)));
    }
    getDelegations(): Promise<{ availablePermissions: string[]; members: Array<{personId: number; name: string; permissions: string[]}> }> {
        return firstValueFrom(this.http.get<{ availablePermissions: string[]; members: Array<{personId: number; name: string; permissions: string[]}> }>(`${this.url}/delegations`).pipe(timeout(15000)));
    }
    saveDelegations(personId: number, permissions: string[]): Promise<unknown> {
        return firstValueFrom(this.http.put(`${this.url}/delegations/${personId}`, { permissions }).pipe(timeout(15000)));
    }
    getCurrentRequest(): Promise<OwnOnboardingRequest | null> {
        return firstValueFrom(this.http.get<OwnOnboardingRequest | null>(`${this.url}/current`).pipe(timeout(15000)));
    }
    reportReferent(name:string,contact:string):Promise<unknown>{return firstValueFrom(this.http.post(`${this.url}/referent`,{name,contact}).pipe(timeout(15000)));}
    complete(payload: CompleteOnboardingRequest): Promise<OnboardingResult> {
        return firstValueFrom(this.http.post<OnboardingResult>(`${this.url}/complete`, payload).pipe(timeout(20000)));
    }
    getRequests(): Promise<CommunityAccessRequest[]> {
        return firstValueFrom(this.http.get<CommunityAccessRequest[]>(`${this.url}/requests`).pipe(timeout(15000)));
    }
    getMyCommunity(): Promise<CommunityData> {
        return this.community.getCommunity();
    }
    censusMember(payload: { firstName: string; lastName: string; email: string; phone: string }): Promise<unknown> {
        return this.community.createMember(payload);
    }
    invite(communityId: number, personId: number, email?: string): Promise<CreatedInvitation> {
        return firstValueFrom(this.http.post<CreatedInvitation>(`${this.url}/invitations`, { communityId, personId, email }).pipe(timeout(70000)));
    }
    invitations(): Promise<CommunityInvitation[]> { return firstValueFrom(this.http.get<CommunityInvitation[]>(`${this.url}/invitations`).pipe(timeout(15000))); }
    cancelInvitation(id: number): Promise<unknown> { return firstValueFrom(this.http.post(`${this.url}/invitations/${id}/cancel`, {}).pipe(timeout(15000))); }
    invitationDelivery(id: number): Promise<CreatedInvitation> { return firstValueFrom(this.http.get<CreatedInvitation>(`${this.url}/invitations/${id}/delivery`).pipe(timeout(15000))); }
    resendInvitation(id: number): Promise<CreatedInvitation> { return firstValueFrom(this.http.post<CreatedInvitation>(`${this.url}/invitations/${id}/resend`, {}).pipe(timeout(70000))); }
    invitation(id: string): Promise<{status: string; communityName: string; parishName: string; firstName: string; lastName: string}> {
        return firstValueFrom(this.http.get<any>(`${this.url}/invitations/${encodeURIComponent(id)}`).pipe(timeout(15000)));
    }
    acceptInvitation(id: string, privacyConsent: boolean): Promise<unknown> { return firstValueFrom(this.http.post(`${this.url}/invitations/${encodeURIComponent(id)}/accept`, {privacyConsent}).pipe(timeout(20000))); }
    review(id: number, action: 'approve' | 'reject', personId?: number, details: Record<string, unknown> = {}): Promise<unknown> {
        return firstValueFrom(this.http.post(`${this.url}/requests/${id}/${action}`, { ...details, ...(personId ? { personId } : {}) }).pipe(timeout(20000)));
    }
}
