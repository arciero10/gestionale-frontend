export function operationalMobileUrl(url: string): boolean {
  if (!url.startsWith('/mobile/')) return false;
  const parsed = new URL(url, 'https://app.local');
  if (['code','state','access_token','id_token'].some(key=>parsed.searchParams.has(key) || new URLSearchParams(parsed.hash.slice(1)).has(key))) return false;
  const path = url.split(/[?#]/)[0];
  return path.startsWith('/mobile/') && path !== '/mobile/onboarding' && !path.startsWith('/mobile/onboarding/');
}
export function mobileParent(url: string): string {
  const path = url.split(/[?#]/)[0];
  if (/^\/mobile\/community\/import\/[^/]+\/row\//.test(path)) return path.split('/').slice(0,5).join('/');
  if (/^\/mobile\/community\/import\/[^/]+$/.test(path)) return '/mobile/community/import';
  if (path.startsWith('/mobile/community/')) return '/mobile/community';
  if (path === '/mobile/community') return '/mobile/community-life';
  if (path.startsWith('/mobile/calendar/')) return '/mobile/calendario';
  if (['/mobile/calendar','/mobile/calendario','/mobile/gruppi','/mobile/birthdays','/mobile/avvisi'].includes(path)) return '/mobile/community-life';
  if (['/mobile/convivenze','/mobile/posti-convivenza'].includes(path)) return '/mobile/retreats';
  if (['/mobile/account','/mobile/privacy','/mobile/complete-profile','/mobile/informazioni','/mobile/approvazioni'].includes(path)) return '/mobile/profilo';
  return '/mobile/home';
}
// In-memory operational history only: never retains login/OTP URLs or survives logout.
export class MobileNavigationHistory {
  private entries: string[] = [];
  reset(): void { this.entries = []; }
  visit(url: string, restored = false): void {
    if (!operationalMobileUrl(url)) { this.reset(); return; }
    if (url.split(/[?#]/)[0] === '/mobile/home') { this.entries = [url]; return; }
    if (restored) {
      const index = this.entries.lastIndexOf(url);
      if (index >= 0) { this.entries = this.entries.slice(0,index+1); return; }
    }
    if (this.entries.at(-1) !== url) this.entries = [...this.entries.slice(-39),url];
  }
  back(current: string): string {
    if (current.split(/[?#]/)[0] === '/mobile/home') return '/mobile/home';
    if (this.entries.at(-1) === current) this.entries.pop();
    return this.entries.at(-1) ?? mobileParent(current);
  }
}
