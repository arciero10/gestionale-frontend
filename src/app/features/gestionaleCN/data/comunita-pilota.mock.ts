export type RuoloComunitaPilota = 'Presbitero' | 'Responsabile' | 'Corresponsabile' | 'Catechista' | 'Cantore' | 'Ostiario' | 'Fratello';
export type RuoloOperativoComunita = 'Responsabile' | 'Corresponsabile' | 'Cantore' | 'Ostiario' | 'Fratello';
export type StatoMembroPilota = 'Attivo' | 'Temporaneamente assente' | 'Da contattare';
export type AccessoAppPilota = 'Nessuno' | 'Invitato' | 'Attivo' | 'In attesa';
export type ConsensoPrivacyPilota = 'Da inviare' | 'Inviato' | 'Da raccogliere' | 'Raccolto' | 'Negato' | 'Revocato';

export interface MembroComunitaPilota {
    id: number;
    nome: string;
    cognome: string;
    nomeCompleto: string;
    ruolo: Exclude<RuoloComunitaPilota, 'Catechista'>;
    accessoApp: AccessoAppPilota;
    statoMembro: StatoMembroPilota;
    consensoPrivacyStato: ConsensoPrivacyPilota;
    moduloPrivacyInviato: boolean;
    moduloPrivacyRicevuto: boolean;
    dataInvioModuloPrivacy: string;
    telefono: string;
    email: string;
    note: string;
}

export interface CatechistaComunita {
    id: number;
    nome: string;
    cognome: string;
    ruolo: 'Catechista';
    tipo: 'Equipe dei catechisti';
    comunitaPropria: string;
    parrocchiaPropria: string;
    telefono: string;
    email: string;
    note: string;
    operativo: false;
}

export type TipoUnitaEquipeCatechisti = 'Coppia' | 'Fratello singolo' | 'Sorella singola';
export type GenereMembroEquipeCatechisti = 'Fratello' | 'Sorella';
export type TipoUnitaMembroComunita = 'Coppia' | 'Fratello singolo' | 'Sorella singola';
export type GenereMembroComunita = 'Fratello' | 'Sorella';

export interface MembroEquipeCatechisti {
    id: number;
    nome: string;
    cognome: string;
    genere: GenereMembroEquipeCatechisti;
    telefono: string;
    email: string;
    capoEquipe: boolean;
}

export interface EquipeCatechistiUnita {
    id: number;
    tipoUnita: TipoUnitaEquipeCatechisti;
    nomeVisualizzato: string;
    membri: MembroEquipeCatechisti[];
    capoEquipe: boolean;
    telefono: string;
    email: string;
    note: string;
}

export interface ComunitaFigliaEquipe {
    id: number;
    nomeVisualizzato: string;
    parrocchia: string;
}

export interface EquipeCatechisti {
    id: number;
    nomeEquipe: string;
    capoEquipeId: number | null;
    membriEquipe: EquipeCatechistiUnita[];
    comunitaFiglie: ComunitaFigliaEquipe[];
}

export interface MembroUnitaComunita {
    id: number;
    membroId?: number;
    nome: string;
    cognome: string;
    genere: GenereMembroComunita;
    email: string;
}

export interface UnitaMembroComunita {
    id: number;
    tipoUnita: TipoUnitaMembroComunita;
    nomeVisualizzato: string;
    membri: MembroUnitaComunita[];
    emailRiferimento: string;
    note: string;
}

export const COMUNITA_PILOTA = {
    numero: 3,
    nomeVisualizzato: '3ª Comunità',
    parrocchia: 'S. Maria delle Grazie alle Fornaci',
    settore: 'Ovest',
    diocesi: 'Diocesi di Roma',
    tappaCammino: 'Precatecumenato'
} as const;

const baseMembro = {
    accessoApp: 'Nessuno' as const,
    statoMembro: 'Attivo' as const,
    consensoPrivacyStato: 'Da inviare' as const,
    moduloPrivacyInviato: false,
    moduloPrivacyRicevuto: false,
    dataInvioModuloPrivacy: '',
    telefono: '',
    email: '',
    note: ''
};

