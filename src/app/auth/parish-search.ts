export function normalizedParishText(value: string): string {
  return value.normalize('NFD').replace(/\p{M}/gu, '').toLocaleUpperCase('it')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\b(S|SS|SAN|SANTA|SANTO|SANTI|SANTE|SANT)\b/g, 'S')
    .replace(/\s+/g, ' ').trim();
}
export function matchesParish(value: string, query: string): boolean {
  const haystack = normalizedParishText(value);
  return normalizedParishText(query).split(' ').filter(Boolean).every(word => haystack.includes(word));
}
