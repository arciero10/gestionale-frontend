import { PersonResponseDTO, Service } from './../models/person';
import { PersonCreate } from "@/models/person";
import { HttpClient, httpResource } from "@angular/common/http";
import { computed, inject, Injectable, signal, Signal } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "src/environments/environment.development";

@Injectable({
    providedIn: 'root'
})
export class PersonService {
    private apiUrl = `${environment.apiBaseUrl}/Person`;

    // 1. Il Signal modificabile che forza il ricaricamento
    private refreshTrigger = signal(0);
    http = inject(HttpClient);
    createProfile(data: PersonCreate): Observable<PersonResponseDTO> {
        return this.http.post<PersonResponseDTO>(`${this.apiUrl}/create`, data);
    }
    updateProfile(data: PersonCreate): Observable<PersonResponseDTO> {
        return this.http.post<PersonResponseDTO>(`${this.apiUrl}/update/${data.id}`, data);
    }


/*     getPersonById(guid: Signal<string | null>) {
        if(!guid) {
            return null;
        }
        return httpResource<PersonResponseDTO>(() => ({
            url: `${this.apiUrl}/${guid()}`,
            method: 'GET',
            initialValue: this.emptyPerson()
        }));
    } */

    getPersonById(guid: Signal<string | null>) {
        const refreshTriggerSignal = this.refreshTrigger;
        // 1. Crea un Signal COMPUTE che contiene l'ID SOLO SE è valido
        const validGuid = computed(() => {
            const id = guid();
            // Controlla che l'ID esista e non sia vuoto
            if (id && id.length > 0) {
                return id;
            }
            // Se non è valido, restituisce un valore "falso" o marker
            return null;
        });

        // 2. Passa il Signal filtrato a httpResource
        // La logica interna di httpResource deve essere robusta per gestire il 'null'
        return httpResource<PersonResponseDTO>(() => {
            const currentId = validGuid(); // Legge il Signal filtrato
            const refreshCount = refreshTriggerSignal();
            if (!currentId) {
                // Se l'ID è null, httpResource dovrebbe sapere come NON fare la chiamata
                // e restituire semplicemente l'initialValue.
                return {
                    url: '', // Una URL che non verrà triggerata
                    method: 'GET',
                    initialValue: this.emptyPerson(),
                    // Aggiungi una flag per evitare la fetch se l'URL è vuota/nulla
                    skipFetch: true
                };
            }

            return {
                url: `${this.apiUrl}/${currentId}`,
                method: 'GET',
                initialValue: this.emptyPerson()
            };
        });
    }
    
    reload(): void {
        this.refreshTrigger.update(count => count + 1);
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