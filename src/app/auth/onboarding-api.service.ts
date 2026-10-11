import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom, timeout } from 'rxjs';
import { getApiConfiguration } from './api-config';
import { CurrentUserContext } from './current-user-context';

export interface BackendParish { id: number; name: string; address: string | null; }
export interface CompleteOnboardingRequest {
    firstName: string; lastName: string; parishId: number; communityNumber: number;
    role: string; phone: string; stage: string; privacyConsent: boolean; invitationToken?: string;
}
export interface CommunityAccessRequest {
    id: number; firstName: string; lastName: string; parishId: number; parishName: string;
    communityNumber: number; requestedRole: string; requestedStage: string; status: string; submittedAt: string;
    existingPeople: Array<{ id: number; name: string }>;
}
export interface OnboardingResult { status: string; requestId: number; context: CurrentUserContext; }
export interface OwnOnboardingRequest {
    firstName: string; lastName: string; phone: string; parishId: number; communityNumber: number;
    requestedRole: string; requestedStage: string; status: string;
}
export interface CommunityData {
    context: CurrentUserContext;
    members: Array<{ personId: number; role: string; firstName: string; lastName: string; email: string; phoneNumber: string }>;
}

@Injectable({ providedIn: 'root' })
export class OnboardingApiService {
    private readonly http = inject(HttpClient);
    private get url(): string { return `${getApiConfiguration().apiBaseUrl}/onboarding`; }
    getParishes(): Promise<BackendParish[]> {
        return firstValueFrom(this.http.get<BackendParish[]>(`${this.url}/parishes`).pipe(timeout(15000)));
    }
    getCurrentRequest(): Promise<OwnOnboardingRequest | null> {
        return firstValueFrom(this.http.get<OwnOnboardingRequest | null>(`${this.url}/current`).pipe(timeout(15000)));
    }
    complete(payload: CompleteOnboardingRequest): Promise<OnboardingResult> {
        return firstValueFrom(this.http.post<OnboardingResult>(`${this.url}/complete`, payload).pipe(timeout(20000)));
    }
    getRequests(): Promise<CommunityAccessRequest[]> {
        return firstValueFrom(this.http.get<CommunityAccessRequest[]>(`${this.url}/requests`).pipe(timeout(15000)));
    }
    getMyCommunity(): Promise<CommunityData> {
        return firstValueFrom(this.http.get<CommunityData>(`${getApiConfiguration().apiBaseUrl}/me/community`).pipe(timeout(15000)));
    }
    invite(communityId: number, personId: number): Promise<{ invitationToken: string }> {
        return firstValueFrom(this.http.post<{ invitationToken: string }>(`${this.url}/invitations`, { communityId, personId }).pipe(timeout(15000)));
    }
    review(id: number, action: 'approve' | 'reject', personId?: number): Promise<unknown> {
        return firstValueFrom(this.http.post(`${this.url}/requests/${id}/${action}`, personId ? { personId } : {}).pipe(timeout(20000)));
    }
}
