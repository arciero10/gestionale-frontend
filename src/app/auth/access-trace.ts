// In-memory, bounded, allowlisted diagnostics. Never accept URLs, claims or SDK messages.
export type AccessPhase = 'initialize' | 'restore' | 'unlock' | 'local_auth' | 'activation' | 'cache' |
  'token' | 'profile' | 'context' | 'navigation' | 'access' | 'background' | 'foreground' | 'http';
type Outcome = 'started' | 'ok' | 'failed' | 'cancelled' | 'retry' | 'HTTP_401' | 'HTTP_403' |
  'HTTP_5XX' | 'HTTP_OTHER' | 'TIMEOUT' | 'TLS' | 'CONNECTIVITY' | 'NETWORK' | 'PAYLOAD' | 'TOKEN' |
  'TOKEN_EXPIRED' | 'TOKEN_UNAVAILABLE' | 'TOKEN_INTERACTION' | 'TOKEN_AUDIENCE' | 'TOKEN_SCOPE' | 'TOKEN_FORMAT' | 'LIFECYCLE' | 'KEYCHAIN' | 'UNKNOWN';
const outcomes = new Set<Outcome>(['started','ok','failed','cancelled','retry','HTTP_401','HTTP_403',
  'HTTP_5XX','HTTP_OTHER','TIMEOUT','TLS','CONNECTIVITY','NETWORK','PAYLOAD','TOKEN',
  'TOKEN_EXPIRED','TOKEN_UNAVAILABLE','TOKEN_INTERACTION','TOKEN_AUDIENCE','TOKEN_SCOPE','TOKEN_FORMAT','LIFECYCLE','KEYCHAIN','UNKNOWN']);
const phases = new Set(['initialize','restore','unlock','local_auth','activation','cache','token','profile',
  'context','navigation','access','background','foreground','http']);
export class AccessTrace {
  private id = '';
  private origin = 0;
  private events: Array<{ phase: AccessPhase; atMs: number; elapsedMs: number; outcome: Outcome; httpStatus?: number }> = [];
  private previous = '';
  start(): string {
    this.previous = this.report();
    this.id = globalThis.crypto.randomUUID(); this.origin = performance.now(); this.events = [];
    this.event('access', 0, 'started');
    return this.id;
  }
  get correlationId(): string { return this.id; }
  finish(): void { this.event('access', performance.now()-this.origin); }
  event(phase: AccessPhase, elapsedMs = 0, outcome: string = 'ok', status?: number, expectedId = this.id): void {
    if (!this.id || expectedId !== this.id || !phases.has(phase)) return;
    const safe = outcomes.has(outcome as Outcome) ? outcome as Outcome : 'UNKNOWN';
    const event = { phase, atMs: Math.max(0, Math.round(performance.now()-this.origin)),
      elapsedMs: Number.isFinite(elapsedMs) ? Math.max(0, Math.min(3600000, Math.round(elapsedMs))) : 0, outcome: safe,
      ...(Number.isInteger(status) && status! >= 100 && status! <= 599 ? { httpStatus: status } : {}) };
    this.events.push(event); if (this.events.length > 80) this.events.shift();
    console.info('[ACCESS]', { correlationId: this.id, ...event });
  }
  native(value: unknown): void {
    const timings = value as Record<string, unknown> | undefined;
    for (const [key, phase] of [['localAuthenticationMs','local_auth'],['activationWaitMs','activation'],['cacheMs','cache']] as const) {
      const ms = timings?.[key]; if (typeof ms === 'number' && Number.isFinite(ms)) this.event(phase, ms);
    }
  }
  report(): string { return this.id ? JSON.stringify({ correlationId:this.id, events:this.events }, null, 2) : ''; }
  reports(): string { return [this.previous,this.report()].filter(Boolean).join('\n'); }
}
export const accessTrace = new AccessTrace();
