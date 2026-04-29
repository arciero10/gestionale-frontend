export const DEMO_COMUNITA = {
    nome: '3ª Comunità',
    parrocchia: 'Parrocchia Demo',
    settore: 'Settore Ovest',
    diocesi: 'Diocesi di Roma',
    responsabile: 'Mario Rossi'
};

export const DEMO_MEMBRI = [
    { nome: 'Mario', cognome: 'Rossi', ruolo: 'Responsabile', stato: 'Attivo', accessoApp: 'Attivo', privacy: 'Raccolto' },
    { nome: 'Lucia', cognome: 'Bianchi', ruolo: 'Catechista', stato: 'Attivo', accessoApp: 'Nessuno', privacy: 'Da raccogliere' },
    { nome: 'Giuseppe', cognome: 'Verdi', ruolo: 'Cantore', stato: 'Da contattare', accessoApp: 'In attesa', privacy: 'Raccolto' },
    { nome: 'Anna', cognome: 'Conti', ruolo: 'Fratello', stato: 'Attivo', accessoApp: 'Nessuno', privacy: 'Revocato' }
] as const;

export const DEMO_CONVIVENZE = [
    { titolo: 'Convivenza di Avvento', dataInizio: '2026-12-06', dataFine: '2026-12-08', stato: 'Confermata', luogo: 'Casa San Giuseppe' },
    { titolo: 'Convivenza di Quaresima', dataInizio: '2027-03-14', dataFine: '2027-03-16', stato: 'Richiesta inviata', luogo: 'Centro Fraternità' },
    { titolo: 'Convivenza estiva', dataInizio: '2027-07-12', dataFine: '2027-07-15', stato: 'Bozza', luogo: 'Da assegnare' }
] as const;

export const DEMO_POSTI = [
    { nome: 'Casa San Giuseppe', citta: 'Roma', regione: 'Lazio', indirizzo: 'Indirizzo dimostrativo', capienza: 80, stato: 'Partner attivo', tipologia: 'Casa per ritiri' },
    { nome: 'Centro Fraternità', citta: 'Frascati', regione: 'Lazio', indirizzo: 'Indirizzo dimostrativo', capienza: 120, stato: 'Censito internamente', tipologia: 'Casa di convivenza' },
    { nome: 'Domus Accoglienza', citta: 'Assisi', regione: 'Umbria', indirizzo: 'Indirizzo dimostrativo', capienza: 95, stato: 'Da verificare', tipologia: 'Casa per ritiri' }
] as const;
