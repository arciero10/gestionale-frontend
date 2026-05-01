import { COMUNITA_ATTIVA_MOCK, DIOCESI_MOCK, PARROCCHIE_MOCK, SETTORI_MOCK, StatoVerificaParrocchia, generaNomeComunita } from './anagrafica-ecclesiale.mock';

export const COMMUNITY_SELECTED_KEY = 'eventiComunit\u00e0.communitySelected';
export const SELECTED_COMMUNITY_KEY = 'eventiComunit\u00e0.selectedCommunity';
const LEGACY_COMMUNITY_SELECTED_KEY = 'eventiComunitÃ .communitySelected';
const LEGACY_SELECTED_COMMUNITY_KEY = 'eventiComunitÃ .selectedCommunity';

export interface SelectedCommunity {
    communitySelected: true;
    numeroComunita: number;
    nomeComunita: string;
    parrocchiaNome: string;
    diocesiNome: string;
    settoreNome: string;
    parrocchiaManuale: boolean;
    statoVerifica: StatoVerificaParrocchia;
    dataSelezione: string;
    parrocchiaId?: number;
    settoreId?: number;
    diocesiId?: number;
    comune?: string;
    indirizzo?: string;
}

export interface CurrentCommunity extends SelectedCommunity {
    isPilot: boolean;
}

export function hasSelectedCommunity(): boolean {
    return getSelectedCommunity()?.communitySelected === true;
}

export function saveSelectedCommunity(community: SelectedCommunity): void {
    localStorage.setItem(COMMUNITY_SELECTED_KEY, 'true');
    localStorage.removeItem(LEGACY_COMMUNITY_SELECTED_KEY);
    localStorage.removeItem(LEGACY_SELECTED_COMMUNITY_KEY);
    localStorage.setItem(SELECTED_COMMUNITY_KEY, JSON.stringify(community));
}

export function getSelectedCommunity(): SelectedCommunity | null {
    const raw = localStorage.getItem(SELECTED_COMMUNITY_KEY) ?? localStorage.getItem(LEGACY_SELECTED_COMMUNITY_KEY);

    if (!raw) {
        return null;
    }

    try {
        return normalizeSelectedCommunity(JSON.parse(raw));
    } catch {
        return null;
    }
}

export function getCurrentCommunity(): CurrentCommunity {
    const selected = getSelectedCommunity();

    if (selected?.communitySelected) {
        return { ...selected, isPilot: isPilotSelection(selected) };
    }

    const parrocchia = PARROCCHIE_MOCK.find((item) => item.id === COMUNITA_ATTIVA_MOCK.parrocchiaId);
    const settore = SETTORI_MOCK.find((item) => item.id === COMUNITA_ATTIVA_MOCK.settoreId);
    const diocesi = DIOCESI_MOCK.find((item) => item.id === COMUNITA_ATTIVA_MOCK.diocesiId);

    return {
        communitySelected: true,
        numeroComunita: COMUNITA_ATTIVA_MOCK.numero,
        nomeComunita: generaNomeComunita(COMUNITA_ATTIVA_MOCK.numero),
        parrocchiaId: COMUNITA_ATTIVA_MOCK.parrocchiaId,
        parrocchiaNome: parrocchia?.nome ?? 'S. Maria delle Grazie alle Fornaci',
        settoreId: COMUNITA_ATTIVA_MOCK.settoreId,
        settoreNome: settore?.nome ?? 'Ovest',
        diocesiId: COMUNITA_ATTIVA_MOCK.diocesiId,
        diocesiNome: diocesi?.nome ?? 'Diocesi di Roma',
        parrocchiaManuale: false,
        statoVerifica: 'Verificata',
        dataSelezione: '',
        isPilot: true
    };
}

export function clearSelectedCommunity(): void {
    localStorage.removeItem(COMMUNITY_SELECTED_KEY);
    localStorage.removeItem(SELECTED_COMMUNITY_KEY);
    localStorage.removeItem(LEGACY_COMMUNITY_SELECTED_KEY);
    localStorage.removeItem(LEGACY_SELECTED_COMMUNITY_KEY);
}

function normalizeSelectedCommunity(raw: any): SelectedCommunity | null {
    if (!raw) {
        return null;
    }

    if (raw.communitySelected === true && typeof raw.numeroComunita === 'number') {
        return raw as SelectedCommunity;
    }

    if (typeof raw.numero === 'number' && raw.parrocchiaNome) {
        return {
            communitySelected: true,
            numeroComunita: raw.numero,
            nomeComunita: raw.nomeVisualizzato?.split(' â€“ ')[0] ?? generaNomeComunita(raw.numero),
            parrocchiaId: raw.parrocchiaId,
            parrocchiaNome: raw.parrocchiaNome,
            settoreId: raw.settoreId,
            settoreNome: raw.settoreNome,
            diocesiId: raw.diocesiId,
            diocesiNome: raw.diocesiNome,
            parrocchiaManuale: raw.parrocchiaId === -1,
            statoVerifica: raw.parrocchiaId === -1 ? 'Inserita manualmente' : 'Verificata',
            dataSelezione: new Date().toISOString()
        };
    }

    return null;
}

function isPilotSelection(community: SelectedCommunity): boolean {
    return community.numeroComunita === COMUNITA_ATTIVA_MOCK.numero && community.parrocchiaId === COMUNITA_ATTIVA_MOCK.parrocchiaId && community.parrocchiaManuale === false;
}
