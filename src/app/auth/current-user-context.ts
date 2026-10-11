import { signal } from '@angular/core';

export interface CurrentUserContext {
    authenticated: boolean;
    linkedToCommunity: boolean;
    status: string;
    userId: number | null;
    personId: number | null;
    communityMemberId: string | null;
    communityId: number | null;
    communityName: string | null;
    communityNumber: number | null;
    parishName: string | null;
    role: string | null;
    permissions: string[];
    email: string | null;
    displayName: string | null;
    memberCount?: number;
}

export const backendUserContext = signal<CurrentUserContext | null>(null);
