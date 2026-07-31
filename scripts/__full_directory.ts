import { readFileSync, writeFileSync } from 'fs';
import path from 'path';

const envPath = path.join(process.cwd(), '.env.local');
for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
  if (m) {
    let v = m[2].trim();
    if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
    process.env[m[1]] = v;
  }
}

(async () => {
  const { adminDb } = await import('@/lib/firebase/admin');
  const { generateFamilyDirectoryPDF } = await import('@/services/family/pdf-service');

  const snap = await adminDb.collection('families').get();
  const docs = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
  docs.sort((a, b) => String(a.code ?? a.id).localeCompare(String(b.code ?? b.id), undefined, { numeric: true }));

  const records = docs.map((data) => ({
    code: data.code || data.id,
    name: data.name || '',
    dob: data.dob || null,
    dod: data.dod || null,
    spouse: data.spouse || { name: '', dob: null, dod: null },
    spouses: data.spouses || [],
    family_name: data.family_name || null,
    address: data.address || null,
    cell_numbers: data.cell_numbers || [],
    landline: data.landline || null,
    email: data.email || null,
    occupation: data.occupation || null,
    photos: data.photos || [],
    children: data.children || [],
    _sourceFile: 'firestore',
    _fileOrder: data._fileOrder || 0,
  }));

  const t0 = Date.now();
  const bytes = await generateFamilyDirectoryPDF(records, 'Full Directory');
  writeFileSync('C:/Users/saran/AppData/Local/Temp/opencode/full-directory.pdf', Buffer.from(bytes));
  console.log('families:', records.length, 'bytes:', bytes.length, 'elapsed:', Date.now() - t0, 'ms');
})().catch((e) => { console.error(e); process.exit(1); });
