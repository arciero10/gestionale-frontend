import { inject } from '@angular/core';
import { CanMatchFn, Router, Routes } from '@angular/router';
import { MobileAuthService } from '../../auth/mobile-auth.service';
import { CurrentUserService } from '../../auth/current-user.service';
import { MobileShell } from './mobile-shell';
import { hasVerifiedGlobalAdmin } from '../../auth/platform-role';

export const mobileGlobalAdminGuard: CanMatchFn = () => {
  const current = inject(CurrentUserService);
  return current.state() === 'ready' && hasVerifiedGlobalAdmin(current.context()) || inject(Router).parseUrl('/forbidden');
};

export const mobileAccessGuard: CanMatchFn = () => {
  const auth = inject(MobileAuthService), router = inject(Router);
  if (!auth.native) return router.parseUrl('/gestionale-cn/dashboard');
  return auth.signedIn() || router.parseUrl('/');
};
const linkedGuard: CanMatchFn = () => inject(CurrentUserService).context()?.linkedToCommunity === true || inject(Router).parseUrl('/mobile/onboarding');
const approvalGuard: CanMatchFn = () => {
  const context = inject(CurrentUserService).context();
  return hasVerifiedGlobalAdmin(context) || context?.linkedToCommunity === true && context.permissions.some(p => ['APPROVE_REQUESTS','APPROVE_MEMBERS'].includes(p)) || inject(Router).parseUrl('/mobile/onboarding');
};
const structureGuard: CanMatchFn = () => inject(CurrentUserService).context()?.permissions.includes('CREATE_CONVIVENZA') || inject(Router).parseUrl('/forbidden');
const section = (path: string, title: string) => ({ path, loadComponent: () => import('./mobile-home').then(c => c.MobileHome), data: { section: path, title }, canMatch: [linkedGuard] });

export default [{ path: '', component: MobileShell, children: [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'admin', loadComponent: () => import('./mobile-admin').then(c => c.MobileAdmin), canMatch: [mobileGlobalAdminGuard] },
  { path: 'admin/communities', loadComponent: () => import('./mobile-admin-communities').then(c => c.MobileAdminCommunities), canMatch: [mobileGlobalAdminGuard] },
  { path: 'admin/approvals', loadComponent: () => import('./mobile-admin-requests').then(c => c.MobileAdminRequests), canMatch: [mobileGlobalAdminGuard] },
  { path: 'admin/responsibles', loadComponent: () => import('./mobile-admin-roles').then(c => c.MobileAdminRoles), canMatch: [mobileGlobalAdminGuard] },
  { path: 'admin/delegations', loadComponent: () => import('./mobile-admin-roles').then(c => c.MobileAdminRoles), canMatch: [mobileGlobalAdminGuard] },
  { path: 'admin/:section', loadComponent: () => import('./mobile-admin').then(c => c.MobileAdmin), canMatch: [mobileGlobalAdminGuard] },
  { path: 'account-security', loadComponent: () => import('./mobile-account-security').then(c => c.MobileAccountSecurity) },
  section('home', 'Home'),
  { path: 'community-life', loadComponent: () => import('./mobile-areas').then(c => c.MobileAreas), data: { area: 'life' }, canMatch: [linkedGuard] },
  { path: 'retreats', loadComponent: () => import('./mobile-areas').then(c => c.MobileAreas), data: { area: 'retreats' }, canMatch: [linkedGuard] },
  { path: 'calendario', loadComponent: () => import('./mobile-calendar').then(c => c.MobileCalendar), canMatch: [linkedGuard] },
  { path: 'calendar', loadComponent: () => import('./mobile-calendar').then(c => c.MobileCalendar), canMatch: [linkedGuard] },
  { path: 'calendar/import', loadComponent: () => import('./mobile-calendar-import').then(c => c.MobileCalendarImport), canMatch: [linkedGuard] },
  { path: 'calendar/import/:id', loadComponent: () => import('./mobile-calendar-import').then(c => c.MobileCalendarImport), canMatch: [linkedGuard] },
  { path: 'calendar/:id', loadComponent: () => import('./mobile-calendar-detail').then(c => c.MobileCalendarDetail), canMatch: [linkedGuard] },
  { path: 'compleanni', redirectTo: 'birthdays', pathMatch: 'full' },
  { path: 'birthdays', loadComponent: () => import('./mobile-birthdays').then(c => c.MobileBirthdays), canMatch: [linkedGuard] },
  { path: 'privacy', loadComponent: () => import('./mobile-privacy').then(c => c.MobilePrivacy), canMatch: [linkedGuard] },
  { path: 'complete-profile', loadComponent: () => import('./mobile-personal-profile').then(c => c.MobilePersonalProfile), canMatch: [linkedGuard] },
  section('gruppi', 'Gruppi'), section('avvisi', 'Avvisi'), section('profilo', 'Profilo'), section('account', 'Il mio profilo'), section('informazioni', 'Informazioni sull’app'),
  { path: 'altro', redirectTo: 'profilo', pathMatch: 'full' },
  { path: 'approvazioni', loadComponent: () => import('./mobile-approvals').then(c => c.MobileApprovals), canMatch: [approvalGuard] },
  { path: 'onboarding', loadComponent: () => import('../gestionaleCN/onboarding-comunita/onboarding-comunita').then(c => c.OnboardingComunita) },
  { path: 'comunita', redirectTo: 'community', pathMatch: 'full' },
  { path: 'community', loadComponent: () => import('./mobile-community').then(c => c.MobileCommunity), canMatch: [linkedGuard] },
  { path: 'community/members', loadComponent: () => import('./mobile-community').then(c => c.MobileCommunity), data: { fullList: true }, canMatch: [linkedGuard] },
  { path: 'community/import', loadComponent: () => import('./mobile-directory-import').then(c => c.MobileDirectoryImport), canMatch: [linkedGuard] },
  { path: 'community/import/:id', loadComponent: () => import('./mobile-directory-import').then(c => c.MobileDirectoryImport), canMatch: [linkedGuard] },
  { path: 'community/import/:id/row/:rowId', loadComponent: () => import('./mobile-directory-import-row').then(c => c.MobileDirectoryImportRow), canMatch: [linkedGuard] },
  { path: 'community/add', loadComponent: () => import('./mobile-community-member').then(c => c.MobileCommunityMember), canMatch: [linkedGuard] },
  { path: 'community/member/:id', loadComponent: () => import('./mobile-community-member').then(c => c.MobileCommunityMember), canMatch: [linkedGuard] },
  { path: 'convivenze', loadComponent: () => import('../gestionaleCN/convivenze/convivenze').then(c => c.Convivenze), canMatch: [linkedGuard] },
  { path: 'posti-convivenza', loadComponent: () => import('../gestionaleCN/posti-convivenza/posti-convivenza').then(c => c.PostiConvivenza), canMatch: [linkedGuard, structureGuard] }
] }] satisfies Routes;
