import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { MsalService } from '@azure/msal-angular';
import { getAppUserStatus, hasAppUserProfile } from '../features/gestionaleCN/data/app-user-profile.storage';

const ONBOARDING_URL = '/gestionale-cn/onboarding-comunita';

export const gestionaleAuthGuard: CanMatchFn = () => {
  const msalService = inject(MsalService);
  const router = inject(Router);

  const activeAccount = msalService.instance.getActiveAccount();
  const accounts = msalService.instance.getAllAccounts();
  const account = activeAccount ?? accounts[0];

  if (account) {
    if (!activeAccount) {
      msalService.instance.setActiveAccount(account);
    }

    const currentPath = window.location.pathname;

    if (!hasAppUserProfile() && currentPath !== ONBOARDING_URL) {
      return router.createUrlTree(['/gestionale-cn/onboarding-comunita']);
    }

    if (hasAppUserProfile() && getAppUserStatus() === 'approved') {
      return true;
    }

    if (currentPath === ONBOARDING_URL || currentPath.startsWith('/gestionale-cn/')) {
      return true;
    }

    return true;
  }

  return router.createUrlTree(['/']);
};
