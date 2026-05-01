import { TipoUnitaMembroComunita } from '../data/comunita-pilota.mock';

export type StatoInvitoCensimento = 'Da inviare' | 'Inviato' | 'Compilato' | 'Scaduto';
export type StatoAnagraficaCensimento = 'Da completare' | 'Completa';
export type StatoConsensiCensimento = 'Da compilare' | 'Parziale' | 'Completo';

export interface PersonaCensimento {
    id: number;
    nome: string;
    cognome: string;
    email: string;
    telefono: string;
    dataNascita: string;
    consensoInformativo: boolean;
    consensoPrivacy: boolean;
    consensoComunicazioni: boolean;
}

export interface UnitaCensimentoComunita {
    id: number;
    tipoUnita: TipoUnitaMembroComunita;
    nomeVisualizzato: string;
    emailRiferimento: string;
    telefonoRiferimento: string;
    statoInvito: StatoInvitoCensimento;
    statoAnagrafica: StatoAnagraficaCensimento;
    statoConsensi: StatoConsensiCensimento;
    token: string;
    linkInvito: string;
    persone: PersonaCensimento[];
    note: string;
}

export interface NotificaCensimento {
    id: number;
    testo: string;
    data: string;
}

const STORAGE_KEY = 'eventiComunita.censimento.unita';
const NOTIFICHE_KEY = 'eventiComunita.censimento.notifiche';

function hasLocalStorage() {
    return typeof localStorage !== 'undefined';
}

function baseUrl() {
    return typeof window !== 'undefined' ? window.location.origin : 'https://test.eventidicomunita.it';
}

export function generaTokenCensimento(id: number) {
    return `mock-${id}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function creaLinkInvito(token: string) {
    return `${baseUrl()}/completa-anagrafica/${token}`;
}

function creaPersona(id: number, nome: string, cognome: string, email = ''): PersonaCensimento {
    return {
        id,
        nome,
        cognome,
        email,
        telefono: '',
        dataNascita: '',
        consensoInformativo: false,
        consensoPrivacy: false,
        consensoComunicazioni: false
    };
}

export function creaUnitaCensimentoVuota(id: number, tipoUnita: TipoUnitaMembroComunita): UnitaCensimentoComunita {
    return {
        id,
        tipoUnita,
        nomeVisualizzato: '',
        emailRiferimento: '',
        telefonoRiferimento: '',
        statoInvito: 'Da inviare',
        statoAnagrafica: 'Da completare',
        statoConsensi: 'Da compilare',
        token: '',
        linkInvito: '',
        persone: tipoUnita === 'Coppia' ? [creaPersona(1, '', ''), creaPersona(2, '', '')] : [creaPersona(1, '', '')],
        note: ''
    };
}

function unitaIniziali(): UnitaCensimentoComunita[] {
    return [];
}

export function leggiUnitaCensimento(): UnitaCensimentoComunita[] {
    if (!hasLocalStorage()) {
        return unitaIniziali();
    }

    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
        const iniziali = unitaIniziali();
        salvaUnitaCensimento(iniziali);
        return iniziali;
    }

    try {
        return JSON.parse(raw) as UnitaCensimentoComunita[];
    } catch {
        return unitaIniziali();
    }
}

export function salvaUnitaCensimento(unita: UnitaCensimentoComunita[]) {
    if (hasLocalStorage()) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(unita));
    }
}

export function trovaUnitaDaToken(token: string) {
    return leggiUnitaCensimento().find((unita) => unita.token === token);
}

export function aggiornaUnitaCensimento(unitaAggiornata: UnitaCensimentoComunita) {
    const unita = leggiUnitaCensimento().map((item) => (item.id === unitaAggiornata.id ? unitaAggiornata : item));
    salvaUnitaCensimento(unita);
    return unita;
}

export function leggiNotificheCensimento(): NotificaCensimento[] {
    if (!hasLocalStorage()) {
        return [];
    }
    const raw = localStorage.getItem(NOTIFICHE_KEY);
    return raw ? (JSON.parse(raw) as NotificaCensimento[]) : [];
}

export function aggiungiNotificaCensimento(testo: string) {
    if (!hasLocalStorage()) {
        return;
    }
    const notifiche = leggiNotificheCensimento();
    notifiche.unshift({ id: Date.now(), testo, data: new Date().toISOString() });
    localStorage.setItem(NOTIFICHE_KEY, JSON.stringify(notifiche));
}
