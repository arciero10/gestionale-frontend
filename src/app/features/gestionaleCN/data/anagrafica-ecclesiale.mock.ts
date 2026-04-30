export type StatoVerificaParrocchia = 'Verificata' | 'Da verificare' | 'Inserita manualmente';
export type FonteParrocchia = 'Mock iniziale' | 'Elenco caricato' | 'Inserita utente' | 'Da verificare';

export interface Diocesi {
    id: number;
    nome: string;
    regioneEcclesiastica?: string;
    note?: string;
}

export interface Settore {
    id: number;
    nome: string;
    diocesiId: number;
    note?: string;
}

export interface Parrocchia {
    id: number;
    nome: string;
    diocesiId: number;
    settoreId: number;
    note: string;
    nomeNormalizzato: string;
    diocesiNome: string;
    settoreNome: string;
    provincia: string;
    comune: string;
    indirizzo: string;
    fonte: FonteParrocchia;
    statoVerifica: StatoVerificaParrocchia;
}

export interface ComunitaAttiva {
    id: number;
    numero: number;
    nomeVisualizzato: string;
    diocesiId: number;
    settoreId: number;
    parrocchiaId: number;
    tappaCammino: string;
    responsabilePrincipale: string;
    note: string;
}

export const DIOCESI_LAZIO: Diocesi[] = [
    { id: 1, nome: 'Diocesi di Roma', regioneEcclesiastica: 'Lazio' },
    { id: 2, nome: 'Sede suburbicaria di Porto-Santa Rufina', regioneEcclesiastica: 'Lazio' },
    { id: 3, nome: 'Sede suburbicaria di Albano', regioneEcclesiastica: 'Lazio' },
    { id: 4, nome: 'Sede suburbicaria di Frascati', regioneEcclesiastica: 'Lazio' },
    { id: 5, nome: 'Sede suburbicaria di Ostia', regioneEcclesiastica: 'Lazio' },
    { id: 6, nome: 'Sede suburbicaria di Palestrina', regioneEcclesiastica: 'Lazio' },
    { id: 7, nome: 'Sede suburbicaria di Sabina-Poggio Mirteto', regioneEcclesiastica: 'Lazio' },
    { id: 8, nome: 'Sede suburbicaria di Velletri-Segni', regioneEcclesiastica: 'Lazio' },
    { id: 9, nome: 'Arcidiocesi di Gaeta', regioneEcclesiastica: 'Lazio' },
    { id: 10, nome: 'Diocesi di Anagni-Alatri', regioneEcclesiastica: 'Lazio' },
    { id: 11, nome: 'Diocesi di Civita Castellana', regioneEcclesiastica: 'Lazio' },
    { id: 12, nome: 'Diocesi di Civitavecchia-Tarquinia', regioneEcclesiastica: 'Lazio' },
    { id: 13, nome: 'Diocesi di Frosinone-Veroli-Ferentino', regioneEcclesiastica: 'Lazio' },
    { id: 14, nome: 'Diocesi di Latina-Terracina-Sezze-Priverno', regioneEcclesiastica: 'Lazio' },
    { id: 15, nome: 'Diocesi di Rieti', regioneEcclesiastica: 'Lazio' },
    { id: 16, nome: 'Diocesi di Sora-Cassino-Aquino-Pontecorvo', regioneEcclesiastica: 'Lazio' },
    { id: 17, nome: 'Diocesi di Tivoli', regioneEcclesiastica: 'Lazio' },
    { id: 18, nome: 'Diocesi di Viterbo', regioneEcclesiastica: 'Lazio' },
    { id: 19, nome: 'Abbazia territoriale di Montecassino', regioneEcclesiastica: 'Lazio' },
    { id: 20, nome: 'Abbazia territoriale di Santa Maria di Grottaferrata', regioneEcclesiastica: 'Lazio' },
    { id: 21, nome: 'Abbazia territoriale di Subiaco', regioneEcclesiastica: 'Lazio' }
];

const settoreRoma = (id: number, nome: string): Settore => ({ id, nome, diocesiId: 1 });
const settoreNonApplicabile = (id: number, diocesiId: number): Settore => ({ id, nome: 'Non applicabile', diocesiId });

export const SETTORI: Settore[] = [
    settoreRoma(1, 'Sud'),
    settoreRoma(2, 'Ovest'),
    settoreNonApplicabile(3, 2),
    settoreRoma(4, 'Nord'),
    settoreRoma(5, 'Est'),
    settoreRoma(6, 'Centro'),
    { id: 7, nome: 'Da verificare', diocesiId: 0, note: 'Settore generico per inserimenti manuali.' },
    { id: 8, nome: 'Non applicabile', diocesiId: 0, note: 'Settore generico per diocesi senza settore locale.' },
    ...DIOCESI_LAZIO.filter((diocesi) => diocesi.id !== 1 && diocesi.id !== 2).map((diocesi, index) => settoreNonApplicabile(20 + index, diocesi.id))
];

const diocesiNomeById = (diocesiId: number) => DIOCESI_LAZIO.find((diocesi) => diocesi.id === diocesiId)?.nome ?? '';
const settoreNomeById = (settoreId: number) => SETTORI.find((settore) => settore.id === settoreId)?.nome ?? '';

