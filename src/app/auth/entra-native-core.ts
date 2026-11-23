export type NativeFlow = 'signin' | 'signup' | 'reset';
export type NativeStep = 'login' | 'code' | 'password' | 'attributes' | 'authenticated' | 'complete' | 'fallback' | 'unlock';
export interface NativeOutcome {
  step: NativeStep;
  diagnostic?: Record<string, unknown>;
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
  private signingOut: Promise<void> | null = null;
  constructor(private readonly bridge: NativeAuthBridge) {}
  get signedIn(): boolean { return this.outcome.step === 'authenticated'; }
  private async transition(operation: () => Promise<NativeOutcome>, phase = 'start'): Promise<NativeOutcome> {
    const version = this.version;
    const outcome = await operation();
    if (version !== this.version) throw new Error('Operazione annullata.');
    if (!outcome || !['login', 'code', 'password', 'attributes', 'authenticated', 'complete', 'fallback', 'unlock'].includes(outcome.step)) {
      throw Object.assign(new Error('Unrecognized native authentication result.'), { code: 'AUTH_SDK_RESULT', data: { phase } });
    }
    this.outcome = outcome;
    return outcome;
  }
  restore(): Promise<NativeOutcome> { return this.transition(() => this.bridge.restore(), 'restore'); }
  async start(options: NativeStart): Promise<NativeOutcome> {
    // Cancelling a challenge does not remove an SDK account from secure storage.
    const signingOut = this.logout();
    const version = this.version;
    await signingOut;
    if (version !== this.version) throw new Error('Operazione annullata.');
    return this.transition(async () => {
      try { return await this.bridge.start(options); }
      catch (error) {
        const value = error as { code?: string; message?: string };
        if (!/account.*already.*signed.?in/i.test(`${value?.code ?? ''} ${value?.message ?? ''}`)) throw error;
        if (version !== this.version) throw error;
        await this.bridge.logout();
        if (version !== this.version) throw new Error('Operazione annullata.');
        return this.bridge.start(options);
      }
    });
  }
  submit(options: NativeSubmission): Promise<NativeOutcome> { return this.transition(() => this.bridge.submit(options), 'challenge'); }
  resend(): Promise<NativeOutcome> { return this.transition(() => this.bridge.resend(), 'resend'); }
  unlock(): Promise<NativeOutcome> { return this.transition(() => this.bridge.unlock(), 'unlock'); }
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
  logout(): Promise<void> {
    this.version++;
    this.outcome = { step: 'login' };
    return this.signingOut ??= this.bridge.logout().then(() => undefined)
      .finally(() => { this.signingOut = null; });
  }
}
