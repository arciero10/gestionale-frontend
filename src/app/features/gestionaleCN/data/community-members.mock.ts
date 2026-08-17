export type StatoFratello =
    | 'DA_COMPLETARE'
    | 'INVITO_DA_INVIARE'
    | 'INVITO_INVIATO'
    | 'IN_COMPILAZIONE'
    | 'COMPLETATO'
    | 'PRIVACY_MANCANTE'
    | 'DA_VERIFICARE'
    | 'ARCHIVIATO';

export type StatoPrivacyFratello = 'MANCANTE' | 'INVIATA' | 'PARZIALE' | 'COMPLETATA' | 'REVOCATA';
export type OrigineFratello = 'INSERITO_DAL_RESPONSABILE' | 'INVITATO_DAL_RESPONSABILE';

export interface CommunityMemberMock {
    id: string;
    nome: string;
    cognome: string;
    email: string;
    telefono?: string;
    sesso?: string;
    dataNascita?: string;
    ruoloComunitario?: string;
    note?: string;
    indirizzo?: string;
    contattoEmergenza?: string;
    noteSanitarie?: string;
    statoProfilo: StatoFratello;
    statoPrivacy: StatoPrivacyFratello;
    statoInvito: 'DA_INVIARE' | 'INVIATO' | 'NON_PREVISTO';
    origine: OrigineFratello;
    token?: string;
    inviteLink?: string;
    createdAt: string;
    invitedAt?: string;
    completedAt?: string;
    privacyTrattamentoDati?: boolean;
    consensoComunicazioni?: boolean;
    consensoFotoVideo?: boolean;
    confermaDatiCorretti?: boolean;
}

export interface CommunityMemberCompletionPayload {
    nome: string;
    cognome: string;
    email: string;
    telefono?: string;
    dataNascita?: string;
    indirizzo?: string;
    contattoEmergenza?: string;
    noteSanitarie?: string;
    privacyTrattamentoDati: boolean;
    consensoComunicazioni: boolean;
    consensoFotoVideo: boolean;
    confermaDatiCorretti: boolean;
}

export const COMMUNITY_MEMBERS_STORAGE_KEY = 'communityMembersMock';
const INVITE_BASE_PATH = '/registrazione-fratello';

const DEMO_MEMBERS: CommunityMemberMock[] = [
    {
        id: 'member-demo-1',
        nome: 'Marco',
        cognome: 'Bianchi',
        email: 'marco.bianchi@example.test',
        telefono: '3330000001',
        sesso: 'Maschio',
        ruoloComunitario: 'Responsabile',
        statoProfilo: 'COMPLETATO',
        statoPrivacy: 'COMPLETATA',
        statoInvito: 'NON_PREVISTO',
        origine: 'INSERITO_DAL_RESPONSABILE',
        createdAt: '2026-01-12T10:00:00.000Z',
        completedAt: '2026-01-12T10:20:00.000Z'
    },
    {
        id: 'member-demo-2',
        nome: 'Lucia',
        cognome: 'Verdi',
        email: 'lucia.verdi@example.test',
        telefono: '3330000002',
        sesso: 'Femmina',
        statoProfilo: 'INVITO_INVIATO',
        statoPrivacy: 'MANCANTE',
        statoInvito: 'INVIATO',
        origine: 'INVITATO_DAL_RESPONSABILE',
        token: 'demo',
        inviteLink: `${INVITE_BASE_PATH}?token=demo`,
        createdAt: '2026-01-13T11:00:00.000Z',
        invitedAt: '2026-01-13T11:05:00.000Z'
    }
];

export function readCommunityMembers(): CommunityMemberMock[] {
    if (typeof localStorage === 'undefined') {
        return DEMO_MEMBERS;
    }

    const raw = localStorage.getItem(COMMUNITY_MEMBERS_STORAGE_KEY);

    if (!raw) {
        saveCommunityMembers(DEMO_MEMBERS);
        return [...DEMO_MEMBERS];
    }

    try {
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) {
            throw new Error('communityMembersMock non e un array');
        }

        return parsed.map(normalizeMember);
    } catch {
        saveCommunityMembers(DEMO_MEMBERS);
        return [...DEMO_MEMBERS];
    }
}

export function saveCommunityMembers(members: CommunityMemberMock[]): void {
    localStorage.setItem(COMMUNITY_MEMBERS_STORAGE_KEY, JSON.stringify(members));
}

export function addManualCommunityMember(input: Partial<CommunityMemberMock>): CommunityMemberMock {
    const members = readCommunityMembers();
    const member = normalizeMember({
        ...input,
        id: createId(),
        statoProfilo: 'DA_COMPLETARE',
        statoPrivacy: 'MANCANTE',
        statoInvito: 'NON_PREVISTO',
        origine: 'INSERITO_DAL_RESPONSABILE',
        createdAt: new Date().toISOString()
    });

    saveCommunityMembers([member, ...members]);
    return member;
}

