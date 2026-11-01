export function postLoginDestination(native: boolean, linked: boolean): string {
  return linked ? native ? '/mobile/home' : '/gestionale-cn/dashboard'
    : native ? '/mobile/onboarding' : '/gestionale-cn/onboarding-comunita';
}
