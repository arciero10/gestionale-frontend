export const DEMO_COMUNITA = {
    nome: '3ª Comunità',
    parrocchia: 'Parrocchia Demo',
    settore: 'Settore Ovest',
    diocesi: 'Diocesi di Roma',
    responsabile: 'Mario Rossi',
    tappaCammino: 'Precatecumenato'
};

export const DEMO_MEMBRI = [
    { nome: 'Mario', cognome: 'Rossi', ruolo: 'Responsabile', stato: 'Attivo', accessoApp: 'Attivo', privacy: 'Raccolto' },
    { nome: 'Lucia', cognome: 'Bianchi', ruolo: 'Catechista', stato: 'Attivo', accessoApp: 'Da invitare', privacy: 'Inviato' },
    { nome: 'Giuseppe', cognome: 'Verdi', ruolo: 'Cantore', stato: 'Da invitare', accessoApp: 'Da completare', privacy: 'Raccolto' },
    { nome: 'Anna', cognome: 'Conti', ruolo: 'Fratello', stato: 'Attivo', accessoApp: 'Da invitare', privacy: 'Revocato' }
] as const;

export const DEMO_CONVIVENZE = [
    { titolo: 'Convivenza Inizio Corso demo', dataInizio: '2026-10-03', dataFine: '2026-10-04', stato: 'Confermata', luogo: 'Casa San Giuseppe', richiesta: 'Confermata', partecipanti: '32/38', tipoConvivenza: 'Inizio Corso' },
    { titolo: 'Convivenza di Avvento', dataInizio: '2026-12-06', dataFine: '2026-12-08', stato: 'In richiesta', luogo: 'Centro Fraternità', richiesta: 'Inviata', partecipanti: '24/35', tipoConvivenza: 'Riporto' },
    { titolo: 'Passaggio demo 1° Scrutinio', dataInizio: '2027-03-14', dataFine: '2027-03-16', stato: 'Bozza', luogo: 'Da assegnare', richiesta: 'Bozza', partecipanti: '18/40', tipoConvivenza: '1° Scrutinio' }
] as const;

export const DEMO_POSTI = [
    { nome: 'Casa San Giuseppe', citta: 'Roma', regione: 'Lazio', indirizzo: 'Indirizzo dimostrativo', capienza: 80, stato: 'Partner attivo', tipologia: 'Casa per ritiri' },
    { nome: 'Centro Fraternità', citta: 'Frascati', regione: 'Lazio', indirizzo: 'Indirizzo dimostrativo', capienza: 120, stato: 'Censito internamente', tipologia: 'Casa di convivenza' },
    { nome: 'Domus Accoglienza', citta: 'Assisi', regione: 'Umbria', indirizzo: 'Indirizzo dimostrativo', capienza: 95, stato: 'Da verificare', tipologia: 'Casa per ritiri' }
] as const;
