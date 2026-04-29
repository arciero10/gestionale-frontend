export interface Diocesi {
    id: number;
    nome: string;
}

export interface Settore {
    id: number;
    nome: string;
    diocesiId: number;
}

export interface Parrocchia {
    id: number;
    nome: string;
    diocesiId: number;
    settoreId: number;
    note: string;
}

export interface ComunitaAttiva {
    id: number;
    numero: number;
    nomeVisualizzato: string;
    diocesiId: number;
    settoreId: number;
    parrocchiaId: number;
    responsabilePrincipale: string;
    note: string;
}

export const DIOCESI_MOCK: Diocesi[] = [
    { id: 1, nome: 'Diocesi di Roma' },
    { id: 2, nome: 'Diocesi di Porto Santa Rufina' }
];

export const SETTORI_MOCK: Settore[] = [
    { id: 1, nome: 'Sud', diocesiId: 1 },
    { id: 2, nome: 'Ovest', diocesiId: 1 },
    { id: 3, nome: 'Porto Santa Rufina', diocesiId: 2 }
];

export const PARROCCHIE_MOCK: Parrocchia[] = [
    { id: 1, nome: 'Gesù Divin Salvatore', diocesiId: 1, settoreId: 1, note: '' },
    { id: 2, nome: 'S. Carlo da Sezze', diocesiId: 1, settoreId: 1, note: '' },
    { id: 3, nome: 'S. Francesca Romana', diocesiId: 1, settoreId: 1, note: '' },
    { id: 4, nome: 'S. Leonardo Murialdo', diocesiId: 1, settoreId: 1, note: '' },
    { id: 5, nome: 'S. Mauro Abate', diocesiId: 1, settoreId: 1, note: '' },
    { id: 6, nome: 'S. Giovanna Antida Thouret', diocesiId: 1, settoreId: 1, note: '' },
    { id: 7, nome: 'S. Timoteo', diocesiId: 1, settoreId: 1, note: '' },
    { id: 8, nome: 'S. Anselmo alla Cecchignola', diocesiId: 1, settoreId: 1, note: '' },
    { id: 9, nome: 'S. Francesco d’Assisi ad Acilia', diocesiId: 1, settoreId: 1, note: '' },
    { id: 10, nome: 'S. Giovanni Battista De La Salle', diocesiId: 1, settoreId: 1, note: '' },
    { id: 11, nome: 'S. Giovanni Evangelista a Spinaceto', diocesiId: 1, settoreId: 1, note: '' },
    { id: 12, nome: 'S. Gregorio Barbarigo', diocesiId: 1, settoreId: 1, note: '' },
    { id: 13, nome: 'S. Marco in Agro Laurentino', diocesiId: 1, settoreId: 1, note: '' },
    { id: 14, nome: 'S. Maria Assunta e S. Michele Arcangelo a Trigoria', diocesiId: 1, settoreId: 1, note: '' },
    { id: 15, nome: 'S. Maria Regina Pacis a Ostia Lido', diocesiId: 1, settoreId: 1, note: '' },
    { id: 16, nome: 'S. Maria Stella Maris a Ostia', diocesiId: 1, settoreId: 1, note: '' },
    { id: 17, nome: 'S. Pio da Pietrelcina', diocesiId: 1, settoreId: 1, note: '' },
    { id: 18, nome: 'San Pier Damiani', diocesiId: 1, settoreId: 1, note: '' },
    { id: 19, nome: 'S. Tommaso Apostolo', diocesiId: 1, settoreId: 1, note: '' },
    { id: 20, nome: 'S. Vincenzo De’ Paoli', diocesiId: 1, settoreId: 1, note: '' },
    { id: 21, nome: 'Sacro Cuore di Gesù agonizzante - Vitinia', diocesiId: 1, settoreId: 1, note: '' },
    { id: 22, nome: 'SS. Cirillo e Metodio', diocesiId: 1, settoreId: 1, note: '' },
    { id: 23, nome: 'S. Cipriano', diocesiId: 1, settoreId: 2, note: '' },
    { id: 24, nome: 'S. Maria delle Grazie alle Fornaci', diocesiId: 1, settoreId: 2, note: '' },
    { id: 25, nome: 'S. Famiglia al Portuense', diocesiId: 1, settoreId: 2, note: '' },
    { id: 26, nome: 'S. Giuseppe al Trionfale', diocesiId: 1, settoreId: 2, note: '' },
    { id: 27, nome: 'S. Ilario', diocesiId: 1, settoreId: 2, note: '' },
    { id: 28, nome: 'S. Luigi Grignion de Montfort', diocesiId: 1, settoreId: 2, note: '' },
    { id: 29, nome: 'S. Maria della Salute a Primavalle', diocesiId: 1, settoreId: 2, note: '' },
    { id: 30, nome: 'S. Maria in Traspontina', diocesiId: 1, settoreId: 2, note: '' },
    { id: 31, nome: 'San Pancrazio', diocesiId: 1, settoreId: 2, note: '' },
    { id: 32, nome: 'SS. Ottavio e CC.MM.', diocesiId: 1, settoreId: 2, note: '' },
    { id: 33, nome: 'S. Benedetto Abate', diocesiId: 2, settoreId: 3, note: '' },
    { id: 34, nome: 'S. Maria Madre della Divina Provvidenza', diocesiId: 2, settoreId: 3, note: '' },
    { id: 35, nome: 'S. Croce / Chiesa Madonna di Loreto', diocesiId: 2, settoreId: 3, note: '' },
    { id: 36, nome: 'S. Rita da Cascia a Casalotti', diocesiId: 2, settoreId: 3, note: '' },
    { id: 37, nome: 'Sacri Cuori di Gesù e Maria', diocesiId: 2, settoreId: 3, note: '' },
    { id: 38, nome: 'SS. Annunziata', diocesiId: 2, settoreId: 3, note: '' }
];

export const NUMERI_COMUNITA = Array.from({ length: 35 }, (_, index) => index + 1);

export function generaNomeComunita(numero: number) {
    return `${numero}ª Comunità`;
}

export function creaNomeComunitaVisualizzato(numero: number, parrocchiaNome: string, settoreNome: string) {
    return `${generaNomeComunita(numero)} – ${parrocchiaNome} – Settore ${settoreNome}`;
}

export const COMUNITA_ATTIVA_MOCK: ComunitaAttiva = {
    id: 1,
    numero: 3,
    nomeVisualizzato: '3ª Comunità – S. Maria delle Grazie alle Fornaci – Settore Ovest',
    diocesiId: 1,
    settoreId: 2,
    parrocchiaId: 24,
    responsabilePrincipale: 'Mario Rossi',
    note: 'Mock locale: la comunità non è pre-caricata, il responsabile indica il numero.'
};
