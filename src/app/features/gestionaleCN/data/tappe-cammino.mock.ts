export const TAPPE_CAMMINO = [
    'Precatecumenato',
    '1° Scrutinio',
    'Shemà',
    '2° Scrutinio',
    'Iniziazione alla Preghiera',
    'Traditio',
    'Redditio',
    'Padre Nostro',
    "1ª Chiamata all’Elezione",
    "2ª Chiamata all’Elezione",
    "3ª Chiamata all’Elezione"
] as const;

export const TIPI_CONVIVENZA_ORDINARIA = ['Inizio Corso', 'Riporto', 'Pentecoste'] as const;
export const DESCRIZIONI_CONVIVENZE_ORDINARIE = {
    'Inizio Corso': 'Convivenza/evento di inizio corso pastorale.',
    Riporto: 'Convivenza annuale a discrezione della comunità, normalmente da ottobre in poi.',
    Pentecoste: 'Convivenza annuale nel weekend di Pentecoste.'
} as const;

export const TIPI_CONVIVENZA = [...TAPPE_CAMMINO, ...TIPI_CONVIVENZA_ORDINARIA] as const;

export type TappaCammino = (typeof TAPPE_CAMMINO)[number];
export type TipoConvivenza = (typeof TIPI_CONVIVENZA)[number];

export function isTappaCammino(tipo: TipoConvivenza): boolean {
    return TAPPE_CAMMINO.includes(tipo as TappaCammino);
}

export function normalizeTappaCammino(value: string): TappaCammino {
    const legacyMap: Record<string, TappaCammino> = {
        '1 Scrutinio': '1° Scrutinio',
        '2 Scrutinio': '2° Scrutinio',
        "1 Chiamata all’Elezione": "1ª Chiamata all’Elezione",
        "2 Chiamata all’Elezione": "2ª Chiamata all’Elezione",
        "3 Chiamata all’Elezione": "3ª Chiamata all’Elezione"
    };
    const normalized = legacyMap[value] ?? value;
    return TAPPE_CAMMINO.includes(normalized as TappaCammino) ? (normalized as TappaCammino) : 'Precatecumenato';
}
