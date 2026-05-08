export const STATO_INIZIALE_CAMMINO = 'Precatecumenato' as const;

export const TAPPE_UFFICIALI_CAMMINO = [
    '1° Scrutinio',
    'Shemà',
    '2° Scrutinio',
    'Iniziazione alla Preghiera',
    'Traditio',
    'Redditio',
    '1ª Chiamata del Padre Nostro',
    'Tappa di Loreto',
    'Chiusura del Padre Nostro',
    '1ª Chiamata all’Elezione',
    '2ª Chiamata all’Elezione',
    '3ª Chiamata all’Elezione',
    'Rinnovate Promesse Battesimali',
    'Matrimonio Spirituale'
] as const;

export const TAPPE_CAMMINO = [STATO_INIZIALE_CAMMINO, ...TAPPE_UFFICIALI_CAMMINO] as const;

export const TIPI_CONVIVENZA_ANNUALE = ['Convivenza domenicale', 'Inizio Corso', 'Riporto', 'Pentecoste', 'Altro'] as const;
export const TIPI_CONVIVENZA_CATECHISTICA = [...TAPPE_UFFICIALI_CAMMINO] as const;
export const TIPI_CONVIVENZA = [...TIPI_CONVIVENZA_CATECHISTICA, ...TIPI_CONVIVENZA_ANNUALE] as const;

export const DESCRIZIONI_CONVIVENZE_ORDINARIE = {
    'Convivenza domenicale': 'Convivenza comunitaria ordinaria o domenicale.',
    'Inizio Corso': 'Convivenza/evento di inizio corso pastorale.',
    Riporto: 'Convivenza annuale a discrezione della comunità, normalmente da ottobre in poi.',
    Pentecoste: 'Convivenza annuale nel weekend di Pentecoste.',
    Altro: 'Evento o convivenza da classificare.'
} as const;

export type StatoInizialeCammino = typeof STATO_INIZIALE_CAMMINO;
export type TappaUfficialeCammino = (typeof TAPPE_UFFICIALI_CAMMINO)[number];
export type TappaCammino = (typeof TAPPE_CAMMINO)[number];
export type TipoConvivenza = (typeof TIPI_CONVIVENZA)[number];
export type TipoConvivenzaAnnuale = (typeof TIPI_CONVIVENZA_ANNUALE)[number];
export type TipoConvivenzaCatechistica = (typeof TIPI_CONVIVENZA_CATECHISTICA)[number];
export type CategoriaConvivenza = 'Catechistica' | 'Annuale' | 'Comunitaria' | 'Organizzativa' | 'Viaggio/Pellegrinaggio';
export type SoggettoOrganizzatoreConvivenza = 'Equipe dei catechisti' | 'Comunità' | 'Altro';

const TAPPE_LEGACY_MAP: Record<string, TappaCammino> = {
    precatecumenato: STATO_INIZIALE_CAMMINO,
    '1 scrutinio': '1° Scrutinio',
    '1° scrutinio': '1° Scrutinio',
    '2 scrutinio': '2° Scrutinio',
    '2° scrutinio': '2° Scrutinio',
    shema: 'Shemà',
    'shemà': 'Shemà',
    '1 chiamata del padre nostro': '1ª Chiamata del Padre Nostro',
    '1ª chiamata del padre nostro': '1ª Chiamata del Padre Nostro',
    'chiusura del padre nostro': 'Chiusura del Padre Nostro',
    'padre nostro': 'Chiusura del Padre Nostro',
    padrenostro: 'Chiusura del Padre Nostro',
    "1 chiamata all'elezione": '1ª Chiamata all’Elezione',
    "1ª chiamata all'elezione": '1ª Chiamata all’Elezione',
    "2 chiamata all'elezione": '2ª Chiamata all’Elezione',
    "2ª chiamata all'elezione": '2ª Chiamata all’Elezione',
    "3 chiamata all'elezione": '3ª Chiamata all’Elezione',
    "3ª chiamata all'elezione": '3ª Chiamata all’Elezione'
};

export function isTappaCammino(tipo: string): boolean {
    const compact = normalizeKey(tipo);
    return TAPPE_CAMMINO.some((tappa) => normalizeKey(tappa) === compact) || compact in TAPPE_LEGACY_MAP;
}

export function isTipoConvivenzaCatechistica(tipo: string): boolean {
    return TIPI_CONVIVENZA_CATECHISTICA.includes(normalizeTappaCammino(tipo) as TipoConvivenzaCatechistica);
}

export function normalizeTappaCammino(value: string): TappaCammino {
    const compact = normalizeKey(value);
    const normalized = TAPPE_LEGACY_MAP[compact] ?? value;
    return TAPPE_CAMMINO.includes(normalized as TappaCammino) ? (normalized as TappaCammino) : STATO_INIZIALE_CAMMINO;
}

export function normalizeTipoConvivenza(value: string): TipoConvivenza {
    const compact = normalizeKey(value);
    const direct = TIPI_CONVIVENZA.find((tipo) => normalizeKey(tipo) === compact);
    if (direct) {
        return direct;
    }

    const legacyMap: Record<string, TipoConvivenza> = {
        'domenica di convivenza': 'Convivenza domenicale',
        'convivenza domenicale': 'Convivenza domenicale'
    };
    const candidate = legacyMap[compact] ?? normalizeTappaCammino(value);
    return TIPI_CONVIVENZA.includes(candidate as TipoConvivenza) ? (candidate as TipoConvivenza) : 'Altro';
}

function normalizeKey(value: string): string {
    return value.trim().toLocaleLowerCase('it-IT').replace(/[’']/g, "'").replace(/\s+/g, ' ');
}
