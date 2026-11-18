import { parsePhoneNumberFromString } from 'libphonenumber-js/min';

export function memberContactLinks(phone?: string): { call: string; whatsapp: string } | null {
  if (!phone?.trim()) return null;
  const number = parsePhoneNumberFromString(phone.trim(), 'IT');
  if (!number?.isValid()) return null;
  return { call: 'tel:' + number.number, whatsapp: 'https://wa.me/' + number.number.slice(1) };
}
