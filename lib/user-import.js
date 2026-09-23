import { adminDb } from '@/lib/firebase/admin';
import { formatName } from '@/lib/formatters';
import { nameFromEmail } from '@/lib/user-import-shared';

export { MAX_BULK_USERS, RECOMMENDED_BULK_USERS, nameFromEmail } from '@/lib/user-import-shared';

const FAMILIES_COLLECTION = 'families';

function sanitizeDocId(code) {
  return String(code || '').trim().replace(/\//g, '-');
}

/** Lightweight family-book name lookup (no child hydration). */
export async function lookupFamilyNameByCode(code) {
  const clean = String(code || '').trim();
  if (!clean) return '';

  try {
    const doc = await adminDb.collection(FAMILIES_COLLECTION).doc(sanitizeDocId(clean)).get();
    if (!doc.exists) return '';
    const name = String(doc.data()?.name || '').trim();
    return name ? formatName(name) : '';
  } catch (err) {
    console.error(`Family name lookup failed for code ${clean}:`, err?.message || err);
    return '';
  }
}

/**
 * Resolve displayName: spreadsheet → family code → email local-part.
 * @returns {{ displayName: string, source: 'sheet' | 'family' | 'email' }}
 */
export async function resolveDisplayName({ name, displayName, email, code } = {}) {
  const fromSheet = String(displayName || name || '').trim();
  if (fromSheet) {
    return { displayName: formatName(fromSheet) || fromSheet, source: 'sheet' };
  }

  const fromFamily = await lookupFamilyNameByCode(code);
  if (fromFamily) {
    return { displayName: fromFamily, source: 'family' };
  }

  return { displayName: nameFromEmail(email), source: 'email' };
}
