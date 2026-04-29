export const PRIVACY_POLICY_DRAFT_TITLE = 'Informativa privacy – Bozza ambiente test';

export const PRIVACY_POLICY_DRAFT_PARAGRAPHS = [
    'Questa informativa descrive, in forma preliminare, come il Gestionale Comunità tratta i dati personali dei membri della comunità nell’ambito dell’organizzazione comunitaria, delle convivenze, degli incontri, dei servizi e delle comunicazioni operative.',
    'Il trattamento dei dati è finalizzato alla gestione della vita comunitaria, alla preparazione delle convivenze, al coordinamento dei responsabili, alla gestione dei recapiti, dei ruoli di servizio e delle comunicazioni necessarie.',
    'Alcuni dati possono essere particolari o delicati, ad esempio informazioni relative a esigenze alimentari, allergie, salute, presenza di minori o altre necessità personali. Tali dati devono essere raccolti solo se necessari e con consenso esplicito dell’interessato.',
    'I dati non devono essere diffusi pubblicamente. La visibilità all’interno del gestionale è limitata ai soggetti autorizzati secondo il proprio ruolo.',
    'I dati possono essere condivisi con strutture di accoglienza o luoghi di convivenza solo quando necessario per organizzare l’evento e solo nei limiti delle informazioni indispensabili.',
    'L’interessato può chiedere aggiornamento, correzione o revoca dei consensi secondo le modalità che saranno definite nella versione definitiva dell’informativa.',
    'Questa è una bozza funzionale per ambiente test. Il testo definitivo dovrà essere verificato e approvato prima dell’utilizzo in produzione.'
];

export const PRIVACY_POLICY_DRAFT_DATA_ITEMS = [
    'nome e cognome',
    'recapiti telefonici ed email',
    'appartenenza alla comunità',
    'ruolo o servizio nella comunità',
    'partecipazione a convivenze o incontri',
    'eventuali esigenze operative comunicate dall’interessato per l’organizzazione di convivenze'
];

export const PRIVACY_CONSENTS_DRAFT = [
    {
        key: 'consensoDatiPersonali',
        title: 'Consenso trattamento dati personali',
        required: true,
        text: 'Acconsento al trattamento dei miei dati personali per la gestione della comunità, dei recapiti, dei ruoli di servizio, delle comunicazioni operative e delle attività comunitarie.'
    },
    {
        key: 'consensoDatiParticolari',
        title: 'Consenso dati particolari',
        required: false,
        text: 'Acconsento, se necessario, al trattamento di dati particolari da me comunicati, come esigenze alimentari, allergie, dati relativi alla salute o altre necessità personali legate all’organizzazione di convivenze o incontri.'
    },
    {
        key: 'consensoStrutture',
        title: 'Consenso condivisione dati con strutture',
        required: false,
        text: 'Acconsento alla condivisione dei soli dati necessari con strutture di accoglienza o luoghi di convivenza, quando indispensabile per l’organizzazione dell’evento.'
    },
    {
        key: 'consensoComunicazioni',
        title: 'Consenso comunicazioni',
        required: false,
        text: 'Acconsento a ricevere comunicazioni operative relative alla comunità, alle convivenze e agli incontri tramite email, telefono o altri recapiti da me forniti.'
    },
    {
        key: 'presaVisione',
        title: 'Presa visione informativa',
        required: true,
        text: 'Dichiaro di aver letto l’informativa privacy in bozza e di comprendere che la versione definitiva sarà approvata prima della produzione.'
    }
];
