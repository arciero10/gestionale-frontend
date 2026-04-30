export type TipologiaPosto = 'Casa di convivenza' | 'Parrocchia' | 'Istituto religioso' | 'Casa per ritiri' | 'Albergo / pensione' | 'Altro';
export type TipoStrutturaMappa = 'Hotel' | 'Casa di convivenza' | 'Istituto' | 'Parrocchia';
export type StatoRelazione = 'Da verificare' | 'Censito internamente' | 'Interessato al progetto' | 'Partner attivo' | 'Non disponibile';
export type StatoDisponibilitaPosto = 'Disponibile' | 'Da verificare' | 'Non disponibile';
export type ValutazioneInterna = 'non valutato' | 'positivo' | 'da verificare' | 'problematico';

export interface ServiziPosto {
    camere: boolean;
    salaIncontri: boolean;
    cucina: boolean;
    parcheggio: boolean;
    accessibilita: boolean;
    spazioBambini: boolean;
}

export interface PostoConvivenza {
    id: number;
    nome: string;
    tipo: TipoStrutturaMappa;
    tipologia: TipologiaPosto;
    zona: string;
    citta: string;
    regione: string;
    indirizzo: string;
    indirizzoNormalizzato: string;
    capienza: number | null;
    referente: string;
    telefono: string;
    email: string;
    sitoWeb: string;
    statoRelazione: StatoRelazione;
    statoDisponibilita: StatoDisponibilitaPosto;
    note: string;
    latitudine: number | null;
    longitudine: number | null;
    lat: number;
    lng: number;
    placeId: string | null;
    googleMapsUrl: string;
    ultimoContatto: string | null;
    storicoConvivenze: string[];
    servizi: ServiziPosto;
    valutazioneInterna: ValutazioneInterna;
}