export function normalizeParrocchiaName(nome: string): string {
    return nome
        .toLowerCase()
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[’`´]/g, "'")
        .replace(/\bs\.\s+/g, 'san ')
        .replace(/\bss\.\s+/g, 'santi ')
        .replace(/\s+/g, ' ');
}

const parrocchia = (
    id: number,
    nome: string,
    diocesiId: number,
    settoreId: number,
    comune = 'Roma',
    provincia = 'RM',
    indirizzo = '',
    note = ''
): Parrocchia => ({
    id,
    nome,
    diocesiId,
    settoreId,
    note,
    nomeNormalizzato: normalizeParrocchiaName(nome),
    diocesiNome: diocesiNomeById(diocesiId),
    settoreNome: settoreNomeById(settoreId),
    provincia,
    comune,
    indirizzo,
    fonte: 'Mock iniziale',
    statoVerifica: 'Verificata'
});

const parrocchieSeed: Parrocchia[] = [
    parrocchia(1, 'Gesù Divin Salvatore', 1, 1),
    parrocchia(2, 'S. Carlo da Sezze', 1, 1),
    parrocchia(3, 'S. Francesca Romana', 1, 1),
    parrocchia(4, 'S. Leonardo Murialdo', 1, 1),
    parrocchia(5, 'S. Mauro Abate', 1, 1),
    parrocchia(6, 'S. Giovanna Antida Thouret', 1, 1),
    parrocchia(7, 'S. Timoteo', 1, 1),
    parrocchia(8, 'S. Anselmo alla Cecchignola', 1, 1),
    parrocchia(9, "S. Francesco d'Assisi ad Acilia", 1, 1),
    parrocchia(10, 'S. Giovanni Battista De La Salle', 1, 1),
    parrocchia(11, 'S. Giovanni Evangelista a Spinaceto', 1, 1),
    parrocchia(12, 'S. Gregorio Barbarigo', 1, 1),
    parrocchia(13, 'S. Marco in Agro Laurentino', 1, 1),
    parrocchia(14, 'S. Maria Assunta e S. Michele Arcangelo a Trigoria', 1, 1),
    parrocchia(15, 'S. Maria Regina Pacis a Ostia Lido', 1, 1),
    parrocchia(16, 'S. Maria Stella Maris a Ostia', 1, 1),
    parrocchia(17, 'S. Pio da Pietrelcina', 1, 1),
    parrocchia(18, 'San Pier Damiani', 1, 1),
    parrocchia(19, 'S. Tommaso Apostolo', 1, 1),
    parrocchia(20, "S. Vincenzo De' Paoli", 1, 1),
    parrocchia(21, 'Sacro Cuore di Gesù agonizzante - Vitinia', 1, 1),
    parrocchia(22, 'SS. Cirillo e Metodio', 1, 1),
    parrocchia(23, 'S. Cipriano', 1, 2),
    parrocchia(24, 'S. Maria delle Grazie alle Fornaci', 1, 2, 'Roma', 'RM', 'Piazza delle Fornaci'),
    parrocchia(25, 'S. Famiglia al Portuense', 1, 2),
    parrocchia(26, 'S. Giuseppe al Trionfale', 1, 2),
    parrocchia(27, 'S. Ilario', 1, 2),
    parrocchia(28, 'S. Luigi Grignion de Montfort', 1, 2),
    parrocchia(29, 'S. Maria della Salute a Primavalle', 1, 2),
    parrocchia(30, 'S. Maria in Traspontina', 1, 2),
    parrocchia(31, 'San Pancrazio', 1, 2),
    parrocchia(32, 'SS. Ottavio e CC.MM.', 1, 2),
    parrocchia(33, 'S. Benedetto Abate', 2, 3, '', 'RM'),
    parrocchia(34, 'S. Maria Madre della Divina Provvidenza', 2, 3, '', 'RM'),
    parrocchia(35, 'S. Croce / Chiesa Madonna di Loreto', 2, 3, '', 'RM'),
    parrocchia(36, 'S. Rita da Cascia a Casalotti', 2, 3, '', 'RM'),
    parrocchia(37, 'Sacri Cuori di Gesù e Maria', 2, 3, '', 'RM'),
    parrocchia(38, 'SS. Annunziata', 2, 3, '', 'RM')
];

export function sameParrocchia(a: Parrocchia, b: Parrocchia): boolean {
    return a.nomeNormalizzato === b.nomeNormalizzato && a.comune.toLowerCase() === b.comune.toLowerCase() && a.diocesiId === b.diocesiId;
}

export function deduplicaParrocchie(parrocchie: Parrocchia[]): Parrocchia[] {
    return parrocchie.reduce<Parrocchia[]>((acc, item) => (acc.some((existing) => sameParrocchia(existing, item)) ? acc : [...acc, item]), []);
}

export const PARROCCHIE_BASE: Parrocchia[] = deduplicaParrocchie(parrocchieSeed);

export const DIOCESI_MOCK = DIOCESI_LAZIO;
export const SETTORI_MOCK = SETTORI;
export const PARROCCHIE_MOCK = PARROCCHIE_BASE;

export const NUMERI_COMUNITA = Array.from({ length: 35 }, (_, index) => index + 1);

export function generaNomeComunita(numero: number) {
    return `${numero}ª Comunità`;
}

export function creaNomeComunitaVisualizzato(numero: number, parrocchiaNome: string, settoreNome: string) {
    const settorePulito = settoreNome.replace(/^Settore\s*/i, '').trim();
    return `${generaNomeComunita(numero)} – ${parrocchiaNome} – Settore ${settorePulito}`;
}

export const COMUNITA_ATTIVA_MOCK: ComunitaAttiva = {
    id: 1,
    numero: 3,
    nomeVisualizzato: '3ª Comunità – S. Maria delle Grazie alle Fornaci – Settore Ovest',
    diocesiId: 1,
    settoreId: 2,
    parrocchiaId: 24,
    tappaCammino: 'Precatecumenato',
    responsabilePrincipale: 'Mario Rossi',
    note: 'Mock locale: la comunità non è pre-caricata, il responsabile indica il numero.'
};
