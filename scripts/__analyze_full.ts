import { readFileSync } from 'fs';
import { PDFDocument, PDFName, PDFArray, PDFRef, PDFDict, PDFStream } from 'pdf-lib';
import { createHash } from 'crypto';
import { inflateSync } from 'zlib';

function hashBytes(buf: Buffer | Uint8Array): string {
  return createHash('md5').update(Buffer.from(buf as any)).digest('hex');
}

function tokenize(stream: string): string[] {
  const tokens: string[] = [];
  let i = 0;
  while (i < stream.length) {
    const c = stream[i];
    if (/\s/.test(c)) { i += 1; continue; }
    if (c === '(') {
      let depth = 1;
      let j = i + 1;
      let out = '';
      while (j < stream.length && depth > 0) {
        const ch = stream[j];
        if (ch === '\\') { out += stream[j + 1] ?? ''; j += 2; continue; }
        if (ch === '(') depth += 1;
        if (ch === ')') { depth -= 1; if (depth === 0) { j += 1; break; } }
        out += ch;
        j += 1;
      }
      tokens.push('(' + out + ')');
      i = j;
      continue;
    }
    if (c === '<') {
      const j = stream.indexOf('>', i);
      tokens.push(stream.slice(i, j + 1));
      i = j + 1;
      continue;
    }
    if (c === '[' || c === ']' || c === '{' || c === '}') {
      tokens.push(c);
      i += 1;
      continue;
    }
    if (c === '/') {
      let j = i + 1;
      while (j < stream.length && !/\s/.test(stream[j]) && '()<>[]{}'.indexOf(stream[j]) === -1) j += 1;
      tokens.push(stream.slice(i, j));
      i = j;
      continue;
    }
    let j = i;
    while (j < stream.length && !/\s/.test(stream[j]) && '()<>[]{}'.indexOf(stream[j]) === -1) j += 1;
    if (j === i) { i += 1; continue; }
    tokens.push(stream.slice(i, j));
    i = j;
  }
  return tokens;
}

function strOf(t: string): string {
  if (t.startsWith('(') && t.endsWith(')')) return t.slice(1, -1);
  return '';
}

(async () => {
  const pdf = await PDFDocument.load(readFileSync('C:/Users/saran/AppData/Local/Temp/opencode/full-directory.pdf'), { ignoreEncryption: true });

  const imageHashes: Map<string, string> = new Map();

  const pageResults: { page: number; items: { kind: 'img' | 'txt'; name?: string; text?: string; hash?: string }[] }[] = [];

  for (let p = 0; p < pdf.getPageCount(); p += 1) {
    const page = pdf.getPage(p);
    const contents = page.node.Contents();
    let stream = '';
    const refs: any[] = [];
    if (contents instanceof PDFArray) {
      refs.push(...(contents.asArray() as PDFRef[]));
    } else if (contents) {
      refs.push(contents as any);
    }
    for (const ref of refs) {
      const obj = ref instanceof PDFRef ? (page as any).doc.context.lookup(ref) : ref;
      if (obj instanceof PDFStream) {
        const buf = Buffer.from(obj.getContents() as any);
        stream += buf.toString('latin1');
      }
    }

    const tokens = tokenize(stream);
    const items: { kind: 'img' | 'txt'; name?: string; text?: string; hash?: string }[] = [];

    for (let i = 0; i < tokens.length; i += 1) {
      const t = tokens[i];
      if (t === 'Do' && i >= 1) {
        const name = tokens[i - 1];
        if (name.startsWith('/')) {
          let xo: any = null;
          const resources = page.node.Resources();
          if (resources instanceof PDFDict) {
            const xobj = resources.lookup(PDFName.of('XObject'));
            if (xobj instanceof PDFDict) {
              const entry = xobj.lookup(PDFName.of(name.slice(1)));
              if (entry instanceof PDFRef) xo = (page as any).doc.context.lookup(entry);
              else xo = entry;
            }
          }
          if (xo) {
            let data: Uint8Array | null = null;
            try {
              const strm: any = xo instanceof PDFStream ? xo : (xo as any)?.getContents ? xo : null;
              if (strm) {
                const raw = strm.getContents();
                if (raw) {
                  const bytes = Buffer.from(raw);
                  const filter = strm.dict?.lookup?.(PDFName.of('Filter'));
                  const filt = filter?.toString?.() ?? '';
                  if (filt.includes('Flate')) data = inflateSync(bytes);
                  else data = bytes;
                }
              }
            } catch { data = null; }
            const key = name;
            if (!imageHashes.has(key)) imageHashes.set(key, data ? hashBytes(data) : 'unreadable');
            items.push({ kind: 'img', name: key, hash: imageHashes.get(key) });
          }
        }
      } else if (t === 'Tj' && i >= 1) {
        const s = strOf(tokens[i - 1]);
        if (s) items.push({ kind: 'txt', text: s });
      } else if (t === 'TJ' && i >= 1) {
        const arr = tokens[i - 1];
        if (arr.startsWith('[')) {
          let txt = '';
          const re = /\(((?:[^()\\]|\\.)*)\)/g;
          let m: RegExpExecArray | null;
          while ((m = re.exec(arr)) !== null) txt += m[1];
          if (txt) items.push({ kind: 'txt', text: txt });
        }
      }
    }

    pageResults.push({ page: p + 1, items });
  }

  const problems: string[] = [];
  const allImagesOnPage = new Set<string>();

  let totalTxt = 0;
  let totalImg = 0;
  let totalBadges = 0;
  for (const { page, items } of pageResults) {
    totalTxt += items.filter((i) => i.kind === 'txt').length;
    totalImg += items.filter((i) => i.kind === 'img').length;
    if (page <= 2) console.log(`page ${page}: items=${items.length} sample=${JSON.stringify(items.slice(0, 12).map((i) => i.kind === 'txt' ? i.text : `img:${i.hash?.slice(0, 8)}`))}`);
  }
  console.log('pages:', pageResults.length, 'total txt:', totalTxt, 'total img:', totalImg);

  for (const { page, items } of pageResults) {
    const badges: number[] = [];
    for (let i = 0; i < items.length; i += 1) {
      const it = items[i];
      if (it.kind === 'txt' && it.text!.startsWith('CODE ')) { badges.push(i); totalBadges += 1; }
    }
    for (let b = 0; b < badges.length; b += 1) {
      const start = badges[b];
      const end = b + 1 < badges.length ? badges[b + 1] : items.length;
      const code = items[start].text!.slice(5).trim();
      const imgs = items.slice(start, end).filter((it) => it.kind === 'img');
      const hashes = imgs.map((it) => it.hash!);
      const dupHashes = hashes.filter((h, idx) => hashes.indexOf(h) !== idx);
      if (dupHashes.length) {
        problems.push(`page ${page} CODE ${code}: DUPLICATE content drawn: ${dupHashes.join(', ')}`);
      }
      if (['7', '731', '742', '744', '751', '422/712', '4212/7112', '342'].includes(code)) {
        console.log(`page ${page}: CODE ${code} -> images: ${JSON.stringify(hashes)}`);
      }
    }
    for (const it of items) if (it.kind === 'img') allImagesOnPage.add(it.hash!);
  }

  console.log('\nDuplicate-within-family findings:', problems.length ? problems.join('\n') : 'NONE');
  console.log('total badges found:', totalBadges);
  console.log('unreadable images:', [...imageHashes.entries()].filter(([, h]) => h === 'unreadable').map(([k]) => k).join(', ') || 'none');
})().catch((e) => { console.error(e); process.exit(1); });
