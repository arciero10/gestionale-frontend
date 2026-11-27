import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {PlatformInvitationsAdmin} from '../../mobile/platform-invitations-admin';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { getApiConfiguration } from '../../../auth/api-config';
import { CommunityAccessRequest, OnboardingApiService } from '../../../auth/onboarding-api.service';
import { TAPPE_CAMMINO } from '../data/tappe-cammino.mock';
import { COMMUNITY_ONBOARDING_ROLES } from '../../../auth/community-roles';
import { CommunityApiService } from '../../../services/community-api.service';
import { CurrentUserService } from '../../../auth/current-user.service';

@Component({
    selector: 'app-approvazioni-appartenenza', standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, SelectModule, PlatformInvitationsAdmin],
    template: `
        @if (enabled && authorized) {
            <section class="access-approvals">
                <header><h2>Richieste di appartenenza</h2><button pButton type="button" label="Aggiorna" icon="pi pi-refresh" [disabled]="busy" (click)="load()"></button></header>
                <app-platform-invitations-admin />
                @if (feedback) { <p role="status">{{ feedback }}</p> }
                @if (loading) { <p>Caricamento richieste...</p> }
                @else if (!requests.length) { <p>Nessuna richiesta di appartenenza.</p> }
                @for (request of requests; track request.id) {
                    <article>
                        <strong>{{ request.firstName }} {{ request.lastName }}</strong>
                        @if (request.email) { <span>{{request.email}}</span> }
                        <span>{{ request.communityNumber }}ª Comunità · {{ request.parishName }}</span>
                        <span>Ruolo richiesto: {{ request.requestedRole }} · {{ request.status }}</span>
                        @if(request.referentName){<p>Referente segnalato, da verificare: {{request.referentName}} · {{request.referentContact}}</p>}
                        @if (request.status === 'IN_ATTESA_APPROVAZIONE') {
                            @if (request.candidates?.length) { <div><strong>Possibile corrispondenza</strong>@for(candidate of request.candidates;track candidate.id){<p>{{candidate.name}} · {{candidate.reasons.includes('FUZZY_NAME')?'Nome simile, da verificare':'Dati compatibili, da verificare'}}</p>}</div> }
                            <div class="actions"><button type="button" pButton label="Collega a persona esistente" [disabled]="busy || !request.existingPeople.length" (click)="decisions[request.id] = 'EXISTING'"></button><button type="button" pButton label="Crea nuova persona" [disabled]="busy" (click)="decisions[request.id] = 'NEW'; selectedPeople[request.id] = undefined"></button></div>
                            @if (decisions[request.id] !== 'NEW') {
                            <label [for]="'person-' + request.id">Persona già censita, se presente</label>
                            <p-select [inputId]="'person-' + request.id" [options]="request.existingPeople" optionLabel="name" optionValue="id" [showClear]="true" placeholder="Nuova persona" [(ngModel)]="selectedPeople[request.id]" appendTo="body"></p-select>
                            } @else { @if (edits[request.id];as edit) {
                              <label>Nome<input [(ngModel)]="edit.firstName" maxlength="100" [disabled]="busy" /></label><label>Cognome<input [(ngModel)]="edit.lastName" maxlength="100" [disabled]="busy" /></label>
                              <label>Ruolo da approvare<select [(ngModel)]="edit.role" [disabled]="busy"><option [value]="request.requestedRole">{{request.requestedRole}}</option>@for(role of roles;track role.value){@if(role.value!==request.requestedRole){<option [value]="role.value">{{role.label}}</option>}}</select></label>
                              <label>Tappa del Cammino<select [(ngModel)]="edit.stage" [disabled]="busy"><option value="">Non indicata</option>@for(stage of stages;track stage){<option [value]="stage">{{stage}}</option>}</select></label>
                              @if(spouseCandidates.length){<label>Coniuge opzionale<select [(ngModel)]="edit.spouseId" [disabled]="busy"><option [ngValue]="null">Nessun collegamento</option>@for(person of spouseCandidates;track person.personId){<option [ngValue]="person.personId">{{person.firstName}} {{person.lastName}}</option>}</select></label>}
                            }
                            }
                            <div class="actions">
                                @if (request.canApprove) { <button pButton type="button" label="Approva accesso" icon="pi pi-check" [disabled]="busy || request.requestedRole === 'RESPONSIBLE' && !reasons[request.id]?.trim() || decisions[request.id] !== 'NEW' && !selectedPeople[request.id]" (click)="review(request.id, 'approve')"></button> }
                                @if (request.canReject) { <label>Motivazione della decisione<input [(ngModel)]="reasons[request.id]" maxlength="500" [disabled]="busy" /></label><button pButton type="button" label="Rifiuta" icon="pi pi-times" severity="danger" outlined [disabled]="busy || !reasons[request.id]?.trim()" (click)="review(request.id, 'reject')"></button> }
                                @if (!request.canApprove && !request.canReject) { <span>È richiesta un'approvazione superiore; non puoi approvare la tua richiesta.</span> }
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
        article { display:grid; gap:.5rem; padding:1rem 0; border-top:1px solid #e2e8f0; margin-top:1rem; min-width:0; overflow-wrap:anywhere; }
        .actions { justify-content:flex-start; } p-select { max-width:100%; }
        input,select{box-sizing:border-box;width:100%;min-width:0;min-height:48px;padding:12px;border:1px solid #94a3b8;border-radius:6px;background:#fff;color:#0f172a;font:inherit}label{display:grid;gap:8px}
    `]
})
export class ApprovazioniAppartenenza implements OnInit {
    private readonly api = inject(OnboardingApiService);
    private readonly community = inject(CommunityApiService);
    private readonly current = inject(CurrentUserService);
    readonly enabled = Boolean(getApiConfiguration().apiScope);
    authorized = false;
    loading = false;
    busy = false;
    feedback = '';
    reasons:Partial<Record<number,string>>={};
    requests: CommunityAccessRequest[] = [];
    selectedPeople: Record<number, number | undefined> = {};
    decisions: Record<number,'NEW'|'EXISTING'> = {};
    edits: Record<number,{firstName:string;lastName:string;role:string;stage:string;spouseId:number|null}> = {};
    spouseCandidates: {personId:number;firstName:string;lastName:string}[]=[];
    readonly stages = TAPPE_CAMMINO;
    readonly roles = COMMUNITY_ONBOARDING_ROLES.filter(x=>x.backend!=='RESPONSIBLE').map(x=>({value:x.backend,label:x.label}));
    ngOnInit(): void { if (this.enabled) {void this.load();if(this.current.context()?.permissions.includes('EDIT_MEMBRI'))void this.community.getSpouseOptions().then(x=>this.spouseCandidates=x.candidates).catch(()=>this.spouseCandidates=[]);} }
    async load(): Promise<void> {
        this.loading = true;
        try { this.requests = await this.api.getRequests(); this.authorized = true;
            for(const request of this.requests){this.decisions[request.id]??=request.existingPeople.length?'EXISTING':'NEW';this.edits[request.id]??={firstName:request.firstName,lastName:request.lastName,role:request.requestedRole,stage:request.requestedStage,spouseId:null};}
        }
        catch (error: unknown) {
            if ((error as { status?: number })?.status === 403) this.authorized = false;
            else { this.authorized = true; this.feedback = 'Impossibile caricare le richieste. Riprova.'; }
        } finally { this.loading = false; }
    }
    async review(id: number, action: 'approve' | 'reject'): Promise<void> {
        if (this.busy) return;
        this.busy = true;
        try {
            await this.api.review(id, action, this.decisions[id]==='EXISTING'?this.selectedPeople[id]:undefined, {...(this.decisions[id]==='NEW'?this.edits[id]:{}),reason:this.reasons[id]});
            this.feedback = action === 'approve' ? 'Appartenenza approvata.' : 'Richiesta rifiutata.';
            await this.load();
        } catch (error: unknown) {
            const response = error as { status?: number; error?: { message?: unknown } };
            this.feedback = typeof response?.error?.message === 'string' ? response.error.message : response?.status === 403
                ? 'Non sei autorizzato ad approvare questo ruolo o questa comunità.' : 'Operazione non riuscita. Aggiorna la lista e riprova.';
        } finally { this.busy = false; }
    }
}
