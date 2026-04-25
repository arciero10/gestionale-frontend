import { Parish } from "@/models/parish";
import { httpResource } from "@angular/common/http";
import { Injectable, computed } from "@angular/core";
import { environment } from "src/environments/environment";

@Injectable({
    providedIn: 'root'
})
export class ParishService {
    private apiUrl = `${environment.apiBaseUrl}/Parish`;

    // Signal-based HTTP resource that handles loading, data, and errors automatically
    public parishesResource = httpResource<Parish[]>(() => ({
        url: `${this.apiUrl}`,
        method: 'GET',
    }));

    // Computed signal that returns the data or empty array
    public parishes = computed(() => this.parishesResource.value() ?? []);

    // The resource already provides loading state
    public isLoading = computed(() => this.parishesResource.isLoading());

    // Access error state if needed
    public error = computed(() => this.parishesResource.error());

    // Method to manually reload the resource
    reload(): void {
        this.parishesResource.reload();
    }
}