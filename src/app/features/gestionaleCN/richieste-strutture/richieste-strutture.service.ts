import { Injectable } from '@angular/core';
import { COMUNITA_PILOTA, EQUIPE_CATECHISTI_PILOTA } from '../data/comunita-pilota.mock';
import { POSTI_CONVIVENZA_MOCK } from '../data/posti-convivenza.mock';
import {
    CheckInConvivenzaAccess,
    CheckInPartecipanteMock,
    CreaRichiestaStrutturaPayload,
    MailMockConvivenza,
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
    private readonly checkInAccessKey = 'eventiComunità.checkInConvivenze';
    private readonly mailMockKey = 'eventiComunità.mailMockConvivenze';
    private readonly partecipantiCheckInKey = 'eventiComunità.checkInPartecipanti';
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
        return this.cloneRichiesta(richiesta);
    }

    getRichieste(): RichiestaStruttura[] {
        return this.richieste.map((richiesta) => this.cloneRichiesta(richiesta));
    }

    getRichiestaById(id: number): RichiestaStruttura | undefined {
        const richiesta = this.richieste.find((item) => item.id === id);
        return richiesta ? this.cloneRichiesta(richiesta) : undefined;
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

        return this.cloneRichiesta(richiesta);
    }

    confermaDisponibilitaStruttura(id: number, generatoPerUserId = 'mock-organizzatore'): RichiestaStruttura | undefined {
        const richiesta = this.richieste.find((item) => item.id === id);
        const convivenza = richiesta ? this.convivenze.find((item) => item.id === richiesta.convivenzaId) : undefined;

        if (!richiesta || !convivenza) {
            return undefined;
        }

        const generatoIl = new Date().toISOString();
        const token = richiesta.checkInAccess?.token ?? this.generaCheckInToken(richiesta.convivenzaId);
        const checkInUrl = `/gestionale-cn/check-in/${richiesta.convivenzaId}?token=${encodeURIComponent(token)}`;
        const access: CheckInConvivenzaAccess = {
            convivenzaId: String(richiesta.convivenzaId),
            token,
            url: checkInUrl,
            qrCodeValue: `CHECK-IN-CONVIVENZA:${richiesta.convivenzaId}:${token}`,
            generatoIl,
            generatoPerUserId,
            attivo: true
        };

        richiesta.stato = 'Confermata';
        richiesta.esitoRisposta = 'Disponibile';
        richiesta.dataUltimaRisposta = this.oggiIso();
        richiesta.checkInAccess = access;

        convivenza.checkInToken = access.token;
        convivenza.checkInUrl = access.url;
        convivenza.qrCodeValue = access.qrCodeValue;
        convivenza.checkInAbilitato = true;
        convivenza.confermataDaStrutturaIl = access.generatoIl;
        convivenza.strutturaConfermataId = String(richiesta.strutturaId);

        this.salvaCheckInAccess(access);
        this.salvaConvivenzaConfermata(richiesta, convivenza, access);
        this.salvaMailMockConvivenza(richiesta, convivenza, access, generatoPerUserId);
        this.aggiungiMessaggioConfermaStruttura(richiesta, access);

        return this.cloneRichiesta(richiesta);
    }

    getCheckInAccess(convivenzaId: string | number, token: string | null | undefined): CheckInConvivenzaAccess | null {
        if (!token) {
            return null;
        }

        const access = this.leggiCheckInAccess().find((item) => item.convivenzaId === String(convivenzaId) && item.token === token && item.attivo);
        return access ? { ...access } : null;
    }

    getMailMockConvivenze(): MailMockConvivenza[] {
        return this.leggiLocalStorage<MailMockConvivenza[]>(this.mailMockKey, []);
    }

    getPartecipantiCheckIn(convivenzaId: string | number): CheckInPartecipanteMock[] {
        const store = this.leggiLocalStorage<Record<string, CheckInPartecipanteMock[]>>(this.partecipantiCheckInKey, {});
        const key = String(convivenzaId);

        if (!store[key]) {
            store[key] = this.creaPartecipantiMock();
            this.scriviLocalStorage(this.partecipantiCheckInKey, store);
        }

        return store[key].map((partecipante) => ({ ...partecipante }));
    }

    aggiornaStatoPartecipanteCheckIn(convivenzaId: string | number, partecipanteId: string, stato: CheckInPartecipanteMock['stato']): CheckInPartecipanteMock[] {
        const store = this.leggiLocalStorage<Record<string, CheckInPartecipanteMock[]>>(this.partecipantiCheckInKey, {});
        const key = String(convivenzaId);
        const partecipanti = store[key] ?? this.creaPartecipantiMock();
        store[key] = partecipanti.map((partecipante) => (partecipante.id === partecipanteId ? { ...partecipante, stato } : partecipante));
        this.scriviLocalStorage(this.partecipantiCheckInKey, store);
        return store[key].map((partecipante) => ({ ...partecipante }));
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

    creaCorpoEmailBase(convivenzaId: number, comunitaCoinvolte: string[], note: string, richiedente?: { nome: string; ruolo: string; comunita: string }): string {
        const convivenza = this.getConvivenzaById(convivenzaId);
        const nome = richiedente?.nome || 'Da indicare';
        const comunita = richiedente?.comunita || 'Da indicare';
        const numGruppi = comunitaCoinvolte.length || 1;

        return `Gentili,

con la presente chiediamo disponibilità presso la vostra struttura per una convivenza.

Date:
dal ${formatDateIt(convivenza?.dataInizio) || 'Da completare'} al ${formatDateIt(convivenza?.dataFine) || 'Da completare'}

Numero indicativo partecipanti:
${convivenza?.partecipanti ?? 'Da completare'}

Numero comunità/gruppi coinvolti:
${numGruppi}

Bambini/ragazzi presenti:
Da confermare

Necessità principali:
- Pernottamento: Da indicare
- Pasti (colazione, pranzo, cena): Da indicare
- Sala incontri: Da indicare
- Spazi bambini/ragazzi: Da indicare
- Parcheggio: Da indicare

Note:
${note || 'Da completare'}

Vi chiediamo cortesemente di indicarci la disponibilità della struttura per le date indicate e, se disponibile, di fornirci un preventivo indicativo.

Cordiali saluti
${nome}
${comunita}`;
    }

    private cloneRichiesta(richiesta: RichiestaStruttura): RichiestaStruttura {
        return {
            ...richiesta,
            comunitaCoinvolte: [...richiesta.comunitaCoinvolte],
            checkInAccess: richiesta.checkInAccess ? { ...richiesta.checkInAccess } : undefined
        };
    }

    private generaCheckInToken(convivenzaId: number): string {
        return `checkin-${convivenzaId}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    }

    private leggiCheckInAccess(): CheckInConvivenzaAccess[] {
        return this.leggiLocalStorage<CheckInConvivenzaAccess[]>(this.checkInAccessKey, []);
    }

    private salvaCheckInAccess(access: CheckInConvivenzaAccess): void {
        const accessi = this.leggiCheckInAccess().filter((item) => item.convivenzaId !== access.convivenzaId);
        this.scriviLocalStorage(this.checkInAccessKey, [access, ...accessi]);
    }

    private salvaConvivenzaConfermata(richiesta: RichiestaStruttura, convivenza: RichiestaStrutturaOption, access: CheckInConvivenzaAccess): void {
        const payload = {
            ...convivenza,
            stato: 'Confermata',
            strutturaConfermataId: String(richiesta.strutturaId),
            strutturaConfermataNome: this.getStrutturaLabel(richiesta.strutturaId),
            checkInToken: access.token,
            checkInUrl: access.url,
            qrCodeValue: access.qrCodeValue,
            checkInAbilitato: true,
            confermataDaStrutturaIl: access.generatoIl
        };

        this.scriviLocalStorage(`eventiComunità.convivenzaConfermata.${richiesta.convivenzaId}`, payload);
    }

    private salvaMailMockConvivenza(richiesta: RichiestaStruttura, convivenza: RichiestaStrutturaOption, access: CheckInConvivenzaAccess, userId: string): void {
        const struttura = this.getStrutturaLabel(richiesta.strutturaId);
        const mail: MailMockConvivenza = {
            id: `mail-check-in-${richiesta.convivenzaId}-${Date.now()}`,
            to: userId.includes('@') ? userId : 'organizzatore@eventidicomunita.test',
            subject: `Conferma struttura e QR check-in — Convivenza ${convivenza.label}`,
            body: `La struttura ha confermato la disponibilità.

Convivenza:
${convivenza.label}

Struttura:
${struttura}

Date:
dal ${formatDateIt(convivenza.dataInizio) || 'Da completare'} al ${formatDateIt(convivenza.dataFine) || 'Da completare'}

Puoi avviare il check-in da questo link:
${access.url}

QR check-in:
${access.qrCodeValue}`,
            createdAt: access.generatoIl,
            type: 'check_in_convivenza',
            relatedConvivenzaId: access.convivenzaId
        };

        this.scriviLocalStorage(this.mailMockKey, [mail, ...this.getMailMockConvivenze()]);
    }

    private aggiungiMessaggioConfermaStruttura(richiesta: RichiestaStruttura, access: CheckInConvivenzaAccess): void {
        const messageIdGraph = `mock-confirm-${richiesta.codiceRichiesta.toLowerCase()}`;
        if (this.messaggi.some((messaggio) => messaggio.messageIdGraph === messageIdGraph)) {
            return;
        }

        this.messaggi = [
            ...this.messaggi,
            {
                id: this.prossimoIdMessaggio(),
                richiestaStrutturaId: richiesta.id,
                mittente: this.getStrutturaEmail(richiesta.strutturaId),
                destinatario: GRAPH_SENDER_MAILBOX_PLACEHOLDER,
                oggetto: `Re: ${richiesta.oggettoCompleto}`,
                corpo: `Confermiamo la disponibilità della struttura. Il sistema ha generato il link check-in: ${access.url}`,
                dataMessaggio: this.oggiIso(),
                messageIdGraph,
                tipo: 'Ricevuto'
            }
        ];
    }

    private creaPartecipantiMock(): CheckInPartecipanteMock[] {
        return [
            { id: 'p-1', nome: 'Partecipante 1', stato: 'atteso' },
            { id: 'p-2', nome: 'Partecipante 2', stato: 'atteso' },
            { id: 'p-3', nome: 'Partecipante 3', stato: 'atteso' },
            { id: 'p-4', nome: 'Partecipante 4', stato: 'atteso' },
            { id: 'p-5', nome: 'Partecipante 5', stato: 'atteso' }
        ];
    }

    private leggiLocalStorage<T>(key: string, fallback: T): T {
        if (typeof localStorage === 'undefined') {
            return fallback;
        }

        try {
            const raw = localStorage.getItem(key);
            return raw ? (JSON.parse(raw) as T) : fallback;
        } catch {
            return fallback;
        }
    }

    private scriviLocalStorage<T>(key: string, value: T): void {
        if (typeof localStorage === 'undefined') {
            return;
        }

        localStorage.setItem(key, JSON.stringify(value));
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
