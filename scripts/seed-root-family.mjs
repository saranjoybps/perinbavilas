import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;

  const content = fs.readFileSync(filePath, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const separator = trimmed.indexOf('=');
    if (separator === -1) continue;

    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(path.join(projectRoot, '.env.local'));

const firebaseConfig = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    : undefined,
};

if (!firebaseConfig.projectId) {
  throw new Error('Missing NEXT_PUBLIC_FIREBASE_PROJECT_ID in environment.');
}

if (!getApps().length) {
  if (firebaseConfig.clientEmail && firebaseConfig.privateKey) {
    initializeApp({ credential: cert(firebaseConfig) });
  } else {
    initializeApp({ projectId: firebaseConfig.projectId });
  }
}

const db = getFirestore();
const shouldUpdate = process.argv.includes('--update');
const now = new Date();

const rootFamily = {
  code: '0',
  name: 'Y. PERINBAM NADAR',
  alias: 'PERUMAL NADAR',
  dob: '1872',
  dod: '16-05-1956',
  spouse: {
    name: 'ANNAMMAL PERINBAM',
    dob: '1886',
    dod: '02-01-1949',
  },
  family_name: 'ABRAHAM VADHYAR FLY',
  address: 'PANNAI VEEDU, ADAYAL, MUDALUR (PO), VOC DT-628702',
  cell_numbers: [],
  landline: null,
  email: null,
  occupation: null,
  photos: [],
  children: [
    { code: '1', name: 'ANNAMANI AMMAL', dob: '1908', dod: '1987' },
    { code: '2', name: 'ANNAPOOMANI AMMAL', dob: '06-01-1910', dod: '04-01-1993' },
    { code: '3', name: 'RAJAMANI NADAR', dob: '14-03-1913', dod: '25-03-1972' },
    { code: '4', name: 'JOTHIRARATHINAMANI AMMAL', dob: '27-07-1916', dod: '05-05-1982' },
    { code: '5', name: 'RAJASIGAMANI NADAR', dob: '15-10-1917', dod: '20-08-1981' },
    { code: '6', name: 'PALPANDIAN NADAR', dob: '22-11-1920', dod: '10-08-1984' },
    { code: '7', name: 'DURAIPANDIAN NADAR', dob: '22-10-1922', dod: '09-09-1997' },
  ],
  _fileOrder: 0,
  _editedAt: now.toISOString(),
};

const docRef = db.collection('families').doc(rootFamily.code);
const existing = await docRef.get();

if (existing.exists && !shouldUpdate) {
  console.log('Root family code 0 already exists. Re-run with --update to overwrite it.');
  process.exit(0);
}

await docRef.set({
  ...rootFamily,
  [existing.exists ? 'updatedAt' : 'createdAt']: now,
}, { merge: shouldUpdate });

console.log(`${existing.exists ? 'Updated' : 'Inserted'} root family ${rootFamily.code}: ${rootFamily.name}`);
