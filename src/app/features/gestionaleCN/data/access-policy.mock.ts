import { getCurrentCommunity } from './community-selection.storage';
import { Carisma, getPermessiByCarismi, normalizeCarismaForPermissions, PermessoOperativo } from './permessi-carisma.mock';

export type MenuItemKey =
    | 'dashboard'
    | 'comunita'
    | 'area-responsabile'
    | 'area-catechista'
    | 'censimento-comunita'
    | 'convivenze'
    | 'storico-convivenze'
    | 'posti-convivenza'
    | 'richieste-strutture'
    | 'viaggi'
    | 'profilo'
    | 'faq'
    | 'privacy'
    | 'admin';

export type ActionKey =
    | 'aggiungi-membro'
    | 'modifica-membro'
    | 'gestione-privacy'
    | 'nuova-convivenza'
    | 'nuovo-posto'
    | 'invia-richiesta-struttura'
    | 'censimento-comunita'
    | 'approvazioni';

export interface UserAccessContext {
    carismi: Carisma[];
    permessi: PermessoOperativo[];
    isFratelloSemplice: boolean;
    isResponsabile: boolean;
    isOstiario: boolean;
    isCatechista: boolean;
    isCollaboratoreConvivenze: boolean;
    communityId: string;
    communityName: string;
    childCommunityIds: string[];
    childCommunityNames: string[];
}

const PUBLIC_CONVIVENZA_STATES = new Set(['confermata', 'pubblicata', 'in_corso', 'in corso', 'conclusa', 'archiviata']);
const INTERNAL_CONVIVENZA_STATES = new Set(['bozza', 'richiesta', 'in_richiesta', 'in richiesta', 'in_approvazione', 'in approvazione', 'in attesa approvazione', 'da_approvare', 'approvazione', 'respinta']);

export function getUserAccessContext(): UserAccessContext {
    const community = getCurrentCommunity();
    const profile = readUserProfile();
    const carismi = normalizeCarismi(profile);
    const permessi = getPermessiByCarismi(carismi);
    const permessiOperativi = readOperativeValues(profile);
    const isResponsabile = carismi.includes('responsabile');
    const isOstiario = carismi.includes('ostiario');
    const isCatechista = carismi.includes('catechista') || profile?.isCatechista === true;
    const isCollaboratoreConvivenze = permessiOperativi.some((value) => value.includes('collaboratore convivenze') || value.includes('create_convivenza'));
    const childCommunities = community.comunitaFiglieAssociate ?? [];
    const communityName = `${community.nomeComunita} - ${community.parrocchiaNome}`;

    return {
        carismi,
        permessi,
        isFratelloSemplice: !isResponsabile && !isOstiario && !isCatechista && !isCollaboratoreConvivenze,
        isResponsabile,
        isOstiario,
        isCatechista,
        isCollaboratoreConvivenze,
        communityId: String(community.numeroComunita),
        communityName,
        childCommunityIds: childCommunities.map((item) => String(item.numeroComunita)),
        childCommunityNames: childCommunities.map((item) => `${item.numeroComunita}ª Comunità - ${item.parrocchiaNome}`)
    };
}

export function canSeeMenuItem(itemKey: MenuItemKey, userContext: UserAccessContext = getUserAccessContext()): boolean {
    switch (itemKey) {
        case 'dashboard':
        case 'comunita':
        case 'convivenze':
        case 'storico-convivenze':
        case 'viaggi':
        case 'profilo':
        case 'faq':
        case 'privacy':
            return true;
        case 'area-responsabile':
            return userContext.isResponsabile;
        case 'area-catechista':
            return userContext.isCatechista;
        case 'censimento-comunita':
            return userContext.isResponsabile;
        case 'posti-convivenza':
            return userContext.isResponsabile || userContext.isOstiario || userContext.isCollaboratoreConvivenze;
        case 'richieste-strutture':
            return userContext.isResponsabile;
        case 'admin':
            return false;
    }
}

export function canPerformAction(actionKey: ActionKey, userContext: UserAccessContext = getUserAccessContext()): boolean {
    switch (actionKey) {
        case 'aggiungi-membro':
        case 'modifica-membro':
        case 'gestione-privacy':
        case 'censimento-comunita':
        case 'approvazioni':
            return userContext.isResponsabile;
        case 'nuova-convivenza':
            return userContext.isResponsabile || userContext.isCollaboratoreConvivenze || userContext.permessi.includes('CREATE_CONVIVENZA');
        case 'nuovo-posto':
            return userContext.isResponsabile || userContext.isOstiario || userContext.isCollaboratoreConvivenze;
        case 'invia-richiesta-struttura':
            return userContext.isResponsabile;
    }
}

export function canSeeConvivenza(convivenza: any, userContext: UserAccessContext = getUserAccessContext()): boolean {
    const state = normalizeState(convivenza?.stato);

    if (userContext.isFratelloSemplice) {
        return matchesCurrentCommunity(convivenza, userContext) && PUBLIC_CONVIVENZA_STATES.has(state) && !INTERNAL_CONVIVENZA_STATES.has(state);
    }

    if (userContext.isResponsabile || userContext.isOstiario || userContext.isCollaboratoreConvivenze) {
        return matchesCurrentCommunity(convivenza, userContext);
    }

    if (userContext.isCatechista) {
        return matchesCurrentCommunity(convivenza, userContext) || matchesChildCommunity(convivenza, userContext);
    }

    return matchesCurrentCommunity(convivenza, userContext) && PUBLIC_CONVIVENZA_STATES.has(state);
}

export function isPublicConvivenzaState(stato: string | null | undefined): boolean {
    return PUBLIC_CONVIVENZA_STATES.has(normalizeState(stato));
}

function readUserProfile(): any {
    try {
        return JSON.parse(localStorage.getItem('onboardingUserProfile') ?? '{}');
    } catch {
        return {};
    }
}

function normalizeCarismi(profile: any): Carisma[] {
    const values: unknown[] = Array.isArray(profile?.carismi) ? profile.carismi : [profile?.ruoloComunitario];
    const carismi = values.map((value: unknown) => normalizeCarismaForPermissions(String(value ?? ''))).filter(Boolean);

    if (profile?.isCatechista === true) {
        carismi.push('catechista');
    }

    return Array.from(new Set(carismi.length ? carismi : ['membro']));
}

function readOperativeValues(profile: any): string[] {
    return [...(profile?.permessiOperativi ?? []), ...(profile?.ambitiOperativi ?? [])].map((value) => String(value).toLowerCase());
}

function normalizeState(value: string | null | undefined): string {
    return String(value ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function normalizeText(value: unknown): string {
    return String(value ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[–—]/g, '-');
}

function matchesCurrentCommunity(convivenza: any, userContext: UserAccessContext): boolean {
    const id = String(convivenza?.comunitaDestinatariaId ?? convivenza?.communityId ?? '');
    const name = normalizeText(convivenza?.comunitaDestinatariaNome ?? convivenza?.comunita ?? '');
    const communityName = normalizeText(userContext.communityName);

    return id === userContext.communityId || (!!name && (name.includes(communityName) || communityName.includes(name)));
}

function matchesChildCommunity(convivenza: any, userContext: UserAccessContext): boolean {
    const id = String(convivenza?.comunitaDestinatariaId ?? '');
    const name = normalizeText(convivenza?.comunitaDestinatariaNome ?? '');

    return userContext.childCommunityIds.includes(id) || userContext.childCommunityNames.some((childName) => {
        const normalized = normalizeText(childName);
        return name.includes(normalized) || normalized.includes(name);
    });
}
