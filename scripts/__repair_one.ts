import { readFileSync } from 'fs';
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

  const ref = adminDb.collection('families').doc('422-712');
  const doc = await ref.get();
  const photos: string[] = (doc.data() as any).photos || [];

  const kept = photos.filter((url) => /-[\w]{12}\.[a-z0-9]+$/i.test(url.split('/').pop() || ''));
  const result = kept.length ? kept : photos.slice(0, 1);

  console.log(`${'422/712'}: photos ${photos.length} -> ${result.length}`);
  for (const u of result) console.log('  keep', u);
  for (const u of photos) if (!result.includes(u)) console.log('  drop', u);

  if (result.length !== photos.length) {
    await ref.update({ photos: result });
    console.log('UPDATED');
  } else {
    console.log('no change');
  }
})().catch((e) => { console.error(e); process.exit(1); });