function membro(id: number, nome: string, cognome: string, ruolo: MembroComunitaPilota['ruolo'], overrides: Partial<MembroComunitaPilota> = {}): MembroComunitaPilota {
    return {
        id,
        nome,
        cognome,
        nomeCompleto: `${nome} ${cognome}`,
        ruolo,
        ...baseMembro,
        ...overrides
    };
}

function catechista(id: number, nome: string, cognome: string): CatechistaComunita {
    return {
        id,
        nome,
        cognome,
        ruolo: 'Catechista',
        tipo: 'Equipe dei catechisti',
        comunitaPropria: 'Da verificare',
        parrocchiaPropria: 'Da verificare',
        telefono: '',
        email: '',
        note: 'Equipe dei catechisti',
        operativo: false
    };
}

export const MEMBRI_COMUNITA_PILOTA: MembroComunitaPilota[] = [
    membro(1, 'Don Antonio', 'Grappone', 'Presbitero'),
    membro(2, 'Don Giulio', 'Barbieri', 'Presbitero'),
    membro(3, 'Silvia', 'Corona', 'Responsabile'),
    membro(4, 'Alessandro', 'Arciero', 'Corresponsabile'),
    membro(5, 'Egidio', 'Carducci', 'Corresponsabile'),
    membro(6, 'Daniela', 'Carducci', 'Corresponsabile'),
    membro(7, 'Giulio', 'Longo', 'Corresponsabile'),
    membro(8, 'Barbara', 'Longo', 'Corresponsabile'),
    membro(9, 'Massimiliano', 'Crivellari', 'Corresponsabile'),
    membro(10, 'Chiara', 'Filippi', 'Fratello', { email: 'chiarafili77@yahoo.it' }),
    membro(11, 'Angela', 'Carnovale', 'Fratello'),
    membro(12, 'Angelo', 'Casale', 'Fratello'),
    membro(13, 'Clotilde', 'Casale', 'Fratello'),
    membro(14, 'Annamaria', 'Stortini', 'Fratello'),
    membro(15, 'Assunta', 'Ciaccio', 'Fratello'),
    membro(16, 'Barbara', 'Gattari', 'Fratello'),
    membro(17, 'Cristina', 'Martini', 'Fratello'),
    membro(18, 'Cristiano', 'Giagnorio', 'Fratello'),
    membro(19, 'Laura', 'Giagnorio', 'Fratello'),
    membro(20, 'Damiano', 'Raspollini', 'Fratello'),
    membro(21, 'Giulia', 'Raspollini', 'Fratello'),
    membro(22, 'Daniele', 'Cardarelli', 'Fratello'),
    membro(23, 'Silvia', 'Cardarelli', 'Fratello'),
    membro(24, 'Davide', 'Milano', 'Fratello'),
    membro(25, 'Giulia', 'Milano', 'Fratello'),
    membro(26, 'Emmanuel', 'Baciarlini', 'Fratello'),
    membro(27, 'Eufemia', 'Agosto', 'Fratello'),
    membro(28, 'Fabio', 'Giordano', 'Fratello'),
    membro(29, 'Chiara', 'Giordano', 'Fratello'),
    membro(30, 'Francesca', 'Cerroni', 'Fratello'),
    membro(31, 'Francesca', 'Fazi', 'Fratello'),
    membro(32, 'Francesco', 'Nicastro', 'Fratello'),
    membro(33, 'Sara', 'Nicastro', 'Fratello'),
    membro(34, 'Grazia', 'Argentino', 'Fratello'),
    membro(35, 'Giovanni', 'Greco', 'Fratello'),
    membro(36, 'Francesca', 'Piergentili', 'Fratello'),
    membro(37, 'Giuseppe', 'Schiavinotto', 'Fratello'),
    membro(38, 'Nicoletta', 'Schiavinotto', 'Fratello'),
    membro(39, 'Liviana', 'Olivetti', 'Fratello'),
    membro(40, 'Maria Pia', 'Manuali', 'Fratello'),
    membro(41, 'Marco', 'Cioffarelli', 'Fratello'),
    membro(42, 'Angela', 'Cioffarelli', 'Fratello'),
    membro(43, 'Marta', 'Zargar', 'Fratello'),
    membro(44, 'Massimo', "D'Orazi", 'Fratello'),
    membro(45, 'Stefania', "D'Orazi", 'Fratello'),
    membro(46, 'Matteo', 'Tabarini', 'Fratello'),
    membro(47, 'Paola', 'Martinetti', 'Fratello'),
    membro(48, 'Paolo', 'Pianigiani', 'Fratello'),
    membro(49, 'Manuela', 'Pianigiani', 'Fratello'),
    membro(50, 'Paolo', 'Celli', 'Fratello'),
    membro(51, 'Rita', 'Celli', 'Fratello'),
    membro(52, 'Rita', 'Comodi', 'Fratello'),
    membro(53, 'Roberto', 'De Chiara', 'Fratello'),
    membro(54, 'Flaviana', 'De Chiara', 'Fratello'),
    membro(55, 'Salvatore', 'Cernuzio', 'Fratello'),
    membro(56, 'Maria', 'Baciarlini', 'Fratello'),
    membro(57, 'Salvatore', 'Nicolini', 'Fratello'),
    membro(58, 'Stefano', 'Serranti', 'Fratello'),
    membro(59, 'Antonella', 'Serranti', 'Fratello'),
    membro(60, 'Vittoria', 'Cocciolito', 'Fratello')
];

