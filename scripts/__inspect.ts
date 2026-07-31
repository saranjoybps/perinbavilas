import { readFileSync } from 'fs';
import path from 'path';
import crypto from 'node:crypto';

const envPath = path.join(process.cwd(), '.env.local');
for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
  if (m) {
    let v = m[2].trim();
    if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
    process.env[m[1]] = v;
  }
}

function photoIdentity(url: string): string {
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[a-z0-9]+)?$/i);
  return match ? match[1] : url;
}

async function fetchHash(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { redirect: 'follow' });
    if (!res.ok) return `HTTP ${res.status}`;
    const buf = Buffer.from(await res.arrayBuffer());
    return crypto.createHash('md5').update(buf).digest('hex').slice(0, 12) + ` (${buf.length}b)`;
  } catch (e) {
    return `ERR ${e instanceof Error ? e.message : String(e)}`;
  }
}

(async () => {
  const { adminDb } = await import('@/lib/firebase/admin');

  const snap = await adminDb.collection('families').get();
  const records = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
  records.sort((a, b) => String(a.code ?? a.id).localeCompare(String(b.code ?? b.id), undefined, { numeric: true }));

  const multi = records.filter((r) => (r.photos ?? []).length > 1);
  console.log(`total=${records.length} with>=2photos=${multi.length}`);

  let problems = 0;
  for (const r of multi) {
    const code = r.code ?? r.id;
    const photos: string[] = r.photos ?? [];
    const ids = photos.map((p) => photoIdentity(p));
    const sameId = new Set(ids).size !== ids.length;
    const hashes = [];
    for (const p of photos) hashes.push(await fetchHash(p));
    const contentHash = hashes.map((h) => (typeof h === 'string' ? h.split(' ')[0] : h));
    const sameContent = new Set(contentHash).size !== contentHash.length;
    const broken = hashes.some((h) => typeof h === 'string' && (h.startsWith('HTTP') || h.startsWith('ERR')));

    if (sameId || sameContent || broken) {
      problems++;
      console.log(`\n--- code=${code} id=${r.id} samePublicId=${sameId} sameContent=${sameContent} broken=${broken}`);
      for (let i = 0; i < photos.length; i++) {
        console.log(`    [${i}] id=${ids[i]}`);
        console.log(`        ${photos[i]}`);
        console.log(`        -> ${hashes[i]}`);
      }
    }
  }
  console.log(`\nproblemFamilies=${problems}`);
})().catch((e) => { console.error(e); process.exit(1); });
