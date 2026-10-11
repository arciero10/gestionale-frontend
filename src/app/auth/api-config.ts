import { environment } from '../../environments/environment';

export interface ApiConfiguration { apiBaseUrl: string; apiScope: string; }
let configuration: ApiConfiguration = { apiBaseUrl: environment.apiBaseUrl, apiScope: environment.apiScope };

export function getApiConfiguration(): Readonly<ApiConfiguration> { return configuration; }

export async function loadApiConfiguration(): Promise<void> {
    try {
        const response = await fetch('/api-config.json', { cache: 'no-store', signal: AbortSignal.timeout(3000) });
        if (!response.ok) return;
        const data: unknown = await response.json();
        if (!data || typeof data !== 'object') return;
        const values = data as Record<string, unknown>;
        const baseUrl = typeof values['API_BASE_URL'] === 'string' ? values['API_BASE_URL'].trim().replace(/\/$/, '') : configuration.apiBaseUrl;
        const parsed = new URL(baseUrl);
        if (parsed.protocol !== 'https:' && !(parsed.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(parsed.hostname)))
            throw new Error('API_BASE_URL deve usare HTTPS.');
        configuration = { apiBaseUrl: baseUrl, apiScope: typeof values['API_SCOPE'] === 'string' ? values['API_SCOPE'].trim() : configuration.apiScope };
    } catch {
        console.warn('[API] Configurazione runtime non disponibile; uso configurazione build.');
    }
}
