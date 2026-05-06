export const SAN_GAETANO_CENSIMENTO_STORAGE_KEY = 'struttura-censimento-san-gaetano';
export const SAN_GAETANO_CENSIMENTO_LINK = '/strutture/censimento?token=SG-2026-000001';
export const STRUTTURE_SEGNALATE_STORAGE_KEY = 'strutture-segnalate';
export type StatoVerificaStruttura = 'Da verificare' | 'Verificata' | 'Sospesa';
export type StatoSegnalazioneStruttura = 'Segnalazione ricevuta' | 'Invito preparato' | 'Invito censimento inviato' | 'Censimento ricevuto' | 'Scartata';

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
    statoVerifica: StatoVerificaStruttura;
    stato: 'Censimento ricevuto';
    pubblicata: boolean;
    statoDisponibilita: 'Da verificare' | 'Disponibile' | 'Non disponibile';
    tokenCensimento: string;
    dataInvio: string;
}

export interface StrutturaSegnalataMock {
    id: string;
    nomeStruttura: string;
    indirizzo: string;
    citta: string;
    regione: string;
    referente: string;
    telefono: string;
    email: string;
    note: string;
    origine: 'Segnalata da comunità';
    propostaDa: string;
    comunita: string;
    stato: StatoSegnalazioneStruttura;
    pubblicata: boolean;
    invitoInviato: boolean;
    tokenCensimento: string;
    statoVerifica: StatoVerificaStruttura;
    statoDisponibilita: 'Da verificare' | 'Disponibile' | 'Non disponibile';
    dataSegnalazione: string;
    dataInvito?: string;
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
    stato: 'Censimento ricevuto',
    pubblicata: false,
    statoDisponibilita: 'Da verificare',
    tokenCensimento: 'SG-2026-000001',
    dataInvio: ''
};

export function readStruttureSegnalate(): StrutturaSegnalataMock[] {
    const raw = localStorage.getItem(STRUTTURE_SEGNALATE_STORAGE_KEY);
    if (!raw) {
        return [];
    }

    try {
        return JSON.parse(raw) as StrutturaSegnalataMock[];
    } catch {
        return [];
    }
}

export function writeStruttureSegnalate(items: StrutturaSegnalataMock[]) {
    localStorage.setItem(STRUTTURE_SEGNALATE_STORAGE_KEY, JSON.stringify(items));
}
