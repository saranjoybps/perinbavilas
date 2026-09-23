/** Safe batch size for create + welcome email on Vercel (timeout + Gmail rate limits). */
export const MAX_BULK_USERS = 50;
/** Softer guidance shown in the admin UI. */
export const RECOMMENDED_BULK_USERS = 40;

/**
 * Derive a readable display name from an email local-part.
 * e.g. anita.kumar+pv@… → "Anita Kumar"
 */
export function nameFromEmail(email) {
  const local = String(email || '')
    .split('@')[0]
    .split('+')[0]
    .replace(/[._-]+/g, ' ')
    .replace(/\d+/g, ' ')
    .trim();

  if (!local) return 'Family Member';

  return local
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}
