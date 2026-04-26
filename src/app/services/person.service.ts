import { PersonResponseDTO, Service } from './../models/person';
import { PersonCreate } from '@/models/person';
import { HttpClient, httpResource } from '@angular/common/http';
import { computed, inject, Injectable, signal, Signal } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root'
})
export class PersonService {
    private apiUrl = `${environment.apiBaseUrl}/Person`;

    private refreshTrigger = signal(0);

    private http = inject(HttpClient);

    createProfile(data: PersonCreate): Observable<PersonResponseDTO> {
        return this.http.post<PersonResponseDTO>(`${this.apiUrl}/create`, data);
    }

    updateProfile(data: PersonCreate): Observable<PersonResponseDTO> {
        return this.http.post<PersonResponseDTO>(`${this.apiUrl}/update/${data.id}`, data);
    }

    getPersonById(userId: Signal<string | null>) {
        return httpResource<PersonResponseDTO>(() => {
            const currentUserId = userId();
            const refreshCount = this.refreshTrigger();

            if (!currentUserId || !this.isGuid(currentUserId)) {
                return undefined;
            }

            return {
                url: `${this.apiUrl}/${currentUserId}`,
                method: 'GET'
            };
        }, {
            defaultValue: this.emptyPerson()
        });
    }

    reload(): void {
        this.refreshTrigger.update(count => count + 1);
    }

    private isGuid(value: string): boolean {
        return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
    }

    private emptyPerson(): PersonResponseDTO {
        return {
            id: 0,
            firstName: '',
            lastName: '',
            email: '',
            address: null,
            city: null,
            region: null,
            phoneNumber: null,
            postalCode: null,
            country: null,
            birthDate: null,
            notes: null,
            service: Service.None,
            createdAt: null,
            disability: null,
            parishId: null,
            communityNumber: null,
            communityId: null,
            userId: null
        };
    }
}