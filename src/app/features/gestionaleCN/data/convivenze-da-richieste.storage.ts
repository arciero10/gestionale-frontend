export type StatoConvivenzaDaRichiesta = 'BOZZA' | 'RICHIESTA_INVIATA' | 'IN_ATTESA_STRUTTURA' | 'CONFERMATA' | 'ANNULLATA';

export interface ConvivenzaDaRichiestaStruttura {
    id: number;
    structureRequestId: number;
    structureId: number | null;
    structureName: string;
    titolo: string;
    tipoConvivenza: string;
    communityName: string;
    parishName?: string | null;
    city?: string | null;
    startDate: string;
    endDate: string;
    peopleCount: number;
    adultsCount?: number | null;
    childrenCount?: number | null;
    notes?: string | null;
    status: StatoConvivenzaDaRichiesta;
    updatedAt: string;
}

const CONVIVENZE_DA_RICHIESTE_KEY = 'eventiComunità.convivenzeDaRichiesteStruttura';

export function readConvivenzeDaRichiesteStruttura(): ConvivenzaDaRichiestaStruttura[] {
    try {
        const raw = localStorage.getItem(CONVIVENZE_DA_RICHIESTE_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed.map(normalizeConvivenzaDaRichiesta).filter(Boolean) as ConvivenzaDaRichiestaStruttura[] : [];
    } catch {
        return [];
    }
}

export function upsertConvivenzaDaRichiestaStruttura(convivenza: ConvivenzaDaRichiestaStruttura): void {
    const items = readConvivenzeDaRichiesteStruttura();
    const normalized = normalizeConvivenzaDaRichiesta(convivenza);

    if (!normalized) {
        return;
    }

    const next = [
        normalized,
        ...items.filter((item) => item.structureRequestId !== normalized.structureRequestId)
    ];

    localStorage.setItem(CONVIVENZE_DA_RICHIESTE_KEY, JSON.stringify(next));
}

export function convivenzaIdFromStructureRequestId(structureRequestId: number): number {
    return 900000 + structureRequestId;
}

function normalizeConvivenzaDaRichiesta(raw: any): ConvivenzaDaRichiestaStruttura | null {
    const structureRequestId = Number(raw?.structureRequestId);

    if (!Number.isFinite(structureRequestId) || structureRequestId <= 0) {
        return null;
    }

    const titolo = String(raw?.titolo || raw?.tipoConvivenza || 'Convivenza da verificare').trim();
    const startDate = normalizeDate(raw?.startDate);
    const endDate = normalizeDate(raw?.endDate) || startDate;

    return {
        id: Number(raw?.id) || convivenzaIdFromStructureRequestId(structureRequestId),
        structureRequestId,
        structureId: raw?.structureId ? Number(raw.structureId) : null,
        structureName: String(raw?.structureName || 'Struttura da verificare').trim(),
        titolo,
        tipoConvivenza: String(raw?.tipoConvivenza || titolo).trim(),
        communityName: String(raw?.communityName || 'Comunità da completare').trim(),
        parishName: raw?.parishName ?? null,
        city: raw?.city ?? null,
        startDate,
        endDate,
        peopleCount: Number(raw?.peopleCount) || 0,
        adultsCount: raw?.adultsCount ?? null,
        childrenCount: raw?.childrenCount ?? null,
        notes: raw?.notes ?? null,
        status: normalizeStatus(raw?.status),
        updatedAt: String(raw?.updatedAt || new Date().toISOString())
    };
}

function normalizeDate(value: unknown): string {
    return String(value ?? '').slice(0, 10);
}

function normalizeStatus(value: unknown): StatoConvivenzaDaRichiesta {
    const normalized = String(value ?? '').trim().toUpperCase();
    return ['BOZZA', 'RICHIESTA_INVIATA', 'IN_ATTESA_STRUTTURA', 'CONFERMATA', 'ANNULLATA'].includes(normalized)
        ? normalized as StatoConvivenzaDaRichiesta
        : 'BOZZA';
}
