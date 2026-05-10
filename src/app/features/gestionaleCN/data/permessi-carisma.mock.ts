export type Carisma =
    | 'presbitero'
    | 'responsabile'
    | 'corresponsabile'
    | 'ostiario'
    | 'catechista'
    | 'cantore'
    | 'lettore'
    | 'diacono'
    | 'didascalo'
    | 'membro';

export type PermessoOperativo =
    | 'VIEW_COMUNITA'
    | 'EDIT_COMUNITA'
    | 'VIEW_MEMBRI'
    | 'EDIT_MEMBRI'
    | 'VIEW_CONVIVENZE'
    | 'CREATE_CONVIVENZA'
    | 'EDIT_CONVIVENZA'
    | 'VIEW_NOTE'
    | 'EDIT_NOTE'
    | 'MANAGE_RUOLI'
    | 'APPROVE_REQUESTS'
    | 'VIEW_COMUNITA_FIGLIE'
    | 'CREATE_CONVIVENZA_FIGLIA';

export const PERMESSI_PER_CARISMA: Record<Carisma, PermessoOperativo[]> = {
    presbitero: [
        'VIEW_COMUNITA',
        'VIEW_MEMBRI',
        'VIEW_CONVIVENZE',
        'VIEW_NOTE'
    ],
    responsabile: [
        'VIEW_COMUNITA',
        'EDIT_COMUNITA',
        'VIEW_MEMBRI',
        'EDIT_MEMBRI',
        'VIEW_CONVIVENZE',
        'CREATE_CONVIVENZA',
        'EDIT_CONVIVENZA',
        'VIEW_NOTE',
        'EDIT_NOTE',
        'MANAGE_RUOLI',
        'APPROVE_REQUESTS'
    ],
    corresponsabile: [
        'VIEW_COMUNITA',
        'VIEW_MEMBRI',
        'VIEW_CONVIVENZE',
        'CREATE_CONVIVENZA',
        'VIEW_NOTE',
        'EDIT_NOTE'
    ],
    ostiario: [
        'VIEW_COMUNITA',
        'VIEW_MEMBRI',
        'VIEW_CONVIVENZE'
    ],
    catechista: [
        'VIEW_COMUNITA',
        'VIEW_MEMBRI',
        'VIEW_CONVIVENZE',
        'VIEW_NOTE',
        'VIEW_COMUNITA_FIGLIE',
        'CREATE_CONVIVENZA_FIGLIA'
    ],
    cantore: [
        'VIEW_COMUNITA',
        'VIEW_CONVIVENZE'
    ],
    lettore: [
        'VIEW_COMUNITA',
        'VIEW_CONVIVENZE'
    ],
    diacono: [
        'VIEW_COMUNITA',
        'VIEW_MEMBRI',
        'VIEW_CONVIVENZE',
        'VIEW_NOTE'
    ],
    didascalo: [
        'VIEW_COMUNITA',
        'VIEW_MEMBRI',
        'VIEW_CONVIVENZE',
        'VIEW_NOTE'
    ],
    membro: [
        'VIEW_COMUNITA'
    ]
};

export function getPermessiByCarismi(carismi: Carisma[]): PermessoOperativo[] {
    const permissions = new Set<PermessoOperativo>();

    for (const carisma of carismi) {
        for (const permission of PERMESSI_PER_CARISMA[carisma] ?? []) {
            permissions.add(permission);
        }
    }

    return Array.from(permissions);
}

export function normalizeCarismaForPermissions(value: string | null | undefined): Carisma {
    const normalized = (value ?? '').trim().toLowerCase();

    switch (normalized) {
        case 'presbitero':
        case 'prete':
            return 'presbitero';
        case 'responsabile':
            return 'responsabile';
        case 'corresponsabile':
            return 'corresponsabile';
        case 'ostiario':
            return 'ostiario';
        case 'catechista':
            return 'catechista';
        case 'cantore':
            return 'cantore';
        case 'lettore':
            return 'lettore';
        case 'diacono':
            return 'diacono';
        case 'didascalo':
        case 'didascalo/a':
            return 'didascalo';
        default:
            return 'membro';
    }
}

export function hasPermesso(carismi: Carisma[], permesso: PermessoOperativo): boolean {
    return getPermessiByCarismi(carismi).includes(permesso);
}