const coppieComunitaPilota = [
    { ids: [5, 6], nomeVisualizzato: 'Egidio e Daniela Carducci' },
    { ids: [18, 19], nomeVisualizzato: 'Cristiano e Laura Giagnorio' },
    { ids: [35, 36], nomeVisualizzato: 'Giovanni Greco e Francesca Piergentili' },
    { ids: [55, 56], nomeVisualizzato: 'Salvatore e Maria Baciarlini' }
];

function genereDaNome(nome: string): GenereMembroComunita {
    const fratelli = ['Don Antonio', 'Don Giulio', 'Alessandro', 'Egidio', 'Giulio', 'Massimiliano', 'Angelo', 'Cristiano', 'Damiano', 'Daniele', 'Davide', 'Emmanuel', 'Fabio', 'Francesco', 'Giovanni', 'Giuseppe', 'Marco', 'Massimo', 'Matteo', 'Paolo', 'Roberto', 'Salvatore', 'Stefano'];
    return fratelli.includes(nome) ? 'Fratello' : 'Sorella';
}

function membroUnita(membro: MembroComunitaPilota): MembroUnitaComunita {
    return {
        id: membro.id,
        membroId: membro.id,
        nome: membro.nome,
        cognome: membro.cognome,
        genere: genereDaNome(membro.nome),
        email: membro.email
    };
}

function creaUnitaComunita(): UnitaMembroComunita[] {
    const idsAccoppiati = new Set(coppieComunitaPilota.flatMap((coppia) => coppia.ids));
    const unitaCoppie = coppieComunitaPilota
        .map((coppia, index) => {
            const membri = coppia.ids.map((id) => MEMBRI_COMUNITA_PILOTA.find((membro) => membro.id === id)).filter((membro): membro is MembroComunitaPilota => !!membro);
            return {
                id: index + 1,
                tipoUnita: 'Coppia' as const,
                nomeVisualizzato: coppia.nomeVisualizzato,
                membri: membri.map(membroUnita),
                emailRiferimento: membri.find((membro) => membro.email)?.email ?? '',
                note: 'Unita organizzativa del censimento. I consensi restano individuali.'
            };
        })
        .filter((unita) => unita.membri.length > 1);

    const unitaSingole = MEMBRI_COMUNITA_PILOTA.filter((membro) => !idsAccoppiati.has(membro.id)).map((membro, index) => {
        const genere = genereDaNome(membro.nome);
        return {
            id: unitaCoppie.length + index + 1,
            tipoUnita: genere === 'Fratello' ? 'Fratello singolo' as const : 'Sorella singola' as const,
            nomeVisualizzato: membro.nomeCompleto,
            membri: [membroUnita(membro)],
            emailRiferimento: membro.email,
            note: 'Unita organizzativa del censimento. Il modulo privacy resta individuale.'
        };
    });

    return [...unitaCoppie, ...unitaSingole];
}

