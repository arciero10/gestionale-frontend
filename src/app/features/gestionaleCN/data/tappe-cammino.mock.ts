export const TAPPE_CAMMINO = [
    'Precatecumenato',
    '1° Scrutinio',
    'Shemà',
    '2° Scrutinio',
    'Iniziazione alla Preghiera',
    'Traditio',
    'Redditio',
    '1ª Chiamata del Padre Nostro',
    'Tappa di Loreto',
    'Chiusura del Padre Nostro',
    'Padre Nostro',
    '1ª Chiamata all’Elezione',
    '2ª Chiamata all’Elezione',
    '3ª Chiamata all’Elezione'
] as const;

export const TIPI_CONVIVENZA_ANNUALE = ['Domenica di convivenza', 'Inizio Corso', 'Riporto', 'Pentecoste', 'Altro'] as const;
export const TIPI_CONVIVENZA_CATECHISTICA = TAPPE_CAMMINO.filter((tappa) => tappa !== 'Precatecumenato') as Exclude<TappaCammino, 'Precatecumenato'>[];
export const TIPI_CONVIVENZA = [...TIPI_CONVIVENZA_CATECHISTICA, ...TIPI_CONVIVENZA_ANNUALE] as const;

export const DESCRIZIONI_CONVIVENZE_ORDINARIE = {
    'Domenica di convivenza': 'Convivenza comunitaria ordinaria o domenica di convivenza.',
    'Inizio Corso': 'Convivenza/evento di inizio corso pastorale.',
    Riporto: 'Convivenza annuale a discrezione della comunità, normalmente da ottobre in poi.',
    Pentecoste: 'Convivenza annuale nel weekend di Pentecoste.',
    Altro: 'Evento o convivenza da classificare.'
} as const;

export type TappaCammino = (typeof TAPPE_CAMMINO)[number];
export type TipoConvivenza = (typeof TIPI_CONVIVENZA)[number];
export type TipoConvivenzaAnnuale = (typeof TIPI_CONVIVENZA_ANNUALE)[number];
export type TipoConvivenzaCatechistica = (typeof TIPI_CONVIVENZA_CATECHISTICA)[number];
export type CategoriaConvivenza = 'Catechistica' | 'Annuale' | 'Comunitaria' | 'Organizzativa' | 'Viaggio/Pellegrinaggio';
export type SoggettoOrganizzatoreConvivenza = 'Equipe dei catechisti' | 'Comunità' | 'Altro';

export function isTappaCammino(tipo: string): boolean {
    return TAPPE_CAMMINO.includes(tipo as TappaCammino);
}

export function isTipoConvivenzaCatechistica(tipo: string): boolean {
    return TIPI_CONVIVENZA_CATECHISTICA.includes(tipo as TipoConvivenzaCatechistica);
}

export function normalizeTappaCammino(value: string): TappaCammino {
    const compact = value.trim().toLocaleLowerCase('it-IT').replace(/[’']/g, "'").replace(/\s+/g, ' ');
    const legacyMap: Record<string, TappaCammino> = {
        '1 scrutinio': '1° Scrutinio',
        '1° scrutinio': '1° Scrutinio',
        '2 scrutinio': '2° Scrutinio',
        '2° scrutinio': '2° Scrutinio',
        shema: 'Shemà',
        'shemà': 'Shemà',
        '1 chiamata del padre nostro': '1ª Chiamata del Padre Nostro',
        '1ª chiamata del padre nostro': '1ª Chiamata del Padre Nostro',
        'chiusura del padre nostro': 'Chiusura del Padre Nostro',
        "1 chiamata all'elezione": '1ª Chiamata all’Elezione',
        "1ª chiamata all'elezione": '1ª Chiamata all’Elezione',
        "2 chiamata all'elezione": '2ª Chiamata all’Elezione',
        "2ª chiamata all'elezione": '2ª Chiamata all’Elezione',
        "3 chiamata all'elezione": '3ª Chiamata all’Elezione',
        "3ª chiamata all'elezione": '3ª Chiamata all’Elezione',
        'padrenostro': 'Padre Nostro'
    };
    const normalized = legacyMap[compact] ?? value;
    return TAPPE_CAMMINO.includes(normalized as TappaCammino) ? (normalized as TappaCammino) : 'Precatecumenato';
}
