export interface PrivacyConfig {
    titolareBreve: string;
    titolareCompleto: string;
    codiceFiscale: string;
    partitaIva: string;
    sedeLegaleBreve: string;
    sedeLegaleCompleta: string;
    emailPrivacy: string;
    pec: string;
    referentePrivacy: string;
    legaleRappresentante: string;
    finalitaTrattamento: string[];
    basiGiuridiche: string[];
    tipologieDati: string[];
    tempiConservazione: string[];
    modalitaTrattamento: string;
    comunicazioneDati: {
        intro: string;
        destinatari: string[];
        noDiffusione: string;
    };
    responsabiliEsterni: {
        elenco: string[];
        nota: string;
    };
    dirittiInteressato: {
        intro: string;
        elenco: string[];
        contatto: string;
    };
    modificheInformativa: string;
    noteValidazione: string;
}

export const PRIVACY_CONFIG: PrivacyConfig = {
    titolareBreve: 'PANTELEIA – APS',
    titolareCompleto: 'PANTELEIA – Associazione di Promozione Sociale (APS)',
    codiceFiscale: '96647400587',
    partitaIva: '18492911005',
    sedeLegaleBreve: 'Roma (RM), Italia',
    sedeLegaleCompleta: 'Via Graziano 42, 00165 Roma (RM), Italia',
    emailPrivacy: 'privacy@panteleia.it',
    pec: 'panteleia.aps@pec.it',
    referentePrivacy: 'Legale rappresentante pro tempore',
    legaleRappresentante: 'Alessandro Arciero',
    finalitaTrattamento: [
        'Registrazione e gestione degli utenti nel gestionale',
        'Organizzazione di convivenze, eventi e viaggi',
        'Gestione delle comunità e dei partecipanti',
        'Comunicazioni operative tra utenti e strutture',
        'Invio di notifiche di servizio, email, OTP e comunicazioni tecniche',
        'Gestione delle richieste verso strutture ricettive',
        'Sicurezza e funzionamento della piattaforma'
    ],
    basiGiuridiche: [
        'Esecuzione di un servizio richiesto dall’utente, art. 6.1.b GDPR',
        'Adempimento di obblighi legali, art. 6.1.c GDPR',
        'Consenso dell’interessato, ove richiesto, art. 6.1.a GDPR',
        'Legittimo interesse del titolare, art. 6.1.f GDPR'
    ],
    tipologieDati: [
        'Dati anagrafici, nome e cognome',
        'Dati di contatto, email e telefono',
        'Informazioni relative alla comunità di appartenenza',
        'Dati organizzativi relativi a eventi e convivenze',
        'Eventuali dati particolari forniti volontariamente, per esempio esigenze alimentari o sanitarie'
    ],
    tempiConservazione: [
        'Per tutta la durata dell’iscrizione al servizio',
        'Fino a 24 mesi dalla cessazione dell’account',
        'Fino a 5 anni per dati legati a eventi e organizzazione',
        'Secondo i termini previsti dalla legge per obblighi fiscali o legali'
    ],
    modalitaTrattamento: 'Il trattamento avviene mediante strumenti informatici e telematici, con misure tecniche e organizzative adeguate a garantire la sicurezza, l’integrità e la riservatezza dei dati.',
    comunicazioneDati: {
        intro: 'I dati potranno essere comunicati a:',
        destinatari: ['Strutture ricettive coinvolte nelle richieste', 'Fornitori tecnici necessari al funzionamento della piattaforma', 'Autorità competenti, nei casi previsti dalla legge'],
        noDiffusione: 'I dati non saranno diffusi pubblicamente.'
    },
    responsabiliEsterni: {
        elenco: ['Microsoft Azure, infrastruttura cloud e hosting', 'Microsoft Entra External ID, gestione autenticazione utenti', 'Servizi email per comunicazioni operative'],
        nota: 'L’elenco aggiornato dei responsabili è disponibile su richiesta.'
    },
    dirittiInteressato: {
        intro: 'L’interessato ha il diritto di:',
        elenco: ['Accedere ai propri dati personali', 'Richiedere la rettifica o la cancellazione', 'Limitare o opporsi al trattamento', 'Richiedere la portabilità dei dati', 'Revocare il consenso in qualsiasi momento'],
        contatto: 'Le richieste possono essere inviate a: privacy@panteleia.it'
    },
    modificheInformativa: 'La presente informativa potrà essere aggiornata in base all’evoluzione del servizio, delle modalità operative e delle verifiche richieste prima della produzione.',
    noteValidazione: 'Bozza informativa da validare prima della produzione.'
};
