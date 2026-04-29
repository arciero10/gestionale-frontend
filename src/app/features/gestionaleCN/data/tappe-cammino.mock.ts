export const TAPPE_CAMMINO = [
    'Precatecumenato',
    '1 Scrutinio',
    'Shemà',
    '2 Scrutinio',
    'Iniziazione Alla Preghiera',
    'Traditio',
    'Redditio',
    'Padrenostro',
    "1 Chiamata All'Elezione",
    "2 Chiamata All'Elezione",
    "3 Chiamata All'Elezione"
] as const;

export const TIPI_CONVIVENZA_ORDINARIA = ['Inizio Corso', 'Riporto', 'Pentecoste'] as const;

export const TIPI_CONVIVENZA = [...TAPPE_CAMMINO, ...TIPI_CONVIVENZA_ORDINARIA] as const;

export type TappaCammino = (typeof TAPPE_CAMMINO)[number];
export type TipoConvivenza = (typeof TIPI_CONVIVENZA)[number];

export function isTappaCammino(tipo: TipoConvivenza): boolean {
    return TAPPE_CAMMINO.includes(tipo as TappaCammino);
}
