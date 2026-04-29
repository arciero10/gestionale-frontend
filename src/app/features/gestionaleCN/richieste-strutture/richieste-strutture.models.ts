export type StatoRichiestaStruttura =
    | 'Bozza'
    | 'Inviata'
    | 'RispostaRicevuta'
    | 'Disponibile'
    | 'NonDisponibile'
    | 'PreventivoRicevuto'
    | 'Confermata'
    | 'Annullata';

export type TipoMessaggioRichiestaStruttura = 'Inviato' | 'Ricevuto';

export interface RichiestaStruttura {
    id: number;
    codiceRichiesta: string;
    convivenzaId: number;
    strutturaId: number;
    comunitaCoinvolte: string[];
    oggetto: string;
    messaggio: string;
    stato: StatoRichiestaStruttura;
    dataCreazione: string;
    dataInvio: string | null;
    dataUltimaRisposta: string | null;
}

export interface MessaggioRichiestaStruttura {
    id: number;
    richiestaStrutturaId: number;
    mittente: string;
    destinatario: string;
    oggetto: string;
    corpo: string;
    dataMessaggio: string;
    messageIdGraph: string;
    tipo: TipoMessaggioRichiestaStruttura;
}

export interface CreaRichiestaStrutturaPayload {
    convivenzaId: number;
    strutturaId: number;
    comunitaCoinvolte: string[];
    oggetto: string;
    messaggio: string;
}

export interface RichiestaStrutturaOption {
    id: number;
    label: string;
    descrizione: string;
}

export const CODICE_RICHIESTA_REGEX = /\[(EC-\d{4}-\d{6})\]/;

export function generaCodiceRichiesta(anno: number, progressivo: number): string {
    return `EC-${anno}-${String(progressivo).padStart(6, '0')}`;
}

export function creaOggettoRichiesta(codiceRichiesta: string): string {
    return `[${codiceRichiesta}] Richiesta disponibilità convivenza`;
}
