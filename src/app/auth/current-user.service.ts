import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Capacitor } from '@capacitor/core';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom, timeout } from 'rxjs';
import { getApiConfiguration } from './api-config';
import { backendUserContext, CurrentUserContext } from './current-user-context';

@Injectable({ providedIn: 'root' })
export class CurrentUserService {
    private readonly http = inject(HttpClient);
    private accountKey: string | null = null;
    private pending: Promise<void> | null = null;
    private generation = 0;
    readonly context = backendUserContext.asReadonly();
    readonly state = signal<'disabled' | 'loading' | 'ready' | 'error'>('disabled');

    load(accountKey: string): Promise<void> {
        const api = getApiConfiguration();
        if (!api.apiScope) return Promise.resolve();
        if (this.accountKey === accountKey) return this.pending ?? Promise.resolve();
        this.reset();
        const generation = this.generation;
        this.accountKey = accountKey;
        this.state.set('loading');
        this.pending = firstValueFrom(this.http.get<CurrentUserContext>(`${api.apiBaseUrl}/me`, { observe: 'response' }).pipe(timeout(20000)))
            .then(response => {
                const context = response.body;
                if (Capacitor.isNativePlatform()) console.info('[AUTH native] /api/me', { httpStatus: response.status, linkedToCommunity: context?.linkedToCommunity === true,
                    status: ['LINKED', 'UNLINKED', 'IN_ATTESA_APPROVAZIONE', 'ASSOCIATION_REQUIRED', 'SUSPENDED', 'REJECTED'].includes(context?.status ?? '') ? context?.status : 'OTHER' });
                if (this.accountKey !== accountKey || this.generation !== generation) return;
                if (!context || context.authenticated !== true || !Array.isArray(context.permissions) ||
                    (context.linkedToCommunity && (!Number.isInteger(context.communityId) || context.communityId! <= 0)))
                    throw new Error('Contesto backend non valido.');
                backendUserContext.set(context);
                this.state.set('ready');
            }).catch((error: unknown) => {
                if (Capacitor.isNativePlatform()) console.info('[AUTH native] /api/me failed', { httpStatus: error instanceof HttpErrorResponse ? error.status : null });
                if (this.accountKey !== accountKey || this.generation !== generation) return;
                backendUserContext.set(null);
                this.state.set('error');
                console.warn('[API] Impossibile recuperare /api/me. Nessuna associazione locale usata come contesto DB.');
            });
        return this.pending;
    }

    reset(): void {
        this.generation++;
        this.accountKey = null;
        this.pending = null;
        backendUserContext.set(null);
        this.state.set('disabled');
    }

    async refresh(): Promise<void> {
        const accountKey = this.accountKey;
        if (!accountKey) throw new Error('Account corrente non disponibile. Riprova dopo il login.');
        this.reset();
        await this.load(accountKey);
        if (this.state() === 'error') throw new Error('Contesto backend non disponibile.');
    }
}
