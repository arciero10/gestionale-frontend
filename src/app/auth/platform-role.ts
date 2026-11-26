import type {CurrentUserContext} from './current-user-context';

export function hasVerifiedGlobalAdmin(context: CurrentUserContext | null | undefined): boolean {
  return context?.authenticated === true && context.status !== 'INACTIVE' &&
    Array.isArray(context.platformRoles) && context.platformRoles.includes('GLOBAL_ADMIN');
}

export function communityAssociationNotice(context: CurrentUserContext | null | undefined): string | null {
  if (context?.authenticated !== true || context.linkedToCommunity || hasVerifiedGlobalAdmin(context)) return null;
  if (context.status === 'INACTIVE') return 'Account non attivo. Contatta l’amministrazione.';
  if (context.isOnboardingAdmin === true) return 'Accesso alle approvazioni verificato. Nessuna appartenenza comunitaria richiesta.';
  return context.status === 'IN_ATTESA_APPROVAZIONE'
    ? 'Richiesta di appartenenza in attesa di approvazione.'
    : 'Il tuo account deve ancora essere associato a una comunità.';
}
