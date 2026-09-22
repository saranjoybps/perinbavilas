const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const DIR = path.join(__dirname, '..', 'public', 'family-tree');
const FILES = [
  'family-tree-laptop.png',
  'family-tree-tablet.png',
  'family-tree-mobile.png',
];

/** Cream photo fills, gold frames, leaves, and trunk must stay. */
function isProtected(r, g, b) {
  // Cream / off-white frame interiors
  if (r > 215 && g > 195 && b > 155 && Math.min(r, g, b) > 150) return true;

  // Ornate gold (frames, flourishes)
  if (r > 140 && g > 85 && b < 130 && r > g + 15 && g > b && r - b > 50) return true;
  if (r > 180 && g > 140 && b < 100 && r > g) return true;

  // Saturated leaf / vine green
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const sat = max - min;
  if (g > 55 && g >= r && g > b + 8 && sat > 35) return true;
  if (g > 90 && g > r + 20 && g > b + 25) return true;

  // Dark / near-black trunk and branches
  if (max < 55 && sat < 25) return true;
  if (r < 70 && g < 80 && b < 55 && g >= r - 5) return true;

  return false;
}

/** Sage washes, damask blacks, muted olive fields. */
function isBackgroundColor(r, g, b) {
  if (isProtected(r, g, b)) return false;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const sat = max - min;
  const lum = (r + g + b) / 3;

  // Near-black / charcoal patterned backdrop
  if (max < 55) return true;
  if (lum < 70 && sat < 45) return true;

  // Muted olive / sage wash (low–mid saturation greens)
  if (lum > 55 && lum < 210 && sat < 85 && g >= r - 8 && g >= b - 5 && b < 160) {
    // Exclude brighter leaf-like greens already caught by isProtected
    if (sat < 70 || (g - Math.min(r, b) < 45 && Math.abs(r - g) < 35)) return true;
  }

  // Soft parchment / beige backdrop (not cream fill)
  if (lum > 140 && lum < 230 && sat < 55 && r > g && g >= b && b > 100 && r < 240) {
    return true;
  }

  // Dusty gold damask accents on dark bg (desaturated yellow-beige)
  if (lum > 90 && lum < 200 && sat < 90 && r > 160 && g > 140 && b > 80 && b < 170 && r - b < 100) {
    if (!isProtected(r, g, b)) return true;
  }

  return false;
}

