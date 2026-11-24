import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Capacitor } from '@capacitor/core';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom, timeout, retry, timer, throwError, mergeMap, of } from 'rxjs';
import { getApiConfiguration } from './api-config';
import { backendUserContext, CurrentUserContext } from './current-user-context';
import { profileFailureCode, profileTraceCategory } from './profile-diagnostics';
import { accessTrace } from './access-trace';

@Injectable({ providedIn: 'root' })
export class CurrentUserService {
    private readonly http = inject(HttpClient);
    private accountKey: string | null = null;
    private pending: Promise<void> | null = null;
    private generation = 0;
    readonly context = backendUserContext.asReadonly();
    readonly state = signal<'disabled' | 'loading' | 'ready' | 'error'>('disabled');
    readonly failure = signal<string | null>(null);

    load(accountKey: string): Promise<void> {
        const api = getApiConfiguration();
        if (!api.apiScope) return Promise.resolve();
        if (this.accountKey === accountKey && this.state() !== 'error') return this.pending ?? Promise.resolve();
        this.reset();
        const generation = this.generation;
        this.accountKey = accountKey;
        this.state.set('loading');
        const startedAt = performance.now();
        const native = Capacitor.isNativePlatform();
        this.pending = firstValueFrom(this.http.get<CurrentUserContext>(`${api.apiBaseUrl}/me`, { observe: 'response' }).pipe(
            timeout(native ? 14000 : 20000),
            retry({ count: native ? 1 : 0, delay: error => {
                // Retry only completed, recoverable GET failures. Never replay an invalid token,
                // malformed profile or timed-out native request that may still be in flight.
                if (this.generation !== generation || !(error instanceof HttpErrorResponse) || ![0,502,503,504].includes(error.status)) return throwError(() => error);
                if (error.error?.profileFailure === 'TLS') return throwError(() => error);
                if (error.error?.profileFailure === 'CANCELLED') return throwError(() => error);
                accessTrace.event('profile', performance.now()-startedAt, 'retry', error.status);
                console.info('[AUTH timing] profile retry', { attempt: 2, httpStatus: error.status, elapsedMs: Math.round(performance.now()-startedAt) });
                return timer(200).pipe(mergeMap(() => this.generation === generation ? of(0) : throwError(() => error)));
            } })
        ))
            .then(response => {
                const contextStarted = performance.now();
                const context = response.body;
                if (Capacitor.isNativePlatform()) console.info('[AUTH native] /api/me', { httpStatus: response.status });
                if (this.accountKey !== accountKey || this.generation !== generation) return;
                if (!context || context.authenticated !== true || !Array.isArray(context.permissions) ||
                    (context.linkedToCommunity && (!Number.isInteger(context.communityId) || context.communityId! <= 0)))
                    throw Object.assign(new Error('Contesto backend non valido.'), { profileFailure: 'PAYLOAD' });
                backendUserContext.set(context);
                this.state.set('ready');
                accessTrace.event('context', performance.now()-contextStarted, 'ok', response.status);
                console.info('[AUTH timing] profile ready', { elapsedMs: Math.round(performance.now()-startedAt) });
            }).catch((error: unknown) => {
                if (Capacitor.isNativePlatform()) console.info('[AUTH native] /api/me failed', { httpStatus: error instanceof HttpErrorResponse ? error.status : null });
                if (this.accountKey !== accountKey || this.generation !== generation) return;
                backendUserContext.set(null);
                this.state.set('error');
                this.failure.set(profileFailureCode(error));
                accessTrace.event('profile', performance.now()-startedAt, profileTraceCategory(error), error instanceof HttpErrorResponse ? error.status : undefined);
                console.info('[AUTH profile] failed', { code: this.failure() });
                console.info('[AUTH timing] profile failed', { elapsedMs: Math.round(performance.now()-startedAt), httpStatus: error instanceof HttpErrorResponse ? error.status : null });
                console.warn('[API] Impossibile recuperare /api/me. Nessuna associazione locale usata come contesto DB.');
            });
        return this.pending;
    }

    reset(): void {
        if (this.state() === 'loading') accessTrace.event('profile', 0, 'cancelled');
        this.generation++;
        this.accountKey = null;
        this.pending = null;
        backendUserContext.set(null);
        this.state.set('disabled');
        this.failure.set(null);
    }

    async refresh(): Promise<void> {
        const accountKey = this.accountKey;
        if (!accountKey) throw new Error('Account corrente non disponibile. Riprova dopo il login.');
        this.reset();
        await this.load(accountKey);
        if (this.state() === 'error') throw new Error('Contesto backend non disponibile.');
    }
}
