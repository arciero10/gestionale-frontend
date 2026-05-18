import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { MsalService } from '@azure/msal-angular';
import { hasSelectedCommunity } from '../features/gestionaleCN/data/community-selection.storage';

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

    if (!hasSelectedCommunity() && currentPath !== ONBOARDING_URL) {
      return router.createUrlTree(['/gestionale-cn/onboarding-comunita']);
    }

    return true;
  }

  return router.createUrlTree(['/gestionale-cn/onboarding-comunita']);
};
