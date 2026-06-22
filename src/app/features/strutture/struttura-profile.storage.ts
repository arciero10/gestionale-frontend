export type ProfileType = 'comunita' | 'struttura';
export type ProfileStatus = 'BOZZA' | 'IN_ATTESA' | 'APPROVATA' | 'RESPINTA' | 'SOSPESA';

export type CategoriaFotoStruttura = 'copertina' | 'camere' | 'sale' | 'cappella' | 'mensa' | 'esterni' | 'spazi comuni' | 'servizi' | 'altro';

export interface FotoStrutturaMock {
    id: string;
    categoria: CategoriaFotoStruttura;
    url: string;
    descrizione: string;
    copertina?: boolean;
    isCover?: boolean;
    createdAt?: string;
}

export interface PromoStrutturaMock {
    id: string;
    titolo: string;
    descrizione: string;
    validaDal: string;
    validaAl: string;
    attiva: boolean;
}

export interface StrutturaProfileMock {
    id: string;
    nome: string;
    tipo: string;
    descrizione: string;
    indirizzo: string;
    citta: string;
    regione: string;
    referente: string;
    telefono: string;
    email: string;
    capienza: number | null;
    postiLetto: number | null;
    camere: number | null;
    sale: string;
    cappella: boolean;
    mensa: boolean;
    cucinaInterna: boolean;
    parcheggio: boolean;
    accessibilitaDisabili: boolean;
    spaziEsterni: boolean;
    famiglieConBambini: boolean;
    tariffeIndicative: string;
    condizioniCaparra: string;
    condizioniCancellazione: string;
    foto: FotoStrutturaMock[];
    promo: PromoStrutturaMock[];
    updatedAt: string;
}

export const PROFILE_TYPE_KEY = 'profileType';
export const PROFILE_STATUS_KEY = 'profileStatus';
export const STRUTTURA_PROFILE_KEY = 'strutturaProfile';

export const STRUTTURA_PROFILE_DEFAULT: StrutturaProfileMock = {
    id: 'struttura-demo-local',
    nome: 'Casa di accoglienza San Lorenzo',
    tipo: 'Struttura di accoglienza',
    descrizione: 'Struttura adatta a convivenze, incontri comunitari e giornate di ritiro.',
    indirizzo: 'Via del Pellegrino 12',
    citta: 'Roma',
    regione: 'Lazio',
    referente: 'Referente struttura',
    telefono: '',
    email: '',
    capienza: 80,
    postiLetto: 60,
    camere: 24,
    sale: '2 sale incontri',
    cappella: true,
    mensa: true,
    cucinaInterna: true,
    parcheggio: true,
    accessibilitaDisabili: false,
    spaziEsterni: true,
    famiglieConBambini: true,
    tariffeIndicative: 'Da concordare in base al periodo e al numero di partecipanti.',
    condizioniCaparra: 'Caparra da definire in fase di conferma.',
    condizioniCancellazione: 'Cancellazione secondo accordo con la struttura.',
    foto: [
        {
            id: 'foto-copertina',
            categoria: 'copertina',
            url: '/images/backgrounds/posti-convivenza-bg.jpg',
            descrizione: 'Foto copertina struttura',
            copertina: true,
            isCover: true,
            createdAt: ''
        }
    ],
    promo: [
        {
            id: 'promo-bassa-stagione',
            titolo: 'Promo bassa stagione',
            descrizione: 'Disponibilita indicativa per gruppi in periodi non festivi.',
            validaDal: '',
            validaAl: '',
            attiva: true
        }
    ],
    updatedAt: ''
};

const storageAvailable = () => typeof localStorage !== 'undefined';

export function readProfileType(): ProfileType {
    if (!storageAvailable()) {
        return 'comunita';
    }

    return localStorage.getItem(PROFILE_TYPE_KEY) === 'struttura' ? 'struttura' : 'comunita';
}

export function readProfileStatus(): ProfileStatus {
    if (!storageAvailable()) {
        return 'BOZZA';
    }

    return normalizeProfileStatus(localStorage.getItem(PROFILE_STATUS_KEY));
}

export function readStrutturaProfile(): StrutturaProfileMock | null {
    if (!storageAvailable()) {
        return null;
    }

    const raw = localStorage.getItem(STRUTTURA_PROFILE_KEY);
    if (!raw) {
        return null;
    }

    try {
        return normalizeStrutturaProfile(JSON.parse(raw) as Partial<StrutturaProfileMock>);
    } catch {
        return null;
    }
}

export function saveStrutturaProfile(profile: StrutturaProfileMock, status: ProfileStatus = 'IN_ATTESA') {
    if (!storageAvailable()) {
        return;
    }

    localStorage.setItem(PROFILE_TYPE_KEY, 'struttura');
    localStorage.setItem(PROFILE_STATUS_KEY, normalizeProfileStatus(status));
    localStorage.setItem(STRUTTURA_PROFILE_KEY, JSON.stringify(normalizeStrutturaProfile({ ...profile, updatedAt: new Date().toISOString() })));
}

export function activePromo(profile: StrutturaProfileMock | null): PromoStrutturaMock[] {
    if (!profile) {
        return [];
    }

    const today = new Date().toISOString().slice(0, 10);
    return profile.promo.filter((promo) => {
        const afterStart = !promo.validaDal || promo.validaDal <= today;
        const beforeEnd = !promo.validaAl || promo.validaAl >= today;
        return promo.attiva && afterStart && beforeEnd;
    });
}

export function fotoCopertina(profile: StrutturaProfileMock | null): string {
    return profile?.foto.find((foto) => foto.copertina || foto.isCover)?.url || profile?.foto[0]?.url || '/images/backgrounds/posti-convivenza-bg.jpg';
}

export function normalizeProfileStatus(value: string | null | undefined): ProfileStatus {
    switch (value) {
        case 'APPROVATA':
        case 'IN_ATTESA':
        case 'SOSPESA':
        case 'BOZZA':
            return value;
        case 'RIFIUTATA':
        case 'RESPINTA':
            return 'RESPINTA';
        default:
            return 'BOZZA';
    }
}

export function statusLabelStruttura(status: ProfileStatus): string {
    const labels: Record<ProfileStatus, string> = {
        BOZZA: 'Bozza',
        IN_ATTESA: 'In attesa',
        APPROVATA: 'Approvata',
        RESPINTA: 'Respinta',
        SOSPESA: 'Sospesa'
    };
    return labels[status];
}

export function normalizeStrutturaProfile(profile: Partial<StrutturaProfileMock>): StrutturaProfileMock {
    const merged: StrutturaProfileMock = {
        ...STRUTTURA_PROFILE_DEFAULT,
        ...profile,
        foto: Array.isArray(profile.foto) ? profile.foto : [],
        promo: Array.isArray(profile.promo) ? profile.promo : []
    };

    const foto = merged.foto.map((item, index) => {
        const isCover = Boolean(item.copertina || item.isCover || (!merged.foto.some((fotoItem) => fotoItem.copertina || fotoItem.isCover) && index === 0));
        return {
            ...item,
            id: item.id || `foto-${index}`,
            categoria: item.categoria || 'altro',
            descrizione: item.descrizione || item.categoria || 'Foto struttura',
            copertina: isCover,
            isCover,
            createdAt: item.createdAt || merged.updatedAt || new Date().toISOString()
        };
    });

    return { ...merged, foto };
}
