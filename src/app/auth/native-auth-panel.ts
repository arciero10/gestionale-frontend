import { Component, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MobileAuthService } from './mobile-auth.service';
import { NativeFlow } from './entra-native-core';

@Component({
  selector: 'app-native-auth-panel',
  standalone: true,
  imports: [FormsModule],
  template: `
    <main class="native-auth-page">
      <section aria-labelledby="native-auth-title">
        <button type="button" class="back" (click)="cancel()" [disabled]="busy()" aria-label="Torna alla schermata iniziale"><i class="pi pi-arrow-left" aria-hidden="true"></i> Indietro</button>
        <p class="brand">Eventi di Comunità</p>
        <h1 id="native-auth-title">{{ step() === 'unlock' ? 'Bentornato' : title() }}</h1>
        @if (message()) { <p class="feedback" role="alert">{{ message() }}</p> }
        @if (step() === 'unlock') {
          <p>Sblocca la sessione con biometria o codice del dispositivo.</p>
          <button type="button" class="primary" (click)="unlock()" [disabled]="busy()">Sblocca sessione</button>
          <button type="button" class="secondary" (click)="newLogin()" [disabled]="busy()">Accedi con un altro account</button>
        } @else if (step() === 'fallback') {
          <p>Questo metodo di accesso richiede il browser protetto del dispositivo.</p>
          <button type="button" class="primary" (click)="fallback()" [disabled]="busy()">Continua nel browser</button>
        } @else {
          <form (ngSubmit)="submit()">
            @if (step() === 'login' || step() === 'complete') {
              <label for="native-email">Email</label>
              <input id="native-email" name="email" type="email" [(ngModel)]="email" autocomplete="username" inputmode="email" required [disabled]="busy()" />
              @if (effectiveFlow() === 'signin' && method === 'password') {
                <label for="native-password">Password</label>
                <input id="native-password" name="password" type="password" [(ngModel)]="password" autocomplete="current-password" required [disabled]="busy()" />
              }
            }
            @if (step() === 'code') {
              <p>Inserisci il codice ricevuto via email.</p>
              <label for="native-code">Codice di verifica</label>
              <input id="native-code" name="code" [(ngModel)]="code" autocomplete="one-time-code" inputmode="numeric" required [disabled]="busy()" />
            }
            @if (step() === 'password') {
              <label for="native-new-password">{{ effectiveFlow() === 'signin' ? 'Password' : 'Nuova password' }}</label>
              <input id="native-new-password" name="password" type="password" [(ngModel)]="password" [autocomplete]="effectiveFlow() === 'signin' ? 'current-password' : 'new-password'" required [disabled]="busy()" />
            }
            @if (step() === 'attributes') {
              @for (attribute of mobile.nativeOutcome().attributes ?? []; track attribute.name) {
                <label [for]="'native-attribute-' + attribute.name">{{ attributeLabel(attribute.name, attribute.label) }}</label>
                <input [id]="'native-attribute-' + attribute.name" [name]="attribute.name" [(ngModel)]="attributes[attribute.name]" [required]="attribute.required" [disabled]="busy()" />
              }
            }
            <button class="primary" type="submit" [disabled]="busy()">{{ busy() ? 'Attendi...' : step() === 'login' ? title() : 'Continua' }}</button>
          </form>
          @if (step() === 'login' && effectiveFlow() === 'signin') {
            <button type="button" class="text-button" (click)="toggleMethod()" [disabled]="busy()">{{ method === 'password' ? 'Accedi con codice via email' : 'Accedi con password' }}</button>
            <button type="button" class="text-button" (click)="resetPassword()" [disabled]="busy()">Hai dimenticato la password?</button>
          }
          @if (step() === 'code') {
            <button type="button" class="text-button" (click)="resend()" [disabled]="busy()">Invia un nuovo codice</button>
          }
        }
      </section>
    </main>
  `,
  styles: [`
    :host{display:block;background:#f3f6fb;min-height:100dvh;color:#0f172a}
    .native-auth-page{min-height:100dvh;display:grid;place-items:center;padding:max(24px,env(safe-area-inset-top)) 24px max(24px,env(safe-area-inset-bottom))}
    section{width:100%;max-width:420px}h1{font-size:28px;margin:12px 0 24px;letter-spacing:0}.brand{font-weight:650;margin-top:28px;color:#334155}
    label{display:block;font-weight:600;margin:18px 0 8px}input{display:block;width:100%;min-height:48px;border:1px solid #94a3b8;border-radius:6px;background:white;color:#0f172a;padding:12px;font:inherit}
    button{font:inherit;cursor:pointer;min-height:48px;border-radius:6px;border:0;font-weight:600;white-space:normal}button:disabled{opacity:.6;cursor:wait}
    button:focus-visible,input:focus-visible{outline:3px solid #0891b2;outline-offset:3px}.primary,.secondary{width:100%;padding:12px 16px;margin-top:24px}.primary{background:#166534;color:white}.secondary{background:#e2e8f0;color:#0f172a}
    .back,.text-button{background:transparent;color:#174e73;padding:8px 0}.text-button{display:block;width:100%;margin-top:12px}.feedback{background:#fff1f2;border-left:3px solid #be123c;padding:12px;color:#881337;overflow-wrap:anywhere}
  `]
})
export class NativeAuthPanel {
  readonly flow = input<'signin' | 'signup'>('signin');
  readonly authenticated = output<void>();
  readonly closed = output<void>();
  protected readonly mobile = inject(MobileAuthService);
  protected readonly busy = signal(false);
  protected readonly message = signal<string | null>(null);
  private readonly overrideFlow = signal<NativeFlow | null>(null);
  protected email = '';
  protected password = '';
  protected code = '';
  protected method: 'password' | 'otp' = 'password';
  protected attributes: Record<string, string> = {};
  protected step(): string { return this.mobile.nativeOutcome().step; }
  protected effectiveFlow(): NativeFlow { return this.overrideFlow() ?? this.flow(); }
  protected title(): string { return this.effectiveFlow() === 'signup' ? 'Registrati' : this.effectiveFlow() === 'reset' ? 'Reimposta password' : 'Accedi'; }
  protected attributeLabel(name: string, label?: string): string {
    return ({ givenName: 'Nome', surname: 'Cognome', displayName: 'Nome visualizzato', city: 'Città', country: 'Paese' } as Record<string, string>)[name] ?? label ?? name;
  }
  private async perform(operation: () => Promise<void>): Promise<void> {
    if (this.busy()) return;
    this.busy.set(true);
    this.message.set(null);
    try {
      await operation();
      if (this.step() === 'complete') {
        this.overrideFlow.set('signin');
        this.message.set('Password aggiornata. Accedi con la nuova password.');
      }
      if (this.mobile.signedIn()) this.authenticated.emit();
    } catch (error) {
      const code = (error as { code?: string })?.code;
      this.message.set(code === 'CANCELLED' ? 'Operazione annullata. Puoi riprovare.' : code === 'UNLOCK_UNAVAILABLE'
        ? 'Sblocco dispositivo non disponibile. Accedi nuovamente.'
        : 'Operazione non completata. Controlla i dati, il codice e la connessione, poi riprova.');
    } finally { this.password = ''; this.code = ''; this.busy.set(false); }
  }
  protected submit(): void {
    void this.perform(async () => {
      if (this.step() === 'login' || this.step() === 'complete') {
        const password = this.password;
        this.password = '';
        await this.mobile.startNative({ flow: this.effectiveFlow(), email: this.email.trim(), method: this.method,
          ...(password ? { password } : {}) });
      } else {
        const submission = this.step() === 'code' ? { code: this.code.trim() }
          : this.step() === 'attributes' ? { attributes: { ...this.attributes } } : { password: this.password };
        this.password = ''; this.code = '';
        await this.mobile.submitNative(submission);
      }
    });
  }
  protected unlock(): void { void this.perform(() => this.mobile.unlockNative()); }
  protected fallback(): void { void this.perform(() => this.mobile.loginWithBrowserFallback()); }
  protected resend(): void { void this.perform(() => this.mobile.resendNative()); }
  protected toggleMethod(): void { this.method = this.method === 'password' ? 'otp' : 'password'; this.password = ''; }
  protected resetPassword(): void { this.overrideFlow.set('reset'); this.password = ''; this.message.set(null); }
  protected newLogin(): void { void this.perform(async () => { await this.mobile.cancelNative(); this.mobile.requestLogin(); }); }
  protected cancel(): void { void this.perform(async () => { await this.mobile.cancelNative(); this.closed.emit(); }); }
}
