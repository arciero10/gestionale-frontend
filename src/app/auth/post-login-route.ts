export function postLoginDestination(native: boolean, linked: boolean, verifiedGlobalAdmin = false): string {
  if (native && verifiedGlobalAdmin) return '/mobile/admin';
  return linked ? native ? '/mobile/home' : '/gestionale-cn/dashboard'
    : native ? '/mobile/onboarding' : '/gestionale-cn/onboarding-comunita';
}
