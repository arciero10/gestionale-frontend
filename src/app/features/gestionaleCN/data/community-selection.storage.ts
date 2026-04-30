export const COMMUNITY_SELECTED_KEY = 'eventiComunità.communitySelected';
export const SELECTED_COMMUNITY_KEY = 'eventiComunità.selectedCommunity';

export interface SelectedCommunity {
    numero: number;
    nomeVisualizzato: string;
    parrocchiaId: number;
    parrocchiaNome: string;
    settoreId: number;
    settoreNome: string;
    diocesiId: number;
    diocesiNome: string;
}

export function hasSelectedCommunity(): boolean {
    return localStorage.getItem(COMMUNITY_SELECTED_KEY) === 'true';
}

export function saveSelectedCommunity(community: SelectedCommunity): void {
    localStorage.setItem(COMMUNITY_SELECTED_KEY, 'true');
    localStorage.setItem(SELECTED_COMMUNITY_KEY, JSON.stringify(community));
}

export function getSelectedCommunity(): SelectedCommunity | null {
    const raw = localStorage.getItem(SELECTED_COMMUNITY_KEY);

    if (!raw) {
        return null;
    }

    try {
        return JSON.parse(raw) as SelectedCommunity;
    } catch {
        return null;
    }
}
