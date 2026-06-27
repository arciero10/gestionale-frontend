import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { MsalService } from '@azure/msal-angular';
import { hasSelectedCommunity } from '../features/gestionaleCN/data/community-selection.storage';

const ONBOARDING_URL = '/gestionale-cn/onboarding-comunita';

export const gestionaleAuthGuard: CanMatchFn = (_route, segments) => {
  const msalService = inject(MsalService);
  const router = inject(Router);
  const targetPath = `/${segments.map((segment) => segment.path).join('/')}`;
  const navigationPath = router.getCurrentNavigation()?.finalUrl?.toString().split('?')[0].split('#')[0];
  const requestedPath = navigationPath ?? targetPath;
  const isOnboardingTarget = requestedPath === ONBOARDING_URL;

  const activeAccount = msalService.instance.getActiveAccount();
  const accounts = msalService.instance.getAllAccounts();
  const account = activeAccount ?? accounts[0];

  if (account) {
    if (!activeAccount) {
      msalService.instance.setActiveAccount(account);
    }

    if (!hasSelectedCommunity() && !isOnboardingTarget && requestedPath === '/gestionale-cn') {
      return router.createUrlTree(['/gestionale-cn/onboarding-comunita']);
    }

    return true;
  }

  return router.createUrlTree(['/']);
};
