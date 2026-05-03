import { Injectable } from '@angular/core';
import { COMUNITA_PILOTA, EQUIPE_CATECHISTI_PILOTA } from '../data/comunita-pilota.mock';
import { POSTI_CONVIVENZA_MOCK } from '../data/posti-convivenza.mock';
import {
    CreaRichiestaStrutturaPayload,
    MessaggioRichiestaStruttura,
    RichiestaStruttura,
    RichiestaStrutturaOption,
    creaOggettoCompleto,
    formatDateIt,
    generaCodiceRichiesta
} from './richieste-strutture.models';
import { GRAPH_SENDER_MAILBOX_PLACEHOLDER } from './graph-email.placeholder';

@Injectable({ providedIn: 'root' })
export class RichiesteStruttureService {
    private readonly comunitaDestinatariaNome = `${COMUNITA_PILOTA.nomeVisualizzato} – ${COMUNITA_PILOTA.parrocchia}`;

    private readonly convivenze: RichiestaStrutturaOption[] = [
        {
            id: 1,
            label: 'Passaggio 2° Scrutinio',
            descrizione: '12-03-2027 - 14-03-2027, 40 partecipanti indicativi',
            dataInizio: '2027-03-12',
            dataFine: '2027-03-14',
            partecipanti: 40,
            categoriaConvivenza: 'Catechistica',
            soggettoOrganizzatore: 'Equipe dei catechisti',
            equipeOrganizzatriceNome: EQUIPE_CATECHISTI_PILOTA.nomeEquipe,
            comunitaDestinatariaNome: this.comunitaDestinatariaNome
        },
        {
            id: 2,
            label: 'Convivenza di Riporto',
            descrizione: '18-10-2027 - 19-10-2027, 42 partecipanti indicativi',
            dataInizio: '2027-10-18',
            dataFine: '2027-10-19',
            partecipanti: 42,
            categoriaConvivenza: 'Annuale',
            soggettoOrganizzatore: 'Comunità',
            comunitaDestinatariaNome: this.comunitaDestinatariaNome
        },
        {
            id: 3,
            label: 'Convivenza di Pentecoste',
            descrizione: '22-05-2027 - 24-05-2027, 38 partecipanti indicativi',
            dataInizio: '2027-05-22',
            dataFine: '2027-05-24',
            partecipanti: 38,
            categoriaConvivenza: 'Annuale',
            soggettoOrganizzatore: 'Comunità',
            comunitaDestinatariaNome: this.comunitaDestinatariaNome
        }
    ];