export function inviteCommunityMember(input: Partial<CommunityMemberMock>): CommunityMemberMock {
    const members = readCommunityMembers();
    const token = createToken();
    const member = normalizeMember({
        ...input,
        id: createId(),
        statoProfilo: 'INVITO_INVIATO',
        statoPrivacy: 'MANCANTE',
        statoInvito: 'INVIATO',
        origine: 'INVITATO_DAL_RESPONSABILE',
        token,
        inviteLink: buildInviteLink(token),
        createdAt: new Date().toISOString(),
        invitedAt: new Date().toISOString()
    });

    saveCommunityMembers([member, ...members]);
    return member;
}

export function updateCommunityMember(member: CommunityMemberMock): void {
    const members = readCommunityMembers();
    saveCommunityMembers(members.map((item) => (item.id === member.id ? normalizeMember(member) : item)));
}

export function findCommunityMemberByToken(token: string | null): CommunityMemberMock | null {
    if (!token) {
        return null;
    }

    return readCommunityMembers().find((member) => member.token === token) ?? null;
}

export function completeCommunityMember(token: string, payload: CommunityMemberCompletionPayload): CommunityMemberMock | null {
    const member = findCommunityMemberByToken(token);

    if (!member) {
        return null;
    }

    const completed: CommunityMemberMock = normalizeMember({
        ...member,
        ...payload,
        statoProfilo: 'COMPLETATO',
        statoPrivacy: payload.privacyTrattamentoDati && payload.confermaDatiCorretti ? 'COMPLETATA' : 'PARZIALE',
        completedAt: new Date().toISOString()
    });

    updateCommunityMember(completed);
    return completed;
}

export function resendInvite(member: CommunityMemberMock): CommunityMemberMock {
    const token = member.token || createToken();
    const updated = normalizeMember({
        ...member,
        token,
        inviteLink: buildInviteLink(token),
        statoProfilo: member.statoProfilo === 'COMPLETATO' ? member.statoProfilo : 'INVITO_INVIATO',
        statoInvito: 'INVIATO',
        invitedAt: new Date().toISOString()
    });

    updateCommunityMember(updated);
    return updated;
}

export function buildInviteLink(token: string): string {
    return `${INVITE_BASE_PATH}?token=${encodeURIComponent(token)}`;
}

export function absoluteInviteLink(member: CommunityMemberMock): string {
    const link = member.inviteLink || (member.token ? buildInviteLink(member.token) : '');
    return link ? `${window.location.origin}${link}` : '';
}

export function statoFratelloLabel(stato: StatoFratello): string {
    const labels: Record<StatoFratello, string> = {
        DA_COMPLETARE: 'Da completare',
        INVITO_DA_INVIARE: 'Invito da inviare',
        INVITO_INVIATO: 'Invito inviato',
        IN_COMPILAZIONE: 'In compilazione',
        COMPLETATO: 'Completato',
        PRIVACY_MANCANTE: 'Privacy mancante',
        DA_VERIFICARE: 'Da verificare',
        ARCHIVIATO: 'Archiviato'
    };
    return labels[stato];
}

export function privacyFratelloLabel(stato: StatoPrivacyFratello): string {
    const labels: Record<StatoPrivacyFratello, string> = {
        MANCANTE: 'Mancante',
        INVIATA: 'Inviata',
        PARZIALE: 'Parziale',
        COMPLETATA: 'Completata',
        REVOCATA: 'Revocata'
    };
    return labels[stato];
}

function normalizeMember(input: Partial<CommunityMemberMock>): CommunityMemberMock {
    return {
        id: input.id || createId(),
        nome: input.nome || '',
        cognome: input.cognome || '',
        email: input.email || '',
        telefono: input.telefono || '',
        sesso: input.sesso || '',
        dataNascita: input.dataNascita || '',
        ruoloComunitario: input.ruoloComunitario || '',
        note: input.note || '',
        indirizzo: input.indirizzo || '',
        contattoEmergenza: input.contattoEmergenza || '',
        noteSanitarie: input.noteSanitarie || '',
        statoProfilo: input.statoProfilo || 'DA_COMPLETARE',
        statoPrivacy: input.statoPrivacy || 'MANCANTE',
        statoInvito: input.statoInvito || 'DA_INVIARE',
        origine: input.origine || 'INSERITO_DAL_RESPONSABILE',
        token: input.token,
        inviteLink: input.inviteLink || (input.token ? buildInviteLink(input.token) : undefined),
        createdAt: input.createdAt || new Date().toISOString(),
        invitedAt: input.invitedAt,
        completedAt: input.completedAt,
        privacyTrattamentoDati: input.privacyTrattamentoDati ?? false,
        consensoComunicazioni: input.consensoComunicazioni ?? false,
        consensoFotoVideo: input.consensoFotoVideo ?? false,
        confermaDatiCorretti: input.confermaDatiCorretti ?? false
    };
}

function createId(): string {
    return `member-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createToken(): string {
    return `inv-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
