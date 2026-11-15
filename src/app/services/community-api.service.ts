import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, timeout } from 'rxjs';
import { getApiConfiguration } from '../auth/api-config';
import { CurrentUserContext } from '../auth/current-user-context';

export interface CommunityMemberView {
  personId: number; firstName: string; lastName: string; role: string;
  phoneNumber?: string; email?: string; birthDate?: string; photoUrl?: string;
}
export interface CommunityView { context: CurrentUserContext; members: CommunityMemberView[]; canAddMember: boolean; assignableRoles: string[] }
export interface CommunityMemberDetail {
  member: CommunityMemberView; stage: string; isSelf: boolean; canEdit: boolean; canManageRole: boolean;
  canEditPhone: boolean; canEditEmail: boolean; canEditBirthDate: boolean; assignableRoles: string[];
  spouse?: { personId: number; firstName: string; lastName: string };
}
export interface MemberWrite {
  firstName: string; lastName: string; email?: string; phone?: string; birthDate?: string;
  clearBirthDate?: boolean; stage?: string; role?: string;
}
export interface MemberPrivacy {
  showPhone: boolean; showEmail: boolean; showBirthDate: boolean; showPhoto: boolean; showFamily: boolean;
  receiveBirthdayNotifications: boolean; receiveCommunityNotifications: boolean; photoUrl?: string | null;
}

@Injectable({ providedIn: 'root' })
export class CommunityApiService {
  private readonly http = inject(HttpClient);
  private get url(): string { return `${getApiConfiguration().apiBaseUrl}/me/community`; }
  getCommunity(): Promise<CommunityView> { return firstValueFrom(this.http.get<CommunityView>(this.url).pipe(timeout(20000))); }
  getMember(id: number): Promise<CommunityMemberDetail> { return firstValueFrom(this.http.get<CommunityMemberDetail>(`${this.url}/members/${id}`).pipe(timeout(20000))); }
  createMember(payload: MemberWrite): Promise<{ personId: number }> { return firstValueFrom(this.http.post<{ personId: number }>(`${this.url}/members`, payload).pipe(timeout(20000))); }
  updateMember(id: number, payload: MemberWrite): Promise<unknown> { return firstValueFrom(this.http.put(`${this.url}/members/${id}`, payload).pipe(timeout(20000))); }
  getPrivacy(): Promise<MemberPrivacy> { return firstValueFrom(this.http.get<MemberPrivacy>(`${this.url}/privacy`).pipe(timeout(20000))); }
  savePrivacy(payload: MemberPrivacy): Promise<unknown> { return firstValueFrom(this.http.put(`${this.url}/privacy`, payload).pipe(timeout(20000))); }
}
