import { Injectable } from '@angular/core';
import {
    CreaRichiestaStrutturaPayload,
    MessaggioRichiestaStruttura,
    RichiestaStruttura,
    RichiestaStrutturaOption,
    creaOggettoRichiesta,
    generaCodiceRichiesta
} from './richieste-strutture.models';
import { GRAPH_SENDER_MAILBOX_PLACEHOLDER } from './graph-email.placeholder';

@Injectable({ providedIn: 'root' })
export class RichiesteStruttureService {
    private readonly convivenze: RichiestaStrutturaOption[] = [
        { id: 1, label: 'Convivenza Inizio Corso 2025', descrizione: '05/12/2026 - 08/12/2026, 42 partecipanti indicativi' },
        { id: 2, label: 'Passaggio 1 Scrutinio', descrizione: '12/03/2027 - 14/03/2027, 40 partecipanti indicativi' },
        { id: 3, label: 'Convivenza di Pentecoste', descrizione: '22/05/2027 - 24/05/2027, 38 partecipanti indicativi' }
    ];

    private readonly strutture: RichiestaStrutturaOption[] = [
        { id: 1, label: 'Casa San Giuseppe', descrizione: 'Albano Laziale, Lazio' },
        { id: 2, label: 'Istituto Santa Marta', descrizione: 'Frascati, Lazio' },
        { id: 3, label: 'Centro Fraternità', descrizione: 'Scheda struttura da completare' }
    ];

    private richieste: RichiestaStruttura[] = [
        {
            id: 1,
            codiceRichiesta: 'EC-2026-000001',
            convivenzaId: 1,
            strutturaId: 1,
            comunitaCoinvolte: ['3ª Comunità'],
            oggetto: '[EC-2026-000001] Richiesta disponibilità convivenza',
            messaggio: this.creaMessaggioBase('Convivenza Inizio Corso 2025', ['3ª Comunità']),
            stato: 'Inviata',
            dataCreazione: '2026-04-20',
            dataInvio: '2026-04-20',
            dataUltimaRisposta: null
        },
        {
            id: 2,
            codiceRichiesta: 'EC-2026-000002',
            convivenzaId: 3,
            strutturaId: 2,
            comunitaCoinvolte: ['3ª Comunità', '4ª Comunità'],
            oggetto: '[EC-2026-000002] Richiesta disponibilità convivenza',
            messaggio: this.creaMessaggioBase('Convivenza di Pentecoste', ['3ª Comunità', '4ª Comunità']),
            stato: 'RispostaRicevuta',
            dataCreazione: '2026-04-22',
            dataInvio: '2026-04-22',
            dataUltimaRisposta: '2026-04-24'
        }
    ];

    private messaggi: MessaggioRichiestaStruttura[] = [
        {
            id: 1,
            richiestaStrutturaId: 1,
            mittente: GRAPH_SENDER_MAILBOX_PLACEHOLDER,
            destinatario: 'struttura@example.test',
            oggetto: '[EC-2026-000001] Richiesta disponibilità convivenza',
            corpo: this.creaMessaggioBase('Convivenza Inizio Corso 2025', ['3ª Comunità']),
            dataMessaggio: '2026-04-20',
            messageIdGraph: 'mock-sent-ec-2026-000001',
            tipo: 'Inviato'
        },
        {
            id: 2,
            richiestaStrutturaId: 2,
            mittente: GRAPH_SENDER_MAILBOX_PLACEHOLDER,
            destinatario: 'struttura@example.test',
            oggetto: '[EC-2026-000002] Richiesta disponibilità convivenza',
            corpo: this.creaMessaggioBase('Convivenza di Pentecoste', ['3ª Comunità', '4ª Comunità']),
            dataMessaggio: '2026-04-22',
            messageIdGraph: 'mock-sent-ec-2026-000002',
            tipo: 'Inviato'
        },
        {
            id: 3,
            richiestaStrutturaId: 2,
            mittente: 'struttura@example.test',
            destinatario: GRAPH_SENDER_MAILBOX_PLACEHOLDER,
            oggetto: 'Re: [EC-2026-000002] Richiesta disponibilità convivenza',
            corpo: 'Buongiorno, abbiamo ricevuto la richiesta. Stiamo verificando la disponibilità e vi aggiorniamo a breve.',
            dataMessaggio: '2026-04-24',
            messageIdGraph: 'mock-received-ec-2026-000002',
            tipo: 'Ricevuto'
        }
    ];

