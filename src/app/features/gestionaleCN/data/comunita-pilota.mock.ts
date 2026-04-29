export type RuoloComunitaPilota = 'Presbitero' | 'Responsabile' | 'Corresponsabile' | 'Catechista' | 'Cantore' | 'Ostiario' | 'Fratello';
export type StatoMembroPilota = 'Attivo' | 'Temporaneamente assente' | 'Da contattare';
export type AccessoAppPilota = 'Nessuno' | 'Invitato' | 'Attivo' | 'In attesa';
export type ConsensoPrivacyPilota = 'Da inviare' | 'Da raccogliere' | 'Raccolto' | 'Negato' | 'Revocato';

export interface MembroComunitaPilota {
    id: number;
    nome: string;
    cognome: string;
    nomeCompleto: string;
    ruolo: RuoloComunitaPilota;
    accessoApp: AccessoAppPilota;
    statoMembro: StatoMembroPilota;
    consensoPrivacyStato: ConsensoPrivacyPilota;
    moduloPrivacyInviato: boolean;
    moduloPrivacyRicevuto: boolean;
    note: string;
}

export const COMUNITA_PILOTA = {
    numero: 3,
    nomeVisualizzato: '3ª Comunità',
    parrocchia: 'S. Maria delle Grazie alle Fornaci',
    settore: 'Ovest',
    diocesi: 'Diocesi di Roma'
} as const;

const baseMembro = {
    accessoApp: 'Nessuno' as const,
    statoMembro: 'Attivo' as const,
    consensoPrivacyStato: 'Da inviare' as const,
    moduloPrivacyInviato: false,
    moduloPrivacyRicevuto: false,
    note: ''
};

function membro(id: number, nome: string, cognome: string, ruolo: RuoloComunitaPilota): MembroComunitaPilota {
    return {
        id,
        nome,
        cognome,
        nomeCompleto: `${nome} ${cognome}`,
        ruolo,
        ...baseMembro
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
    membro(10, 'Chiara', 'Crivellari', 'Corresponsabile'),
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
    membro(36, 'Francesca', 'Greco', 'Fratello'),
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
    membro(56, 'Maria', 'Cernuzio', 'Fratello'),
    membro(57, 'Salvatore', 'Nicolini', 'Fratello'),
    membro(58, 'Stefano', 'Serranti', 'Fratello'),
    membro(59, 'Antonella', 'Serranti', 'Fratello'),
    membro(60, 'Vittoria', 'Cocciolito', 'Fratello'),
    membro(61, 'Paolo', 'Bencetti', 'Catechista'),
    membro(62, 'Angela', 'Bencetti', 'Catechista'),
    membro(63, 'Franco', 'Meloni', 'Catechista'),
    membro(64, 'Annamaria', 'Meloni', 'Catechista'),
    membro(65, 'Danilo', 'Greco', 'Catechista'),
    membro(66, 'Fiorella', 'Greco', 'Catechista'),
    membro(67, 'Rosanna', 'Lentini', 'Catechista')
];
