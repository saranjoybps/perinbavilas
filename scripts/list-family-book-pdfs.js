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
  console.log('cloud_name:', cloudinary.config().cloud_name);

  try {
    const root = await cloudinary.api.root_folders();
    console.log('\n=== ROOT FOLDERS ===');
    for (const f of root.folders || []) {
      console.log('-', f.path || f.name);
    }
  } catch (err) {
    console.log('root_folders error:', err.message || err.error?.message || err);
  }

  const expressions = [
    'format:pdf',
    'resource_type:raw AND format:pdf',
    'folder:"family book"/*',
    'folder:family-book/*',
    'folder:family_book/*',
    'asset_folder:"family book"',
    'asset_folder:family-book',
    'asset_folder:"Family Book"',
    'public_id:family*',
  ];

  for (const expression of expressions) {
    try {
      const result = await cloudinary.search.expression(expression).max_results(100).execute();
      console.log(`\n=== SEARCH: ${expression} === total=${result.total_count}`);
      for (const r of result.resources || []) {
        console.log(
          [
            r.asset_folder || r.folder || '',
            r.public_id,
            r.secure_url,
            r.format,
            r.resource_type,
          ].join(' | ')
        );
      }
    } catch (err) {
      console.log(`search error [${expression}]:`, err.message || err.error?.message || err);
    }
  }

  for (const prefix of ['family book', 'family-book', 'family_book', 'Family Book']) {
    for (const resourceType of ['image', 'raw']) {
      try {
        const result = await cloudinary.api.resources({
          resource_type: resourceType,
          type: 'upload',
          prefix,
          max_results: 100,
        });
        console.log(`\n=== RESOURCES type=${resourceType} prefix=${prefix} count=${result.resources.length} ===`);
        for (const r of result.resources) {
          console.log([r.public_id, r.secure_url, r.format].join(' | '));
        }
      } catch (err) {
        console.log(`resources error [${resourceType}/${prefix}]:`, err.message || err.error?.message || err);
      }
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