    private richieste: RichiestaStruttura[] = [
        {
            id: 1,
            codiceRichiesta: 'EC-2026-000001',
            convivenzaId: 1,
            strutturaId: 1,
            comunitaCoinvolte: [this.comunitaDestinatariaNome],
            oggettoPersonalizzato: 'Richiesta disponibilità convivenza',
            oggettoCompleto: '[EC-2026-000001] Richiesta disponibilità convivenza',
            corpoEmail: this.creaCorpoEmailBase(1, [this.comunitaDestinatariaNome], ''),
            soggettoOrganizzatore: 'Equipe dei catechisti',
            equipeOrganizzatriceNome: EQUIPE_CATECHISTI_PILOTA.nomeEquipe,
            comunitaDestinatariaNome: this.comunitaDestinatariaNome,
            stato: 'Inviata',
            dataCreazione: '2026-04-20',
            dataInvio: '2026-04-20',
            dataUltimaRisposta: null
        },
        {
            id: 2,
            codiceRichiesta: 'EC-2026-000002',
            convivenzaId: 3,
            strutturaId: 4,
            comunitaCoinvolte: [this.comunitaDestinatariaNome],
            oggettoPersonalizzato: 'Richiesta disponibilità convivenza',
            oggettoCompleto: '[EC-2026-000002] Richiesta disponibilità convivenza',
            corpoEmail: this.creaCorpoEmailBase(3, [this.comunitaDestinatariaNome], ''),
            soggettoOrganizzatore: 'Comunità',
            equipeOrganizzatriceNome: '',
            comunitaDestinatariaNome: this.comunitaDestinatariaNome,
            stato: 'Risposta ricevuta',
            esitoRisposta: 'Da valutare',
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
            destinatario: this.getStrutturaEmail(1),
            oggetto: '[EC-2026-000001] Richiesta disponibilità convivenza',
            corpo: this.creaCorpoEmailBase(1, [this.comunitaDestinatariaNome], ''),
            dataMessaggio: '2026-04-20',
            messageIdGraph: 'mock-sent-ec-2026-000001',
            tipo: 'Inviato'
        },
        {
            id: 2,
            richiestaStrutturaId: 2,
            mittente: GRAPH_SENDER_MAILBOX_PLACEHOLDER,
            destinatario: this.getStrutturaEmail(4),
            oggetto: '[EC-2026-000002] Richiesta disponibilità convivenza',
            corpo: this.creaCorpoEmailBase(3, [this.comunitaDestinatariaNome], ''),
            dataMessaggio: '2026-04-22',
            messageIdGraph: 'mock-sent-ec-2026-000002',
            tipo: 'Inviato'
        },
        {
            id: 3,
            richiestaStrutturaId: 2,
            mittente: this.getStrutturaEmail(4),
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
        return POSTI_CONVIVENZA_MOCK.map((posto) => ({
            id: posto.id,
            label: posto.nome,
            descrizione: `${posto.indirizzo || posto.citta}, ${posto.regione}`,
            email: posto.email,
            indirizzo: posto.indirizzo
        }));
    }

    generaCodiceRichiesta(): string {
        return generaCodiceRichiesta(new Date().getFullYear(), this.prossimoIdRichiesta());
    }

    creaRichiesta(payload: CreaRichiestaStrutturaPayload): RichiestaStruttura {
        const id = this.prossimoIdRichiesta();
        const codiceRichiesta = payload.codiceRichiesta ?? generaCodiceRichiesta(new Date().getFullYear(), id);
        const convivenza = this.getConvivenzaById(payload.convivenzaId);
        const richiesta: RichiestaStruttura = {
            id,
            codiceRichiesta,
            convivenzaId: payload.convivenzaId,
            strutturaId: payload.strutturaId,
            comunitaCoinvolte: payload.comunitaCoinvolte,
            oggettoPersonalizzato: payload.oggettoPersonalizzato,
            oggettoCompleto: creaOggettoCompleto(codiceRichiesta, payload.oggettoPersonalizzato),
            corpoEmail: payload.corpoEmail,
            soggettoOrganizzatore: convivenza?.soggettoOrganizzatore ?? payload.soggettoOrganizzatore,
            equipeOrganizzatriceNome: convivenza?.equipeOrganizzatriceNome ?? payload.equipeOrganizzatriceNome,
            comunitaDestinatariaNome: convivenza?.comunitaDestinatariaNome ?? payload.comunitaDestinatariaNome,
            stato: 'Bozza',
            dataCreazione: this.oggiIso(),
            dataInvio: null,
            dataUltimaRisposta: null
        };

        this.richieste = [richiesta, ...this.richieste];
        return { ...richiesta, comunitaCoinvolte: [...richiesta.comunitaCoinvolte] };
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
                    destinatario: this.getStrutturaEmail(richiesta.strutturaId),
                    oggetto: richiesta.oggettoCompleto,
                    corpo: richiesta.corpoEmail,
                    dataMessaggio: dataInvio,
                    messageIdGraph: `mock-sent-${richiesta.codiceRichiesta.toLowerCase()}`,
                    tipo: 'Inviato'
                }
            ];
        }

        return { ...richiesta, comunitaCoinvolte: [...richiesta.comunitaCoinvolte] };
    }

    getMessaggi(id: number): MessaggioRichiestaStruttura[] {
        return this.messaggi.filter((messaggio) => messaggio.richiestaStrutturaId === id).map((messaggio) => ({ ...messaggio }));
    }

    getConvivenzaById(id: number): RichiestaStrutturaOption | undefined {
        return this.convivenze.find((item) => item.id === id);
    }

    getConvivenzaLabel(id: number): string {
        return this.getConvivenzaById(id)?.label ?? 'Convivenza da verificare';
    }

    getConvivenzaDescrizione(id: number): string {
        const convivenza = this.getConvivenzaById(id);
        if (!convivenza) {
            return '';
        }
        const equipe = convivenza.equipeOrganizzatriceNome ? ` · Equipe: ${convivenza.equipeOrganizzatriceNome}` : '';
        return `${convivenza.descrizione} · Organizzata da: ${convivenza.soggettoOrganizzatore}${equipe}`;
    }

    getStrutturaById(id: number): RichiestaStrutturaOption | undefined {
        return this.getStruttureOptions().find((item) => item.id === id);
    }

    getStrutturaLabel(id: number): string {
        return this.getStrutturaById(id)?.label ?? 'Struttura da verificare';
    }

    getStrutturaEmail(id: number): string {
        return this.getStrutturaById(id)?.email || 'email-struttura-da-completare@example.test';
    }

    creaCorpoEmailBase(convivenzaId: number, comunitaCoinvolte: string[], note: string): string {
        const convivenza = this.getConvivenzaById(convivenzaId);
        const equipe = convivenza?.equipeOrganizzatriceNome ? `\nEquipe organizzatrice:\n${convivenza.equipeOrganizzatriceNome}\n` : '';
        const destinataria = convivenza?.comunitaDestinatariaNome ? `\nComunità destinataria:\n${convivenza.comunitaDestinatariaNome}\n` : '';

        return `Gentili,

con la presente chiediamo disponibilità per una convivenza.

Organizzata da:
${convivenza?.soggettoOrganizzatore ?? 'Comunità'}
${equipe}${destinataria}
Date:
dal ${formatDateIt(convivenza?.dataInizio) || 'da completare'} al ${formatDateIt(convivenza?.dataFine) || 'da completare'}

Comunità coinvolte:
${comunitaCoinvolte.join(', ')}

Numero indicativo partecipanti:
${convivenza?.partecipanti ?? 'da completare'}

Note:
${note || 'Da completare'}

Restiamo in attesa di un vostro riscontro.

Cordiali saluti
Eventi di Comunità`;
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
