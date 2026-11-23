const phases = new Set(['configuration', 'start', 'challenge', 'resend', 'token', 'unlock', 'logout', 'restore']);
const messages: Record<string, string> = {
  AUTH_CONFIGURATION: 'Accesso non disponibile per questa configurazione dell’app. Contatta l’assistenza.',
  AUTH_TRANSPORT: 'Il servizio di accesso non è raggiungibile. Riprova tra poco.',
  AUTH_METHOD_UNAVAILABLE: 'Il servizio richiede un metodo diverso dal codice email. Contatta l’assistenza.',
  AUTH_BROWSER_REQUIRED: 'Il servizio richiede un accesso nel browser protetto. Nessun browser è stato aperto automaticamente.',
  AUTH_SIGNIN_REJECTED: 'Il servizio non ha accettato la richiesta di accesso. Contatta l’assistenza se il problema persiste.',
  AUTH_START_FAILED: 'Non è stato possibile avviare l’invio del codice. Riprova o comunica il codice di assistenza.',
  AUTH_CHALLENGE_REJECTED: 'Il codice non è stato accettato. Puoi riprovare o richiederne uno nuovo.',
  AUTH_CHALLENGE_FAILED: 'Non è stato possibile completare la verifica del codice. Riprova.',
  AUTH_TOKEN_FAILED: 'Non è stato possibile completare la sessione di accesso. Riprova.',
  AUTH_SDK_RESULT: 'Il servizio ha restituito un risultato di accesso non riconosciuto. Riprova.'
};

export function nativeAuthDiagnostic(error: unknown): { message: string; reference: string; code: string; phase: string; serverCodes: number[] } | null {
  if (!error || typeof error !== 'object') return null;
  const value = error as { code?: unknown; data?: unknown };
  const data = value.data && typeof value.data === 'object' ? value.data as Record<string, unknown> : {};
  const code = typeof value.code === 'string' ? value.code : data['code'];
  if (typeof code !== 'string' || !Object.hasOwn(messages, code)) return null;
  const phase = typeof data['phase'] === 'string' && phases.has(data['phase']) ? data['phase'] : 'start';
  const serverCodes = Array.isArray(data['serverCodes']) ? [...new Set(data['serverCodes'].filter((n): n is number => Number.isSafeInteger(n) && n > 0 && n < 10_000_000))].sort((a,b)=>a-b).slice(0,3) : [];
  return { message: messages[code], code, phase, serverCodes,
    reference: `${data['platform'] === 'ios' ? 'IOS' : 'NATIVE'}-${phase}-${code}${serverCodes.length ? '-' + serverCodes.join('.') : ''}` };
}