function removeBackground(data, width, height) {
  const out = Buffer.from(data);
  const visited = new Uint8Array(width * height);
  const queue = [];

  const trySeed = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const idx = y * width + x;
    if (visited[idx]) return;
    const i = idx * 4;
    const r = out[i];
    const g = out[i + 1];
    const b = out[i + 2];
    if (isProtected(r, g, b)) return;
    if (!isBackgroundColor(r, g, b)) return;
    visited[idx] = 1;
    queue.push(idx);
  };

  // Seed from full border (removes outer fields + damask)
  for (let x = 0; x < width; x++) {
    trySeed(x, 0);
    trySeed(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    trySeed(0, y);
    trySeed(width - 1, y);
  }

  // Also seed a thin outer band (catches gold frame borders on tablet)
  const band = Math.max(6, Math.round(Math.min(width, height) * 0.012));
  for (let y = 0; y < band; y++) {
    for (let x = 0; x < width; x++) trySeed(x, y);
  }
  for (let y = height - band; y < height; y++) {
    for (let x = 0; x < width; x++) trySeed(x, y);
  }
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < band; x++) trySeed(x, y);
    for (let x = width - band; x < width; x++) trySeed(x, y);
  }

  let head = 0;
  while (head < queue.length) {
    const idx = queue[head++];
    const x = idx % width;
    const y = (idx / width) | 0;
    const i = idx * 4;
    out[i + 3] = 0;

    const neighbors = [
      [x + 1, y],
      [x - 1, y],
      [x, y + 1],
      [x, y - 1],
      [x + 1, y + 1],
      [x - 1, y - 1],
      [x + 1, y - 1],
      [x - 1, y + 1],
    ];
    for (const [nx, ny] of neighbors) {
      trySeed(nx, ny);
    }
  }

  // Second pass: clear any remaining bg-colored blobs connected to transparent
  // (helps sage wash islands that were ring-fenced by leaves)
  visited.fill(0);
  head = 0;
  queue.length = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const i = idx * 4;
      if (out[i + 3] !== 0) continue;
      // transparent pixel — expand into adjacent bg colors
      const nbs = [
        [x + 1, y],
        [x - 1, y],
        [x, y + 1],
        [x, y - 1],
      ];
      for (const [nx, ny] of nbs) {
        if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
        const nidx = ny * width + nx;
        if (visited[nidx] || out[nidx * 4 + 3] === 0) continue;
        const ni = nidx * 4;
        if (isProtected(out[ni], out[ni + 1], out[ni + 2])) continue;
        if (isBackgroundColor(out[ni], out[ni + 1], out[ni + 2])) {
          visited[nidx] = 1;
          queue.push(nidx);
        }
      }
    }
  }
  while (head < queue.length) {
    const idx = queue[head++];
    const x = idx % width;
    const y = (idx / width) | 0;
    out[idx * 4 + 3] = 0;
    for (const [nx, ny] of [
      [x + 1, y],
      [x - 1, y],
      [x, y + 1],
      [x, y - 1],
    ]) {
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      const nidx = ny * width + nx;
      if (visited[nidx] || out[nidx * 4 + 3] === 0) continue;
      const ni = nidx * 4;
      if (isProtected(out[ni], out[ni + 1], out[ni + 2])) continue;
      if (isBackgroundColor(out[ni], out[ni + 1], out[ni + 2])) {
        visited[nidx] = 1;
        queue.push(nidx);
      }
    }
  }

  // Fringe cleanup: near-transparent neighbors with muted colors
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      const i = idx * 4;
      if (out[i + 3] === 0) continue;
      if (isProtected(out[i], out[i + 1], out[i + 2])) continue;
      const neighbors = [
        out[(y * width + (x + 1)) * 4 + 3],
        out[(y * width + (x - 1)) * 4 + 3],
        out[((y + 1) * width + x) * 4 + 3],
        out[((y - 1) * width + x) * 4 + 3],
      ];
      const clearCount = neighbors.filter((a) => a === 0).length;
      if (clearCount >= 2 && isBackgroundColor(out[i], out[i + 1], out[i + 2])) {
        out[i + 3] = 0;
      } else if (clearCount >= 3) {
        // Aggressive fringe for speckled wash edges
        const max = Math.max(out[i], out[i + 1], out[i + 2]);
        const min = Math.min(out[i], out[i + 1], out[i + 2]);
        if (max - min < 90) out[i + 3] = 0;
      }
    }
  }

  return out;
}

async function processFile(filename) {
  const inputPath = path.join(DIR, filename);
  const image = sharp(inputPath).ensureAlpha();
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
  const cleaned = removeBackground(data, info.width, info.height);

  const pngBuffer = await sharp(cleaned, {
    raw: {
      width: info.width,
      height: info.height,
      channels: 4,
    },
  })
    .png()
    .toBuffer();

  const tmpPath = path.join(DIR, `.tmp-${filename}`);
  fs.writeFileSync(tmpPath, pngBuffer);
  try {
    fs.writeFileSync(inputPath, pngBuffer);
    fs.unlinkSync(tmpPath);
  } catch {
    console.warn('Could not overwrite', filename, '— left as', path.basename(tmpPath));
    return;
  }
  console.log('OK', filename, `${info.width}x${info.height}`);
}

(async () => {
  for (const file of FILES) {
    await processFile(file);
  }
  console.log('Done.');
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
