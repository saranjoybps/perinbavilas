const { v2: cloudinary } = require('cloudinary');
const fs = require('fs');
const path = require('path');

function loadEnv(filePath) {
  const env = {};
  const text = fs.readFileSync(filePath, 'utf8');
  for (const line of text.split(/\r?\n/)) {
    if (!line || line.trim().startsWith('#') || !line.includes('=')) continue;
    const i = line.indexOf('=');
    const key = line.slice(0, i).trim();
    let val = line.slice(i + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    env[key] = val;
  }
  return env;
}

const env = loadEnv(path.join(__dirname, '..', '.env.local'));

cloudinary.config({
  cloud_name: env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || env.ADMIN_CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY || env.ADMIN_CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET || env.ADMIN_CLOUDINARY_API_SECRET,
  secure: true,
});

async function main() {
  const expressions = [
    'resource_type:video',
    'asset_folder:hero',
    'folder:hero/*',
    'public_id:hero*',
    'public_id:*family*',
    'format:mp4',
  ];

  for (const expression of expressions) {
    try {
      const result = await cloudinary.search
        .expression(expression)
        .sort_by('created_at', 'desc')
        .max_results(20)
        .execute();
      console.log(`\n=== ${expression} total=${result.total_count} ===`);
      for (const r of result.resources || []) {
        console.log([
          r.created_at,
          r.asset_folder || r.folder || '',
          r.public_id,
          r.secure_url,
          r.bytes,
          r.width + 'x' + r.height,
          r.duration,
        ].join(' | '));
      }
    } catch (err) {
      console.log(`error [${expression}]:`, err.message || err.error?.message || err);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
