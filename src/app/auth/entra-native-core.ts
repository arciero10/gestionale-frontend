export type NativeFlow = 'signin' | 'signup' | 'reset';
export type NativeStep = 'login' | 'code' | 'password' | 'attributes' | 'authenticated' | 'complete' | 'fallback' | 'unlock';
export interface NativeOutcome {
  step: NativeStep;
  attributes?: { name: string; label?: string; required: boolean }[];
}
export interface NativeStart { flow: NativeFlow; email: string; password?: string; method: 'password' | 'otp' }
export interface NativeSubmission { code?: string; password?: string; attributes?: Record<string, string> }
export interface NativeAuthBridge {
  configure(options: { clientId: string; tenantSubdomain: string; authority: string; scopes: string[] }): Promise<unknown>;
  start(options: NativeStart): Promise<NativeOutcome>;
  submit(options: NativeSubmission): Promise<NativeOutcome>;
  resend(): Promise<NativeOutcome>;
  restore(): Promise<NativeOutcome>;
  unlock(): Promise<NativeOutcome>;
  lock(): Promise<void>;
  cancel(): Promise<void>;
  logout(): Promise<unknown>;
  getAccessToken(): Promise<{ accessToken: string }>;
}

// No credentials or tokens retained here: native SDKs own their protected cache.
export class EntraNativeSession {
  outcome: NativeOutcome = { step: 'login' };
  private version = 0;
  constructor(private readonly bridge: NativeAuthBridge) {}
  get signedIn(): boolean { return this.outcome.step === 'authenticated'; }
  private async transition(operation: () => Promise<NativeOutcome>): Promise<NativeOutcome> {
    const version = this.version;
    const outcome = await operation();
    if (version !== this.version) throw new Error('Operazione annullata.');
    this.outcome = outcome;
    return outcome;
  }
  restore(): Promise<NativeOutcome> { return this.transition(() => this.bridge.restore()); }
  start(options: NativeStart): Promise<NativeOutcome> { return this.transition(() => this.bridge.start(options)); }
  submit(options: NativeSubmission): Promise<NativeOutcome> { return this.transition(() => this.bridge.submit(options)); }
  resend(): Promise<NativeOutcome> { return this.transition(() => this.bridge.resend()); }
  unlock(): Promise<NativeOutcome> { return this.transition(() => this.bridge.unlock()); }
  async accessToken(): Promise<string> {
    if (!this.signedIn) throw new Error('Sblocca la sessione o accedi nuovamente.');
    const version = this.version;
    const result = await this.bridge.getAccessToken();
    if (version !== this.version || !this.signedIn || !result.accessToken) throw new Error('Sessione bloccata.');
    return result.accessToken;
  }
  async lock(): Promise<void> {
    this.version++;
    if (this.signedIn) this.outcome = { step: 'unlock' };
    await this.bridge.lock();
  }
  async cancel(): Promise<void> { this.version++; this.outcome = { step: 'login' }; await this.bridge.cancel(); }
  async logout(): Promise<void> { this.version++; this.outcome = { step: 'login' }; await this.bridge.logout(); }
}
