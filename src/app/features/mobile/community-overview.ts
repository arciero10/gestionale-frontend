import { Component, Input, OnInit, inject, OnDestroy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommunityApiService, CommunityMemberView, CommunityView } from '../../services/community-api.service';
import { BirthdayApiService, BirthdayItem } from '../../services/birthday-api.service';
import { OnboardingApiService } from '../../auth/onboarding-api.service';
import { communityRoleLabel } from '../../auth/community-roles';

@Component({
  selector: 'app-community-overview', standalone: true, imports: [RouterLink],
  templateUrl: './community-overview.html', styleUrl: './community-overview.scss'
})
export class CommunityOverview implements OnInit, OnDestroy {
  @Input({ required: true }) data!: CommunityView;
  private readonly api = inject(CommunityApiService);
  private readonly birthdayApi = inject(BirthdayApiService);
  private readonly onboarding = inject(OnboardingApiService);
  private disposed = false;
  protected readonly failedPhotos = new Set<number>();
  protected birthdays: BirthdayItem[] = [];
  protected pending = 0;
  protected couples: Array<{ first: CommunityMemberView; second: CommunityMemberView }> = [];
  protected couplesLoading = false;
  protected couplesLoaded = false;
  protected couplesError = '';
  protected showAllCouples = false;
  protected get leaders(): CommunityMemberView[] { return this.data.members.filter(m => ['RESPONSIBLE', 'CO_RESPONSIBLE'].includes(m.role)); }
  protected get preview(): CommunityMemberView[] { return this.data.members.slice(0, 6); }
  protected roleLabel = communityRoleLabel;
  protected initials(m: CommunityMemberView): string { return (m.firstName.charAt(0) + m.lastName.charAt(0)).toLocaleUpperCase('it'); }
  ngOnInit(): void { void this.loadBirthdays(); if (this.data.context.permissions?.some(p => ['APPROVE_REQUESTS', 'APPROVE_MEMBERS'].includes(p)) || this.data.context.isOnboardingAdmin) void this.loadRequests(); }
  ngOnDestroy(): void { this.disposed = true; }
  private async loadBirthdays(): Promise<void> {
    try { const result = await this.birthdayApi.get(); if (!this.disposed) this.birthdays = [...result.birthdays].sort((a,b) => a.daysUntilBirthday - b.daysUntilBirthday).slice(0,3); } catch { /* Optional preview does not block the community. */ }
  }
  private async loadRequests(): Promise<void> {
    try { const requests = await this.onboarding.getRequests(); if (!this.disposed) this.pending = requests.filter(r => r.status === 'IN_ATTESA_APPROVAZIONE' && (r.canApprove || r.canReject) && r.communityNumber === this.data.context.communityNumber && r.parishName === this.data.context.parishName).length; } catch { /* Approval page retains its own retry UI. */ }
  }
  protected async loadCouples(): Promise<void> {
    if (this.couplesLoading || this.couplesLoaded) return;
    this.couplesLoading = true; this.couplesError = '';
    const pairs = new Map<string, { first: CommunityMemberView; second: CommunityMemberView }>();
    try {
      // Existing detail endpoint is privacy-filtered; bound concurrency and load only on demand.
      for (let offset = 0; offset < this.data.members.length && !this.disposed; offset += 4) {
        const details = await Promise.all(this.data.members.slice(offset,offset+4).map(m => this.api.getMember(m.personId)));
        for (const detail of details) {
          const first = this.data.members.find(m => m.personId === detail.member.personId);
          const second = this.data.members.find(m => m.personId === detail.spouse?.personId);
          if (first && second && first.personId !== second.personId) pairs.set([first.personId,second.personId].sort((a,b) => a-b).join(':'),{first,second});
        }
      }
      if (!this.disposed) { this.couples = [...pairs.values()]; this.couplesLoaded = true; }
    } catch { if (!this.disposed) this.couplesError = 'Impossibile caricare le coppie. Riprova.'; }
    finally { if (!this.disposed) this.couplesLoading = false; }
  }
}
