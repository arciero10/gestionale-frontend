import { Carisma, getPermessiByCarismi, normalizeCarismaForPermissions } from './permessi-carisma.mock';

export type AccessContextId = 'comunita' | 'responsabile' | 'catechista' | 'collaboratore_convivenze';

export interface AccessContextOption {
    id: AccessContextId;
    label: string;
    description: string;
    icon: string;
    route: string;
}

export const SELECTED_ACCESS_CONTEXT_KEY = 'eventiComunità.selectedAccessContext';

export function getAccessContexts(): AccessContextOption[] {
    const carismi = readUserCarismi();
    const permissions = getPermessiByCarismi(carismi);
    const isResponsabile = carismi.includes('responsabile');
    const isCatechista = carismi.includes('catechista') && permissions.includes('VIEW_COMUNITA_FIGLIE');
    const contexts: AccessContextOption[] = [];

    if (isResponsabile) {
        contexts.push({
            id: 'responsabile',
            label: 'Area Responsabile',
            description: 'Gestisci censimento, tappa del Cammino e attività della comunità.',
            icon: 'pi pi-id-card',
            route: '/gestionale-cn/responsabile/dashboard'
        });
    } else {
        contexts.push({
            id: 'comunita',
            label: 'La mia comunità',
            description: 'Accedi alla dashboard e ai dati della tua comunità.',
            icon: 'pi pi-users',
            route: '/gestionale-cn/dashboard'
        });
    }

    if (isCatechista) {
        contexts.push({
            id: 'catechista',
            label: 'Area Catechista',
            description: 'Consulta comunità figlie, equipe e convivenze catechistiche.',
            icon: 'pi pi-sitemap',
            route: '/gestionale-cn/catechista/dashboard'
        });
    }

    if (!isResponsabile && !isCatechista && hasCollaboratoreConvivenze()) {
        contexts.push({
            id: 'collaboratore_convivenze',
            label: 'Collaboratore convivenze',
            description: 'Collabora alla gestione operativa delle convivenze autorizzate.',
            icon: 'pi pi-calendar-plus',
            route: '/gestionale-cn/convivenze'
        });
    }

    return contexts;
}

export function shouldChooseAccessContext(): boolean {
    return getAccessContexts().length > 1 && !getSelectedAccessContext();
}

export function ensureAccessContext(): AccessContextOption {
    const contexts = getAccessContexts();
    const selected = getSelectedAccessContext();
    const selectedContext = contexts.find((context) => context.id === selected);

    if (selectedContext) {
        return selectedContext;
    }

    const fallback = contexts[0];
    saveSelectedAccessContext(fallback.id);
    return fallback;
}

export function getSelectedAccessContext(): AccessContextId | null {
    const value = localStorage.getItem(SELECTED_ACCESS_CONTEXT_KEY) as AccessContextId | null;
    return value && getAccessContexts().some((context) => context.id === value) ? value : null;
}

export function saveSelectedAccessContext(context: AccessContextId): void {
    localStorage.setItem(SELECTED_ACCESS_CONTEXT_KEY, context);
}

function readUserCarismi(): Carisma[] {
    const raw = localStorage.getItem('onboardingUserProfile');

    if (!raw) {
        return ['responsabile'];
    }

    try {
        const profile = JSON.parse(raw) as { carismi?: string[]; ruoloComunitario?: string; isCatechista?: boolean };
        const carismi = new Set<Carisma>();

        if (Array.isArray(profile.carismi)) {
            profile.carismi.forEach((carisma) => carismi.add(normalizeCarismaForPermissions(carisma)));
        } else {
            carismi.add(normalizeCarismaForPermissions(profile.ruoloComunitario));
        }

        if (profile.isCatechista === true) {
            carismi.add('catechista');
        }

        return Array.from(carismi);
    } catch {
        return ['responsabile'];
    }
}

function hasCollaboratoreConvivenze(): boolean {
    const raw = localStorage.getItem('onboardingUserProfile');

    if (!raw) {
        return false;
    }

    try {
        const profile = JSON.parse(raw) as { permessiOperativi?: string[]; ambitiOperativi?: string[] };
        const values = [...(profile.permessiOperativi ?? []), ...(profile.ambitiOperativi ?? [])].map((value) => value.toLowerCase());
        return values.some((value) => value.includes('collaboratore convivenze') || value.includes('create_convivenza'));
    } catch {
        return false;
    }
}
