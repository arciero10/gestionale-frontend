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
    oggettoPersonalizzato: string;
    oggettoCompleto: string;
    corpoEmail: string;
    soggettoOrganizzatore?: string;
    equipeOrganizzatriceNome?: string;
    comunitaDestinatariaNome?: string;
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
    codiceRichiesta?: string;
    oggettoPersonalizzato: string;
    corpoEmail: string;
}

export interface RichiestaStrutturaOption {
    id: number;
    label: string;
    descrizione: string;
    email?: string;
    indirizzo?: string;
    dataInizio?: string;
    dataFine?: string;
    partecipanti?: number;
    categoriaConvivenza?: string;
    soggettoOrganizzatore?: string;
    equipeOrganizzatriceNome?: string;
    comunitaDestinatariaNome?: string;
}

export const CODICE_RICHIESTA_REGEX = /\[(EC-\d{4}-\d{6})\]/;

export function generaCodiceRichiesta(anno: number, progressivo: number): string {
    return `EC-${anno}-${String(progressivo).padStart(6, '0')}`;
}

export function creaOggettoCompleto(codiceRichiesta: string, oggettoPersonalizzato: string): string {
    return `[${codiceRichiesta}] ${oggettoPersonalizzato.trim() || 'Richiesta disponibilità convivenza'}`;
}

export function creaOggettoRichiesta(codiceRichiesta: string): string {
    return creaOggettoCompleto(codiceRichiesta, 'Richiesta disponibilità convivenza');
}

export function formatDateIt(date: string | null | undefined): string {
    if (!date) {
        return '';
    }

    const [year, month, day] = date.slice(0, 10).split('-');
    return year && month && day ? `${day}-${month}-${year}` : date;
}
