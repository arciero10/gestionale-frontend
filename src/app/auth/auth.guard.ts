import { AuthGuardData, createAuthGuard } from 'keycloak-angular';
import { ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { inject } from '@angular/core';

/**
 * The logic below is a simple example, please make it more robust when implementing in your application.
 *
 * Reason: isAccessGranted is not validating the resource, since it is merging all roles. Two resources might
 * have the same role name and it makes sense to validate it more granular.
 */
const isAccessAllowed = async (
  route: ActivatedRouteSnapshot,
  __: RouterStateSnapshot,
  authData: AuthGuardData
): Promise<boolean | UrlTree> => {
  const { authenticated, grantedRoles } = authData;
 console.log(authData);
  const requiredRoles = route.data['role'] as string[] || [];;
  
  if (requiredRoles.length === 0) {
    // Se non sono richiesti ruoli specifici, l'accesso è concesso (solo per utenti autenticati)
    return true;
  }

  const userRealmRoles: string[] = grantedRoles.realmRoles || [];

  // 3. Logica OR: L'utente deve avere ALMENO UNO dei ruoli richiesti
  const hasRequiredRole = requiredRoles.some(requiredRole =>
    userRealmRoles.includes(requiredRole)
  );

  if (authenticated && hasRequiredRole) {
    return true;
  }
  else {
  const router = inject(Router);
  return true;
  }
};

export const canActivateAuthRole = createAuthGuard<CanActivateFn>(isAccessAllowed);