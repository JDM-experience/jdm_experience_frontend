/** Mirrors the backend's src/lib/whatsapp.ts exactly -- wa.me needs a bare international-format
 *  digit string, no leading +, spaces, dashes, or parentheses. Applied only at link-generation
 *  time; the stored number itself keeps whatever formatting was typed in Contact Settings. */
export function buildWaMeLink(rawNumber: string): string {
  const digits = rawNumber.replace(/[^\d+]/g, '').replace(/^\+/, '');
  return `https://wa.me/${digits}`;
}