    getConvivenzeOptions(): RichiestaStrutturaOption[] {
        return [...this.convivenze];
    }

    getStruttureOptions(): RichiestaStrutturaOption[] {
        return [...this.strutture];
    }

    creaRichiesta(payload: CreaRichiestaStrutturaPayload): RichiestaStruttura {
        const id = this.prossimoIdRichiesta();
        const codiceRichiesta = generaCodiceRichiesta(2026, id);
        const richiesta: RichiestaStruttura = {
            id,
            codiceRichiesta,
            convivenzaId: payload.convivenzaId,
            strutturaId: payload.strutturaId,
            comunitaCoinvolte: payload.comunitaCoinvolte,
            oggetto: payload.oggetto.includes(`[${codiceRichiesta}]`) ? payload.oggetto : creaOggettoRichiesta(codiceRichiesta),
            messaggio: payload.messaggio,
            stato: 'Bozza',
            dataCreazione: this.oggiIso(),
            dataInvio: null,
            dataUltimaRisposta: null
        };

        this.richieste = [richiesta, ...this.richieste];
        return { ...richiesta };
    }

    getRichieste(): RichiestaStruttura[] {
        return this.richieste.map((richiesta) => ({ ...richiesta, comunitaCoinvolte: [...richiesta.comunitaCoinvolte] }));
    }

    getRichiestaById(id: number): RichiestaStruttura | undefined {
        const richiesta = this.richieste.find((item) => item.id === id);
        return richiesta ? { ...richiesta, comunitaCoinvolte: [...richiesta.comunitaCoinvolte] } : undefined;
    }

    inviaRichiesta(id: number): RichiestaStruttura | undefined {
        const richiesta = this.richieste.find((item) => item.id === id);

        if (!richiesta) {
            return undefined;
        }

        const dataInvio = this.oggiIso();
        richiesta.stato = 'Inviata';
        richiesta.dataInvio = dataInvio;

        const messaggioEsistente = this.messaggi.some((messaggio) => messaggio.richiestaStrutturaId === id && messaggio.tipo === 'Inviato');
        if (!messaggioEsistente) {
            this.messaggi = [
                ...this.messaggi,
                {
                    id: this.prossimoIdMessaggio(),
                    richiestaStrutturaId: id,
                    mittente: GRAPH_SENDER_MAILBOX_PLACEHOLDER,
                    destinatario: 'struttura@example.test',
                    oggetto: richiesta.oggetto,
                    corpo: richiesta.messaggio,
                    dataMessaggio: dataInvio,
                    messageIdGraph: `mock-sent-${richiesta.codiceRichiesta.toLowerCase()}`,
                    tipo: 'Inviato'
                }
            ];
        }

        return { ...richiesta, comunitaCoinvolte: [...richiesta.comunitaCoinvolte] };
    }

    getMessaggi(id: number): MessaggioRichiestaStruttura[] {
        return this.messaggi
            .filter((messaggio) => messaggio.richiestaStrutturaId === id)
            .map((messaggio) => ({ ...messaggio }));
    }

    getConvivenzaLabel(id: number): string {
        return this.convivenze.find((item) => item.id === id)?.label ?? 'Convivenza da verificare';
    }

    getConvivenzaDescrizione(id: number): string {
        return this.convivenze.find((item) => item.id === id)?.descrizione ?? '';
    }

    getStrutturaLabel(id: number): string {
        return this.strutture.find((item) => item.id === id)?.label ?? 'Struttura da verificare';
    }

    creaMessaggioBase(convivenza: string, comunitaCoinvolte: string[]): string {
        return `Pace,

con la presente chiediamo la disponibilità della struttura per una convivenza comunitaria.

Dati richiesta:
- Convivenza: ${convivenza}
- Comunità coinvolte: ${comunitaCoinvolte.join(', ')}
- Periodo: da completare
- Numero indicativo partecipanti: da completare

Restiamo in attesa di un vostro gentile riscontro.

Grazie.

Gestionale Eventi di Comunità`;
    }

    private prossimoIdRichiesta(): number {
        return Math.max(0, ...this.richieste.map((richiesta) => richiesta.id)) + 1;
    }

    private prossimoIdMessaggio(): number {
        return Math.max(0, ...this.messaggi.map((messaggio) => messaggio.id)) + 1;
    }

    private oggiIso(): string {
        return new Date().toISOString().slice(0, 10);
    }
}
