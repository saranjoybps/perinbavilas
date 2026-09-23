import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

/**
 * Vercel / .env pastes often wrap the key in quotes or use escaped newlines.
 * Normalize so firebase-admin can parse the PEM.
 */
function normalizePrivateKey(raw) {
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

const FIREBASE_ADMIN_CONFIG = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim(),
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL?.trim(),
  privateKey: normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY),
};

let app;
if (!getApps().length) {
  const { clientEmail, privateKey, projectId } = FIREBASE_ADMIN_CONFIG;

  if (clientEmail && privateKey) {
    try {
      app = initializeApp({
        credential: cert({ projectId, clientEmail, privateKey }),
      });
    } catch (err) {
      // Don't crash `next build` page-data collection on a bad Vercel paste.
      // APIs will still fail clearly at runtime until the key is fixed.
      console.error(
        '[firebase-admin] Invalid FIREBASE_PRIVATE_KEY / credentials:',
        err?.message || err,
      );
      app = initializeApp({ projectId });
    }
  } else {
    app = initializeApp({ projectId });
  }
} else {
  app = getApps()[0];
}

export const adminAuth = getAuth(app);
export const adminDb = getFirestore(app);
