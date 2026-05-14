export type StatoRichiestaStruttura =
    | 'Bozza'
    | 'Inviata'
    | 'Risposta ricevuta'
    | 'Confermata'
    | 'Annullata';

export type EsitoRispostaStruttura =
    | 'Da valutare'
    | 'Disponibile'
    | 'Non disponibile'
    | 'Preventivo ricevuto';

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
    esitoRisposta?: EsitoRispostaStruttura;
    checkInAccess?: CheckInConvivenzaAccess;
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
    soggettoOrganizzatore?: string;
    equipeOrganizzatriceNome?: string;
    comunitaDestinatariaNome?: string;
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
    checkInToken?: string;
    checkInUrl?: string;
    qrCodeValue?: string;
    checkInAbilitato?: boolean;
    confermataDaStrutturaIl?: string;
    strutturaConfermataId?: string;
}

export interface CheckInConvivenzaAccess {
    convivenzaId: string;
    token: string;
    url: string;
    qrCodeValue: string;
    generatoIl: string;
    generatoPerUserId: string;
    attivo: boolean;
}

export interface MailMockConvivenza {
    id: string;
    to: string;
    subject: string;
    body: string;
    createdAt: string;
    type: 'check_in_convivenza';
    relatedConvivenzaId: string;
}

export interface CheckInPartecipanteMock {
    id: string;
    nome: string;
    stato: 'atteso' | 'arrivato' | 'assente';
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
