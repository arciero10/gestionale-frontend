export const COMMUNITY_ONBOARDING_ROLES = [
  { label: 'Fratello / Sorella (nessun carisma)', value: '', backend: 'MEMBER' },
  { label: 'Responsabile', value: 'responsabile', backend: 'RESPONSIBLE' },
  { label: 'Corresponsabile', value: 'corresponsabile', backend: 'CO_RESPONSIBLE' },
  { label: 'Cantore', value: 'cantore', backend: 'CANTOR' },
  { label: 'Presbitero', value: 'presbitero', backend: 'PRESBYTER' },
  { label: 'Diacono', value: 'diacono', backend: 'DEACON' },
  { label: 'Lettore', value: 'lettore', backend: 'LECTOR' },
  { label: 'Ostiario', value: 'ostiario', backend: 'OSTIARIO' },
  { label: 'Didascalo/a', value: 'didascalo', backend: 'DIDASCAL' }
] as const;

export function communityRoleLabel(role: string): string {
  return COMMUNITY_ONBOARDING_ROLES.find(x => x.backend === role)?.label ?? 'Incarico non ordinario';
}
