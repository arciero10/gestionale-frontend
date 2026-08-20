import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { StrutturaProfileMock } from './struttura-profile.storage';

export type StructureStatus = 'IN_ATTESA' | 'APPROVATA' | 'RESPINTA' | 'SOSPESA';

export interface StructureAccreditationRequest {
    name: string;
    type: string;
    description: string;
    address: string;
    city: string;
    region: string;
    referentName: string;
    email: string;
    phone: string;
    capacity: number;
    beds: number;
    rooms: number;
    halls: number;
    hasChapel: boolean;
    hasCanteen: boolean;
    hasInternalKitchen: boolean;
    hasParking: boolean;
    hasDisabledAccess: boolean;
    hasOutdoorSpaces: boolean;
    acceptsFamiliesWithChildren: boolean;
    indicativeRates: string;
    depositConditions: string;
    cancellationConditions: string;
}

export interface StructurePhotoResponse {
    id: number;
    structureId: number;
    category: string;
    url: string;
    description?: string | null;
    isCover: boolean;
    createdAt?: string;
}

export interface StructureAccreditationResponse extends StructureAccreditationRequest {
    id: number;
    status: StructureStatus;
    createdAt?: string;
    updatedAt?: string;
    approvedAt?: string | null;
    approvedBy?: string | null;
    rejectedAt?: string | null;
    rejectionReason?: string | null;
    suspendedAt?: string | null;
    suspensionReason?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    googlePlaceId?: string | null;
    googleFormattedAddress?: string | null;
    addressVerified?: boolean;
    photos?: StructurePhotoResponse[] | null;
}

export interface RejectStructureRequest {
    reason?: string;
}

export type StructureRequestStatus = 'INVIATA' | 'IN_VALUTAZIONE' | 'ACCETTATA' | 'RIFIUTATA' | 'ANNULLATA';

export interface StructureRequestCreateRequest {
    structureId?: number | null;
    structureName?: string | null;
    requestedByName: string;
    requestedByEmail: string;
    requestedByPhone?: string | null;
    communityName?: string | null;
    parishName?: string | null;
    city?: string | null;
    eventType?: string;
    convivenzaType: string;
    startDate: string;
    endDate: string;
    peopleCount: number;
    adultsCount?: number | null;
    childrenCount?: number | null;
    notes?: string | null;
}

export interface StructureRequestResponse extends StructureRequestCreateRequest {
    id: number;
    status: StructureRequestStatus;
    createdAt: string;
    updatedAt?: string | null;
    reviewedAt?: string | null;
    reviewedBy?: string | null;
    responseNotes?: string | null;
}

export interface StructureRequestStatusUpdateRequest {
    status: StructureRequestStatus;
    reviewedBy?: string | null;
    responseNotes?: string | null;
}

@Injectable({ providedIn: 'root' })
export class StruttureApiService {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = environment.apiBaseUrl.replace(/\/$/, '');

    createAccreditation(profile: StrutturaProfileMock): Observable<StructureAccreditationResponse> {
        return this.http.post<StructureAccreditationResponse>(
            `${this.baseUrl}/structures/accreditation`,
            this.toAccreditationPayload(profile)
        );
    }

    getAdminStructures(): Observable<StructureAccreditationResponse[]> {
        return this.http.get<StructureAccreditationResponse[]>(`${this.baseUrl}/admin/structures`);
    }

    getAdminStructure(id: number): Observable<StructureAccreditationResponse> {
        return this.http.get<StructureAccreditationResponse>(`${this.baseUrl}/admin/structures/${id}`);
    }

    approveStructure(id: number): Observable<StructureAccreditationResponse> {
        return this.http.post<StructureAccreditationResponse>(`${this.baseUrl}/admin/structures/${id}/approve`, {});
    }

    rejectStructure(id: number, reason?: string): Observable<StructureAccreditationResponse> {
        const body: RejectStructureRequest = reason?.trim() ? { reason: reason.trim() } : {};
        return this.http.post<StructureAccreditationResponse>(`${this.baseUrl}/admin/structures/${id}/reject`, body);
    }

    getCatalogStructures(): Observable<StructureAccreditationResponse[]> {
        return this.http.get<StructureAccreditationResponse[]>(`${this.baseUrl}/catalog/structures`);
    }

    createStructureRequest(payload: StructureRequestCreateRequest): Observable<StructureRequestResponse> {
        return this.http.post<StructureRequestResponse>(`${this.baseUrl}/structure-requests`, payload);
    }

    getAdminStructureRequests(status?: StructureRequestStatus): Observable<StructureRequestResponse[]> {
        const suffix = status ? `?status=${encodeURIComponent(status)}` : '';
        return this.http.get<StructureRequestResponse[]>(`${this.baseUrl}/admin/structure-requests${suffix}`);
    }

    updateStructureRequestStatus(id: number, payload: StructureRequestStatusUpdateRequest): Observable<StructureRequestResponse> {
        return this.http.patch<StructureRequestResponse>(`${this.baseUrl}/admin/structure-requests/${id}/status`, payload);
    }

    toAccreditationPayload(profile: StrutturaProfileMock): StructureAccreditationRequest {
        return {
            name: profile.nome.trim(),
            type: profile.tipo.trim(),
            description: profile.descrizione.trim(),
            address: profile.indirizzo.trim(),
            city: profile.citta.trim(),
            region: profile.regione.trim(),
            referentName: profile.referente.trim(),
            email: profile.email.trim(),
            phone: profile.telefono.trim(),
            capacity: this.toPositiveNumber(profile.capienza),
            beds: this.toPositiveNumber(profile.postiLetto),
            rooms: this.toPositiveNumber(profile.camere),
            halls: this.toPositiveNumber(profile.sale),
            hasChapel: Boolean(profile.cappella),
            hasCanteen: Boolean(profile.mensa),
            hasInternalKitchen: Boolean(profile.cucinaInterna),
            hasParking: Boolean(profile.parcheggio),
            hasDisabledAccess: Boolean(profile.accessibilitaDisabili),
            hasOutdoorSpaces: Boolean(profile.spaziEsterni),
            acceptsFamiliesWithChildren: Boolean(profile.famiglieConBambini),
            indicativeRates: profile.tariffeIndicative.trim(),
            depositConditions: profile.condizioniCaparra.trim(),
            cancellationConditions: profile.condizioniCancellazione.trim()
        };
    }

    private toPositiveNumber(value: number | string | null | undefined): number {
        if (typeof value === 'number') {
            return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
        }

        const parsed = Number.parseInt(String(value ?? '').replace(/[^\d-]/g, ''), 10);
        return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
    }
}
