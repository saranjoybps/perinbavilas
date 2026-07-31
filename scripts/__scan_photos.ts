import { readFileSync } from 'fs';
import path from 'path';
import { createHash } from 'crypto';

const envPath = path.join(process.cwd(), '.env.local');
for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
  if (m) {
    let v = m[2].trim();
    if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
    process.env[m[1]] = v;
  }
}

const timeout = (ms: number) => new Promise((r) => setTimeout(r, ms));
const sha = (b: Buffer) => createHash('sha256').update(b).digest('hex').slice(0, 12);

async function fetchUrl(url: string, attempt = 1): Promise<{ status: number; hash: string; size: number }> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 20000);
    const res = await fetch(url, { signal: ctrl.signal, cache: 'no-store' });
    clearTimeout(t);
    if (!res.ok) return { status: res.status, hash: '', size: 0 };
    const buf = Buffer.from(await res.arrayBuffer());
    return { status: res.status, hash: sha(buf), size: buf.length };
  } catch (e: any) {
    if (attempt === 1) {
      await timeout(3000);
      return fetchUrl(url, 2);
    }
    return { status: -1, hash: `ERR ${e?.message ?? e}`, size: 0 };
  }
}

(async () => {
  const { adminDb } = await import('@/lib/firebase/admin');
  const snap = await adminDb.collection('families').get();
  const docs = snap.docs
    .map((d) => ({ id: d.id, photos: (d.data() as any).photos ?? [] }))
    .sort((a, b) => String(a.id).localeCompare(String(b.id), undefined, { numeric: true }));

  const problems: string[] = [];
  let checked = 0;

  for (const d of docs) {
    const photos: string[] = (d.photos || []).filter((p: any): p is string => typeof p === 'string' && p.length > 0);
    if (photos.length === 0) continue;
    checked += 1;

    const results: { url: string; status: number; hash: string; size: number }[] = [];
    for (const url of photos) results.push({ url, ...(await fetchUrl(url)) });

    const failed = results.filter((r) => r.status !== 200);
    const dups: string[] = [];
    const seen = new Map<string, number>();
    for (const r of results) if (r.status === 200) seen.set(r.hash, (seen.get(r.hash) ?? 0) + 1);
    for (const [h, c] of seen) if (c > 1) dups.push(h);

    if (failed.length || dups.length) {
      problems.push(`CODE ${d.id}: photos=${photos.length}`);
      for (const r of results) {
        problems.push(`   ${r.status === 200 ? 'OK ' : String(r.status).padEnd(3)} ${r.hash || '          '} ${r.size}B  ${r.url.slice(-90)}`);
      }
      if (dups.length) problems.push(`   -> DUPLICATE CONTENT (${dups.length} groups)`);
    }
  }

  console.log(`scanned ${checked} families with photos`);
  console.log(problems.length ? problems.join('\n') : 'NO PROBLEMS FOUND');
})().catch((e) => { console.error(e); process.exit(1); });
