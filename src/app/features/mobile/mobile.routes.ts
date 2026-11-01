import { inject } from '@angular/core';
import { CanMatchFn, Router, Routes } from '@angular/router';
import { MobileAuthService } from '../../auth/mobile-auth.service';
import { CurrentUserService } from '../../auth/current-user.service';
import { MobileShell } from './mobile-shell';

export const mobileAccessGuard: CanMatchFn = () => {
  const auth = inject(MobileAuthService), router = inject(Router);
  if (!auth.native) return router.parseUrl('/gestionale-cn/dashboard');
  return auth.signedIn() || router.parseUrl('/');
};
const linkedGuard: CanMatchFn = () => inject(CurrentUserService).context()?.linkedToCommunity === true || inject(Router).parseUrl('/mobile/onboarding');
const structureGuard: CanMatchFn = () => inject(CurrentUserService).context()?.permissions.includes('CREATE_CONVIVENZA') || inject(Router).parseUrl('/forbidden');
const section = (path: string, title: string) => ({ path, loadComponent: () => import('./mobile-home').then(c => c.MobileHome), data: { section: path, title }, canMatch: [linkedGuard] });

export default [{ path: '', component: MobileShell, children: [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  section('home', 'Home'), section('calendario', 'Calendario'), section('compleanni', 'Compleanni'),
  section('gruppi', 'Gruppi'), section('avvisi', 'Avvisi'), section('profilo', 'Profilo'), section('altro', 'Altro'),
  { path: 'onboarding', loadComponent: () => import('../gestionaleCN/onboarding-comunita/onboarding-comunita').then(c => c.OnboardingComunita) },
  { path: 'comunita', loadComponent: () => import('../gestionaleCN/comunita/comunita').then(c => c.Comunita), canMatch: [linkedGuard] },
  { path: 'convivenze', loadComponent: () => import('../gestionaleCN/convivenze/convivenze').then(c => c.Convivenze), canMatch: [linkedGuard] },
  { path: 'posti-convivenza', loadComponent: () => import('../gestionaleCN/posti-convivenza/posti-convivenza').then(c => c.PostiConvivenza), canMatch: [linkedGuard, structureGuard] }
] }] satisfies Routes;
