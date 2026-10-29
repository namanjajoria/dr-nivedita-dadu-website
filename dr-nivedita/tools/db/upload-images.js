// Uploads every file in local/website/public/images/ to the Supabase Storage bucket "images"
// under site/<same relative path>, so /images/a/b.webp becomes
// <SUPABASE_URL>/storage/v1/object/public/images/site/a/b.webp. Also writes
// local/website/config/media-sizes.json (path -> [width, height]) so <img> tags keep their
// width/height once the files are no longer on the web server.
// Credentials come from local/api/.env. Usage: node tools/db/upload-images.js [--dry]
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '../..');
const API = path.join(ROOT, 'local/api');
require(path.join(API, 'node_modules/dotenv')).config({ path: path.join(API, '.env') });
const { createClient } = require(path.join(API, 'node_modules/@supabase/supabase-js'));
const { imageSize } = require(path.join(ROOT, 'local/website/utils/imageSize'));

const DRY = process.argv.includes('--dry');
const PUBLIC = path.join(ROOT, 'local/website/public');
const IMAGES = path.join(PUBLIC, 'images');
const BUCKET = 'images';
const PREFIX = 'site';
const TYPES = { '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.gif': 'image/gif', '.svg': 'image/svg+xml', '.avif': 'image/avif' };

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : [p];
  });
}

(async () => {
  const files = walk(IMAGES);
  const sizes = {};
  for (const f of files) {
    const rel = '/' + path.relative(PUBLIC, f).split(path.sep).join('/');
    const s = imageSize(rel);
    if (s) sizes[rel] = [s.width, s.height];
  }
  fs.writeFileSync(path.join(ROOT, 'local/website/config/media-sizes.json'), JSON.stringify(sizes) + '\n');
  console.log(`${files.length} files, sizes known for ${Object.keys(sizes).length}`);
  if (DRY) return;

  let done = 0;
  const failed = [];
  let next = 0;
  await Promise.all(Array.from({ length: 8 }, async () => {
    while (next < files.length) {
      const f = files[next++];
      const key = `${PREFIX}/${path.relative(IMAGES, f).split(path.sep).join('/')}`;
      const type = TYPES[path.extname(f).toLowerCase()];
      if (!type) { failed.push(`${key}: unknown type`); continue; }
      const { error } = await sb.storage.from(BUCKET).upload(key, fs.readFileSync(f), { contentType: type, upsert: true, cacheControl: '31536000' });
      if (error) failed.push(`${key}: ${error.message}`);
      if (++done % 200 === 0) console.log(`  ${done}/${files.length}`);
    }
  }));
  console.log(`uploaded ${done - failed.length}/${files.length}`);
  failed.slice(0, 20).forEach((f) => console.log('  FAILED', f));
  if (failed.length) process.exit(1);
})();
