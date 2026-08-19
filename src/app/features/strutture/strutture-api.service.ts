import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { StrutturaProfileMock } from './struttura-profile.storage';

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

export interface StructureAccreditationResponse extends StructureAccreditationRequest {
    id: number;
    status: 'IN_ATTESA' | 'APPROVATA' | 'RESPINTA' | 'SOSPESA';
    createdAt?: string;
    updatedAt?: string;
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
