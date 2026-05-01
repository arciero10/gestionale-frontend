export type FaqVisibilita = 'pubblica' | 'interna';

export interface FaqItem {
    id: number;
    categoria: 'Accesso' | 'Comunità' | 'Privacy e Consensi' | 'Convivenze' | 'Richieste strutture' | 'Supporto';
    domanda: string;
    risposta: string;
    visibilita: FaqVisibilita;
    ordine: number;
    tag: string[];
}

export const SUPPORT_EMAIL = 'supporto@eventidicomunita.it';

export const FAQ_MOCK: FaqItem[] = [
    {
        id: 1,
        categoria: 'Accesso',
        domanda: 'Come accedo al gestionale?',
        risposta: 'Puoi accedere usando la tua email tramite Microsoft Entra External ID. Riceverai un codice temporaneo per completare l’accesso.',
        visibilita: 'pubblica',
        ordine: 1,
        tag: ['accesso', 'email', 'entra']
    },
    {
        id: 2,
        categoria: 'Accesso',
        domanda: 'Come mi registro al primo accesso?',
        risposta: 'Premi “Registrati” nella pagina iniziale. Nella schermata Microsoft inserisci la tua email anche se non hai ancora un account: riceverai un codice temporaneo per creare il tuo accesso.',
        visibilita: 'pubblica',
        ordine: 2,
        tag: ['registrazione', 'primo accesso']
    },
    {
        id: 3,
        categoria: 'Accesso',
        domanda: 'Perché devo inserire la mail anche se mi sto registrando?',
        risposta: 'Microsoft usa la tua email per verificare l’identità e inviarti un codice temporaneo. Anche se sei un nuovo utente, il primo passo è inserire la mail nella schermata Microsoft.',
        visibilita: 'pubblica',
        ordine: 3,
        tag: ['registrazione', 'email', 'codice']
    },
    {
        id: 4,
        categoria: 'Comunità',
        domanda: 'Come scelgo la mia comunità?',
        risposta: 'Al primo accesso ti verrà chiesto di indicare diocesi, settore, parrocchia e numero della comunità. Se la parrocchia non è presente, puoi segnalarla tramite il form manuale.',
        visibilita: 'pubblica',
        ordine: 4,
        tag: ['comunità', 'onboarding']
    },
    {
        id: 5,
        categoria: 'Privacy e Consensi',
        domanda: 'Chi può vedere i dati della comunità?',
        risposta: 'Solo gli utenti autorizzati possono accedere ai dati della comunità, secondo il ruolo assegnato nel gestionale.',
        visibilita: 'pubblica',
        ordine: 5,
        tag: ['privacy', 'ruoli']
    },
    {
        id: 6,
        categoria: 'Privacy e Consensi',
        domanda: 'I consensi privacy sono individuali?',
        risposta: 'Sì. Anche se una coppia viene gestita come unità organizzativa, i consensi privacy restano sempre individuali per ciascuna persona.',
        visibilita: 'pubblica',
        ordine: 6,
        tag: ['consensi', 'coppie']
    },
    {
        id: 7,
        categoria: 'Convivenze',
        domanda: 'Chi organizza le convivenze di passaggio del Cammino?',
        risposta: 'Le convivenze di passaggio sono organizzate dall’equipe dei catechisti per una comunità figlia. La comunità destinataria può collaborare alla gestione pratica.',
        visibilita: 'pubblica',
        ordine: 7,
        tag: ['convivenze', 'catechisti']
    },
    {
        id: 8,
        categoria: 'Convivenze',
        domanda: 'Riporto e Pentecoste sono tappe del Cammino?',
        risposta: 'No. Riporto e Pentecoste sono convivenze annuali e non vanno confuse con le tappe del Cammino.',
        visibilita: 'pubblica',
        ordine: 8,
        tag: ['riporto', 'pentecoste', 'tappe']
    },
    {
        id: 9,
        categoria: 'Richieste strutture',
        domanda: 'Come funzionano le richieste alle strutture?',
        risposta: 'Il gestionale permette di preparare richieste di disponibilità verso strutture di convivenza e di seguirne lo stato. L’invio reale sarà collegato al servizio email quando il backend sarà attivo.',
        visibilita: 'pubblica',
        ordine: 9,
        tag: ['strutture', 'richieste']
    },
    {
        id: 12,
        categoria: 'Comunità',
        domanda: 'Chi può modificare la tappa del Cammino?',
        risposta: 'Solo il responsabile autorizzato può modificare la tappa della comunità. Gli altri ruoli possono visualizzarla se autorizzati.',
        visibilita: 'pubblica',
        ordine: 9.1,
        tag: ['tappa', 'responsabile', 'ruoli']
    },
    {
        id: 13,
        categoria: 'Convivenze',
        domanda: 'Chi può creare una convivenza?',
        risposta: 'Le convivenze della comunità possono essere create dai ruoli autorizzati della comunità. Le convivenze con comunità figlie sono create dall’equipe dei catechisti.',
        visibilita: 'pubblica',
        ordine: 9.2,
        tag: ['convivenze', 'ruoli', 'catechisti']
    },
    {
        id: 10,
        categoria: 'Privacy e Consensi',
        domanda: 'Dove posso leggere l’informativa privacy?',
        risposta: 'L’informativa privacy è disponibile nella sezione “Privacy” del gestionale e nella pagina pubblica /privacy.',
        visibilita: 'pubblica',
        ordine: 10,
        tag: ['privacy', 'informativa']
    },
    {
        id: 11,
        categoria: 'Supporto',
        domanda: 'A chi posso scrivere per supporto?',
        risposta: `Per supporto o problemi di accesso puoi scrivere a: ${SUPPORT_EMAIL}`,
        visibilita: 'pubblica',
        ordine: 11,
        tag: ['supporto', 'accesso']
    }
];