export const UNITA_MEMBRI_COMUNITA_PILOTA: UnitaMembroComunita[] = creaUnitaComunita();

export const CATECHISTI_COMUNITA_PILOTA: CatechistaComunita[] = [
    catechista(1, 'Paolo', 'Bencetti'),
    catechista(2, 'Angela', 'Bencetti'),
    catechista(3, 'Franco', 'Meloni'),
    catechista(4, 'Annamaria', 'Meloni'),
    catechista(5, 'Danilo', 'Greco'),
    catechista(6, 'Fiorella', 'Greco'),
    catechista(7, 'Rosanna', 'Lentini')
];

export const EQUIPE_CATECHISTI_UNITA_PILOTA: EquipeCatechistiUnita[] = [
    {
        id: 1,
        tipoUnita: 'Coppia',
        nomeVisualizzato: 'Paolo e Angela Bencetti',
        membri: [
            { id: 1, nome: 'Paolo', cognome: 'Bencetti', genere: 'Fratello', telefono: '', email: '', capoEquipe: false },
            { id: 2, nome: 'Angela', cognome: 'Bencetti', genere: 'Sorella', telefono: '', email: '', capoEquipe: false }
        ],
        capoEquipe: false,
        telefono: '',
        email: '',
        note: ''
    },
    {
        id: 2,
        tipoUnita: 'Coppia',
        nomeVisualizzato: 'Franco e Annamaria Meloni',
        membri: [
            { id: 3, nome: 'Franco', cognome: 'Meloni', genere: 'Fratello', telefono: '', email: '', capoEquipe: false },
            { id: 4, nome: 'Annamaria', cognome: 'Meloni', genere: 'Sorella', telefono: '', email: '', capoEquipe: false }
        ],
        capoEquipe: false,
        telefono: '',
        email: '',
        note: ''
    },
    {
        id: 3,
        tipoUnita: 'Coppia',
        nomeVisualizzato: 'Danilo e Fiorella Greco',
        membri: [
            { id: 5, nome: 'Danilo', cognome: 'Greco', genere: 'Fratello', telefono: '', email: '', capoEquipe: false },
            { id: 6, nome: 'Fiorella', cognome: 'Greco', genere: 'Sorella', telefono: '', email: '', capoEquipe: false }
        ],
        capoEquipe: false,
        telefono: '',
        email: '',
        note: ''
    },
    {
        id: 4,
        tipoUnita: 'Sorella singola',
        nomeVisualizzato: 'Rosanna Lentini',
        membri: [{ id: 7, nome: 'Rosanna', cognome: 'Lentini', genere: 'Sorella', telefono: '', email: '', capoEquipe: false }],
        capoEquipe: false,
        telefono: '',
        email: '',
        note: ''
    }
];

export const EQUIPE_CATECHISTI_PILOTA: EquipeCatechisti = {
    id: 1,
    nomeEquipe: 'Equipe di Paolo e Angela Bencetti',
    capoEquipeId: null,
    membriEquipe: EQUIPE_CATECHISTI_UNITA_PILOTA,
    comunitaFiglie: [
        {
            id: 1,
            nomeVisualizzato: COMUNITA_PILOTA.nomeVisualizzato,
            parrocchia: COMUNITA_PILOTA.parrocchia
        }
    ]
};
