import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { getApiConfiguration } from '../../../auth/api-config';
import { CommunityAccessRequest, OnboardingApiService } from '../../../auth/onboarding-api.service';

@Component({
    selector: 'app-approvazioni-appartenenza', standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, SelectModule],
    template: `
        @if (enabled && authorized) {
            <section class="access-approvals">
                <header><h2>Richieste di appartenenza</h2><button pButton type="button" label="Aggiorna" icon="pi pi-refresh" [disabled]="busy" (click)="load()"></button></header>
                @if (feedback) { <p role="status">{{ feedback }}</p> }
                @if (loading) { <p>Caricamento richieste...</p> }
                @else if (!requests.length) { <p>Nessuna richiesta di appartenenza.</p> }
                @for (request of requests; track request.id) {
                    <article>
                        <strong>{{ request.firstName }} {{ request.lastName }}</strong>
                        <span>{{ request.communityNumber }}ª Comunità · {{ request.parishName }}</span>
                        <span>Ruolo richiesto: {{ request.requestedRole }} · {{ request.status }}</span>
                        @if (request.status === 'IN_ATTESA_APPROVAZIONE') {
                            <label [for]="'person-' + request.id">Persona già censita, se presente</label>
                            <p-select [inputId]="'person-' + request.id" [options]="request.existingPeople" optionLabel="name" optionValue="id" [showClear]="true" placeholder="Nuova persona" [(ngModel)]="selectedPeople[request.id]" appendTo="body"></p-select>
                            <div class="actions">
                                <button pButton type="button" label="Approva" icon="pi pi-check" [disabled]="busy" (click)="review(request.id, 'approve')"></button>
                                <button pButton type="button" label="Rifiuta" icon="pi pi-times" severity="danger" outlined [disabled]="busy" (click)="review(request.id, 'reject')"></button>
                            </div>
                        }
                    </article>
                }
            </section>
        }
    `,
    styles: [`
        .access-approvals { background:rgba(255,255,255,.97); color:#0f172a; padding:1rem; border:1px solid #cbd5e1; border-radius:8px; }
        header,.actions { display:flex; justify-content:space-between; align-items:center; gap:.75rem; flex-wrap:wrap; }
        h2 { margin:0; font-size:1.15rem; } p,span,label { color:#334155; }
        article { display:grid; gap:.5rem; padding:1rem 0; border-top:1px solid #e2e8f0; margin-top:1rem; }
        .actions { justify-content:flex-start; } p-select { max-width:100%; }
    `]
})
export class ApprovazioniAppartenenza implements OnInit {
    private readonly api = inject(OnboardingApiService);
    readonly enabled = Boolean(getApiConfiguration().apiScope);
    authorized = false;
    loading = false;
    busy = false;
    feedback = '';
    requests: CommunityAccessRequest[] = [];
    selectedPeople: Record<number, number | undefined> = {};
    ngOnInit(): void { if (this.enabled) void this.load(); }
    async load(): Promise<void> {
        this.loading = true;
        try { this.requests = await this.api.getRequests(); this.authorized = true; }
        catch (error: unknown) {
            if ((error as { status?: number })?.status === 403) this.authorized = false;
            else { this.authorized = true; this.feedback = 'Impossibile caricare le richieste. Riprova.'; }
        } finally { this.loading = false; }
    }
    async review(id: number, action: 'approve' | 'reject'): Promise<void> {
        if (this.busy) return;
        this.busy = true;
        try {
            await this.api.review(id, action, this.selectedPeople[id]);
            this.feedback = action === 'approve' ? 'Appartenenza approvata.' : 'Richiesta rifiutata.';
            await this.load();
        } catch (error: unknown) {
            const response = error as { status?: number; error?: { message?: unknown } };
            this.feedback = typeof response?.error?.message === 'string' ? response.error.message : response?.status === 403
                ? 'Non sei autorizzato ad approvare questo ruolo o questa comunità.' : 'Operazione non riuscita. Aggiorna la lista e riprova.';
        } finally { this.busy = false; }
    }
}
