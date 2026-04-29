import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { MsalService } from '@azure/msal-angular';

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

    return true;
  }

  return router.createUrlTree(['/']);
};
