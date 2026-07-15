import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const FIREBASE_ADMIN_CONFIG = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    : undefined,
};

let app;
if (!getApps().length) {
  if (FIREBASE_ADMIN_CONFIG.clientEmail && FIREBASE_ADMIN_CONFIG.privateKey) {
    app = initializeApp({ credential: cert(FIREBASE_ADMIN_CONFIG) });
  } else {
    app = initializeApp({ projectId: FIREBASE_ADMIN_CONFIG.projectId });
  }
} else {
  app = getApps()[0];
}

export const adminAuth = getAuth(app);
export const adminDb = getFirestore(app);
