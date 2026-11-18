import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, timeout } from 'rxjs';
import { getApiConfiguration } from '../auth/api-config';

export interface BirthdayItem {
  memberId: string; personId: number; displayName: string; photoUrl?: string | null;
  day: number; month: number; dateLabel: string; isToday: boolean; daysUntilBirthday: number;
  section: 'today' | 'week' | 'month' | 'later'; memberRoute: string;
}
export interface BirthdayCalendar { communityName: string; parishName: string; today: string; birthdays: BirthdayItem[] }

@Injectable({ providedIn: 'root' })
export class BirthdayApiService {
  private readonly http = inject(HttpClient);
  get(): Promise<BirthdayCalendar> {
    return firstValueFrom(this.http.get<BirthdayCalendar>(getApiConfiguration().apiBaseUrl + '/mobile/birthdays').pipe(timeout(20000)));
  }
}
