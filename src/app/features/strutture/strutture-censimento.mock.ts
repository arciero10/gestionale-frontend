export const SAN_GAETANO_CENSIMENTO_STORAGE_KEY = 'struttura-censimento-san-gaetano';
export const SAN_GAETANO_CENSIMENTO_LINK = '/strutture/censimento?token=SG-2026-000001';

export interface CensimentoStrutturaMock {
    nomeStruttura: string;
    tipoStruttura: string;
    indirizzo: string;
    citta: string;
    regione: string;
    referente: string;
    telefono: string;
    email: string;
    capienzaPostiLetto: number | null;
    numeroCamere: number | null;
    bagni: string;
    saleIncontri: string;
    refettorio: boolean;
    cappella: boolean;
    parcheggio: boolean;
    pastiDisponibili: string;
    noteOrganizzative: string;
    consensoGestionale: boolean;
    statoCensimento: 'Censimento ricevuto';
    statoVerifica: 'Da verificare';
    dataInvio: string;
}

export const SAN_GAETANO_CENSIMENTO_DEFAULT: CensimentoStrutturaMock = {
    nomeStruttura: 'San Gaetano',
    tipoStruttura: 'Struttura di accoglienza',
    indirizzo: 'Via Giunone Lucina 50',
    citta: 'Santa Severa / Santa Marinella',
    regione: 'Lazio',
    referente: 'Massimo Cattai',
    telefono: '',
    email: '',
    capienzaPostiLetto: null,
    numeroCamere: null,
    bagni: '',
    saleIncontri: '',
    refettorio: false,
    cappella: false,
    parcheggio: false,
    pastiDisponibili: '',
    noteOrganizzative: '',
    consensoGestionale: false,
    statoCensimento: 'Censimento ricevuto',
    statoVerifica: 'Da verificare',
    dataInvio: ''
};
