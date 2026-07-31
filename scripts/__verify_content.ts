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

  const ids = ['7', '422-712', '731', '742', '744', '751', '4212-7112'];
  const records = [];
  for (const id of ids) {
    const doc = await adminDb.collection('families').doc(id).get();
    const data = doc.data() as any;
    records.push({
      code: data.code || doc.id,
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
    });
    console.log(`loaded ${data.code || doc.id}: photos=${(data.photos || []).length}`);
  }

  const bytes = await generateFamilyDirectoryPDF(records, 'Content Dedupe Test');
  writeFileSync('C:/Users/saran/AppData/Local/Temp/opencode/content-dedupe.pdf', Buffer.from(bytes));
  console.log('WROTE', bytes.length, 'bytes');
})().catch((e) => { console.error(e); process.exit(1); });
