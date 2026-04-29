import { MessaggioRichiestaStruttura, RichiestaStruttura, CODICE_RICHIESTA_REGEX } from './richieste-strutture.models';

export interface GraphMailConfig {
    graphTenantId: string;
    graphClientId: string;
    graphClientSecret: string;
    graphSenderMailbox: string;
}

export interface GraphEmailServiceContract {
    sendRequestEmail(richiesta: RichiestaStruttura): Promise<MessaggioRichiestaStruttura>;
    readIncomingReplies(): Promise<MessaggioRichiestaStruttura[]>;
}

export const GRAPH_SENDER_MAILBOX_PLACEHOLDER = 'richieste@eventidicomunita.it';

export const RICHIESTE_STRUTTURE_API_CONTRACTS = [
    'POST /api/richieste-strutture',
    'GET /api/richieste-strutture',
    'GET /api/richieste-strutture/{id}',
    'POST /api/richieste-strutture/{id}/invia',
    'GET /api/richieste-strutture/{id}/messaggi'
] as const;

/*
 * Placeholder tecnico backend Microsoft Graph.
 *
 * Configurazione futura, solo da environment/appsettings/secret store:
 * - GraphTenantId
 * - GraphClientId
 * - GraphClientSecret
 * - GraphSenderMailbox, esempio richieste@eventidicomunita.it
 *
 * Invio:
 * - inviare dalla mailbox configurata;
 * - includere sempre il codice richiesta nell'oggetto, es. [EC-2026-000001];
 * - salvare messageIdGraph sul messaggio inviato.
 *
 * Lettura risposte:
 * - leggere periodicamente la mailbox richieste@eventidicomunita.it via Graph;
 * - estrarre il codice con CODICE_RICHIESTA_REGEX;
 * - collegare la risposta alla richiesta corrispondente;
 * - ignorare duplicati già salvati tramite messageIdGraph;
 * - aggiornare lo stato richiesta a RispostaRicevuta.
 */
export const codiceRichiestaRegexDocumentata = CODICE_RICHIESTA_REGEX;
