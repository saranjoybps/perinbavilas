import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

/**
 * Vercel / .env pastes often wrap the key in quotes or use escaped newlines.
 * Normalize so firebase-admin can parse the PEM.
 */
export function normalizePrivateKey(raw) {
  if (!raw) return undefined;

  let key = String(raw).trim();

  // Strip wrapping quotes from copy/paste
  if (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'"))
  ) {
    key = key.slice(1, -1).trim();
  }

  // \\n → \n → real newline (handles double-escaped Vercel values)
  key = key.replace(/\\\\n/g, '\n').replace(/\\n/g, '\n');
  key = key.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  return key;
}

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim();
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
const privateKey = normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY);

/** @type {'credential' | 'project-only'} */
let initMode = 'project-only';
/** @type {string | null} */
let certError = null;

let app;
if (!getApps().length) {
  if (clientEmail && privateKey) {
    try {
      app = initializeApp({
        credential: cert({ projectId, clientEmail, privateKey }),
      });
      initMode = 'credential';
    } catch (err) {
      // Don't crash `next build` page-data collection on a bad Vercel paste.
      certError = err?.message || String(err);
      console.error('[firebase-admin] Invalid FIREBASE_PRIVATE_KEY / credentials:', certError);
      app = initializeApp({ projectId });
      initMode = 'project-only';
    }
  } else {
    app = initializeApp({ projectId });
    initMode = 'project-only';
    if (!clientEmail || !privateKey) {
      certError = !clientEmail
        ? 'FIREBASE_CLIENT_EMAIL is missing'
        : 'FIREBASE_PRIVATE_KEY is missing';
    }
  }
} else {
  app = getApps()[0];
  initMode = clientEmail && privateKey && !certError ? 'credential' : 'project-only';
}

export const adminAuth = getAuth(app);
export const adminDb = getFirestore(app);

/** Safe diagnostics — never returns secret values. */
export function getFirebaseAdminStatus() {
  const raw = process.env.FIREBASE_PRIVATE_KEY || '';
  const normalized = privateKey || '';
  return {
    projectIdSet: Boolean(projectId),
    projectId: projectId || null,
    clientEmailSet: Boolean(clientEmail),
    clientEmailDomain: clientEmail?.includes('@')
      ? clientEmail.split('@')[1]
      : null,
    privateKeySet: Boolean(raw),
    privateKeyLength: raw.length,
    privateKeyHasBegin: normalized.includes('BEGIN PRIVATE KEY'),
    privateKeyHasEnd: normalized.includes('END PRIVATE KEY'),
    initMode,
    certError,
  };
}