const mapsSearchUrl = (query: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;

const tipoMappaFromTipologia = (tipologia: TipologiaPosto): TipoStrutturaMappa => {
    if (tipologia === 'Albergo / pensione') {
        return 'Hotel';
    }

    if (tipologia === 'Istituto religioso' || tipologia === 'Casa per ritiri') {
        return 'Istituto';
    }

    return tipologia === 'Parrocchia' ? 'Parrocchia' : 'Casa di convivenza';
};

const statoDisponibilitaFromRelazione = (stato: StatoRelazione): StatoDisponibilitaPosto => {
    if (stato === 'Partner attivo' || stato === 'Interessato al progetto') {
        return 'Disponibile';
    }

    if (stato === 'Non disponibile') {
        return 'Non disponibile';
    }

    return 'Da verificare';
};

const coordinateFallback = (id: number, citta: string): [number, number] => {
    const basi: Record<string, [number, number]> = {
        Roma: [41.9028, 12.4964],
        Assisi: [43.0707, 12.6196],
        Frascati: [41.8091, 12.6795],
        Fiuggi: [41.7978, 13.2217],
        Tarquinia: [42.2542, 11.7566],
        'Santa Severa': [42.0186, 11.9541],
        Norma: [41.5861, 12.9705],
        Ciampino: [41.8006, 12.6026],
        'Santa Marinella': [42.0349, 11.8542],
        Civitavecchia: [42.0924, 11.7954]
    };
    const base = basi[citta] ?? basi['Roma'];
    const offset = (id % 9) * 0.006;
    const spread = Math.floor(id / 9) * 0.004;
    return [Number((base[0] + offset - spread).toFixed(6)), Number((base[1] - offset + spread).toFixed(6))];
};

const serviziDefault = (tipologia: TipologiaPosto): ServiziPosto => ({
    camere: tipologia === 'Casa di convivenza' || tipologia === 'Casa per ritiri' || tipologia === 'Albergo / pensione' || tipologia === 'Istituto religioso',
    salaIncontri: tipologia !== 'Albergo / pensione',
    cucina: false,
    parcheggio: false,
    accessibilita: false,
    spazioBambini: false
});

const posto = (
    id: number,
    nome: string,
    tipologia: TipologiaPosto,
    citta: string,
    regione: string,
    indirizzo: string,
    email: string,
    note: string
): PostoConvivenza => ({
    ...(() => {
        const [lat, lng] = coordinateFallback(id, citta);
        const statoRelazione: StatoRelazione = 'Da verificare';
        return {
            tipo: tipoMappaFromTipologia(tipologia),
            zona: citta === 'Roma' ? 'Roma' : `${citta} / ${regione}`,
            statoRelazione,
            statoDisponibilita: statoDisponibilitaFromRelazione(statoRelazione),
            latitudine: lat,
            longitudine: lng,
            lat,
            lng
        };
    })(),
    id,
    nome,
    tipologia,
    citta,
    regione,
    indirizzo,
    indirizzoNormalizzato: indirizzo,
    capienza: null,
    referente: '',
    telefono: '',
    email,
    sitoWeb: '',
    note,
    placeId: null,
    googleMapsUrl: mapsSearchUrl(`${nome}, ${indirizzo}, ${citta}, ${regione}`),
    ultimoContatto: null,
    storicoConvivenze: [],
    servizi: serviziDefault(tipologia),
    valutazioneInterna: 'non valutato'
});

// TODO: collegare qui Google Places Autocomplete o Azure Maps Search nel form nuovo posto.
// Al select dell'indirizzo salvare placeId, indirizzoNormalizzato, latitudine e longitudine.

export const POSTI_CONVIVENZA_MOCK: PostoConvivenza[] = [
    posto(1, 'Ancelle della Carità', 'Istituto religioso', 'Roma', 'Lazio', 'Via del Casaletto 538, Roma', 'info@casaperferie-ancelledelsantuario.com; pensioneancelle@virgilio.it', 'Da verificare contatti e disponibilità.'),
    posto(2, 'Benedettine Missionarie di Tutzing', 'Istituto religioso', 'Roma', 'Lazio', 'Via dei Bevilacqua 60, Roma', 'casaroma@osb-tutzing.it', 'Da verificare contatti e disponibilità.'),
    posto(3, 'Carmelitane del Divin Cuore di Gesù', 'Istituto religioso', 'Roma', 'Lazio', 'Via Trionfale 6157, Roma', 'congregazione@carmelitanedcj.it', 'Da verificare contatti e disponibilità.'),
    posto(4, 'Casa Bonus Pastor', 'Casa per ritiri', 'Roma', 'Lazio', 'Via Aurelia 208, Roma', 'bonuspastor@glauco.it; info@casabonuspastor.it', 'Da verificare contatti e disponibilità.'),
    posto(5, 'Domenicane della Annunziata - Villa Annunziata', 'Istituto religioso', 'Roma', 'Lazio', 'Via di Villa Maggiorani 9, Roma', 'annunziata.villa@gmail.com', 'Da verificare contatti e disponibilità.'),
    posto(6, 'Domenicane del S. Rosario - Villa Rosario', 'Istituto religioso', 'Roma', 'Lazio', 'Via Pietro d’Assisi 15, Roma', 'suoredomenicane.villarosario@gmail.com', 'Da verificare contatti e disponibilità.'),
    posto(7, 'Domus Aurelia - Orsoline del Sacro Monte', 'Casa per ritiri', 'Roma', 'Lazio', 'Via Aurelia 218, Roma', 'info@novadomusaurelia.it; gruppi@novadomusaurelia.it', 'Da verificare contatti e disponibilità.'),
    posto(8, 'Domus Mariae / TH Roma - Carpegna Palace Hotel', 'Albergo / pensione', 'Roma', 'Lazio', 'Via Aurelia 481, Roma', 'roma@th-resorts.com; booking@carpegnapalace.it', 'Verificare nome struttura e canale gruppi.'),
    posto(9, 'Domus Pacis', 'Casa per ritiri', 'Assisi', 'Umbria', 'Assisi', 'info@domuspacis.it', 'Attenzione: indirizzo da completare, indicato solo Assisi.'),
    posto(10, 'Figlie dei Sacri Cuori', 'Istituto religioso', 'Roma', 'Lazio', 'Via Pio VIII 28, Roma', 'amministrazione.ravasco@gmail.com', 'Da verificare contatti e disponibilità.'),
    posto(11, 'Figlie della Carità di S. Vincenzo de’ Paoli', 'Istituto religioso', 'Roma', 'Lazio', 'Roma', 'figliedellacaritaroma@legalmail.it', 'PEC Provincia Romana. Indirizzo da completare.'),
    posto(12, 'Figlie della Presentazione di Maria SS.ma al Tempio', 'Istituto religioso', 'Roma', 'Lazio', 'Roma', 'congreg.presentazione@legalmail.it', 'PEC Congregazione. Indirizzo da completare.'),
    posto(13, 'Figlie di Maria Madre della Chiesa - Villa Letizia', 'Casa per ritiri', 'Roma', 'Lazio', 'Via D. Marvasi 29, Roma', 'info@resiletizia.it', 'Da verificare contatti e disponibilità.'),
    posto(14, 'Figlie di S. Giuseppe - Rivalba / Casa S. Giuseppe', 'Casa per ritiri', 'Roma', 'Lazio', 'Vicolo Moroni 22, Roma', 'info@casasangiuseppe.it', 'Da verificare contatti e disponibilità.'),
    posto(15, 'Foyer Phat Diem', 'Casa per ritiri', 'Roma', 'Lazio', 'Via della Pineta Sacchetti 45, Roma', 'foy erpdr@gmail.com', 'Verificare email: possibile spazio/errore, probabilmente foyerpdr@gmail.com.'),
    posto(16, 'Francescane Angeline - Istituto Sacro Cuore', 'Istituto religioso', 'Roma', 'Lazio', 'Via di Sesto Celere 20 / Via di Villa Troili 28, Roma', '6celere@angeline.it; romaccogli@angeline.it', 'Due sedi: Sesto Celere e Villa Troili. Valutare se separarle in due record.'),
    posto(17, 'Francescane della Croce del Libano', 'Istituto religioso', 'Roma', 'Lazio', 'Via F. Bandiera 19, Roma', 'info@suorefcl.it', 'Da verificare contatti e disponibilità.'),
    posto(18, 'Francescane Missionarie della Madre del Divino Pastore', 'Istituto religioso', 'Roma', 'Lazio', 'Via Pio VIII 16, Roma', 'fproma@tiscali.it', 'Da verificare contatti e disponibilità.'),
    posto(19, 'Maestre Pie Filippini - Casa Auxilium Christianorum', 'Casa per ritiri', 'Roma', 'Lazio', 'Via G. Missori 19, Roma', 'info@mpfmissori.it', 'Da verificare contatti e disponibilità.'),
    posto(20, 'Piccole Suore della Sacra Famiglia - Casa di Accoglienza Paolo VI', 'Casa per ritiri', 'Roma', 'Lazio', 'Viale Vaticano 92, Roma', 'info@casapaolosesto.it', 'Da verificare contatti e disponibilità.'),
    posto(21, 'Suore del Prez.mo Sangue di Monza - Casa Tabor', 'Casa per ritiri', 'Roma', 'Lazio', 'Via Paolo III 9, Roma', 'casatabor@ssmgen.org', 'Da verificare contatti e disponibilità.'),
    posto(22, 'Suore dell’Immacolata Concezione di N.S. di Lourdes', 'Istituto religioso', 'Roma', 'Lazio', 'Via Domenico Tardini 40, Roma', 'snslourdes@gmail.com', 'Da verificare contatti e disponibilità.'),
    posto(23, 'Suore di S. Francesco di Sales', 'Istituto religioso', 'Roma', 'Lazio', 'Via Fabiola 65, Roma', 'info@scuolasfsales.it', 'Da verificare se struttura disponibile per convivenze.'),
    posto(24, 'Suore Oblate Filippine - Villino Noel', 'Casa per ritiri', 'Roma', 'Lazio', 'Via Monte Pertica 23, Roma', 'info@villinonoel.it', 'Da verificare contatti e disponibilità.'),
    posto(25, 'Centro Giovanni XXIII', 'Casa per ritiri', 'Frascati', 'Lazio', 'Frascati', 'reception@centrogiovanni23.it', 'Indirizzo da completare.'),
    posto(26, 'Domus Urbis', 'Casa per ritiri', 'Fiuggi', 'Lazio', 'Fiuggi/Roma', 'domusurbis@domusurbis.it', 'Verificare sede corretta e indirizzo completo.'),
    posto(27, 'Hotel Helios', 'Albergo / pensione', 'Tarquinia', 'Lazio', 'Tarquinia Lido', 'info@grandhotelhelios.it', 'Indirizzo da completare.'),
    posto(28, 'Hotel Italia', 'Albergo / pensione', 'Fiuggi', 'Lazio', 'Fiuggi', 'info@albergoitalia.it', 'Indirizzo da completare.'),
    posto(29, 'Hotel Pino al Mare', 'Albergo / pensione', 'Santa Severa', 'Lazio', 'Santa Severa', 'info@pinoalmare.it', 'Indirizzo da completare.'),
    posto(30, 'Hotel Villa del Carminale', 'Albergo / pensione', 'Norma', 'Lazio', 'Norma', 'info@villadelcardinale.com', 'Indirizzo da completare.'),
    posto(31, 'Pegaso Palace Hotel', 'Albergo / pensione', 'Tarquinia', 'Lazio', 'Marina Velca - Tarquinia', 'info@hpegaso.it', 'Indirizzo da completare.'),
    posto(32, 'PP. Carmelitani', 'Casa per ritiri', 'Ciampino', 'Lazio', 'Ciampino', 'prenotazioni@ilcarmelo.net', 'Da verificare struttura “Il Carmelo” e indirizzo completo.'),
    posto(33, 'Suore Serve di Maria Riparatrici', 'Casa per ritiri', 'Santa Marinella', 'Lazio', 'Santa Marinella', 'matergratiae@smr.it', 'Indirizzo da completare.'),
    posto(34, 'Sunbay Park Hotel', 'Albergo / pensione', 'Civitavecchia', 'Lazio', 'Civitavecchia', 'direzione@sunbayparkhotel.com', 'Indirizzo da completare.'),
    posto(35, 'Trinitari', 'Istituto religioso', 'Roma', 'Lazio', 'Roma / Rocca di Papa / Cori', 'curia@trinitari.org', 'Contatto Curia Generale. Vale anche per Rocca di Papa/Cori. Valutare se creare più record separati.')
];
