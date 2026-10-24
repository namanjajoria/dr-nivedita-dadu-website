// Copy the Bridal Dermatology images into the site and write a manifest the page builder uses.
// Usage: node bridal-images.js <scratch> [--write]
const fs = require('fs');
const S = process.argv[2], WRITE = process.argv.includes('--write');
const SRC = 'D:/Nivedita Dadu Website Images/Bridal Dermatology';
const SITE = 'D:/DMC website rework/dr-nivedita/local/website';
const OUT = SITE + '/public/images/treatments/bridal';
const PAGES = [
  { slug: 'beard-shaping', dir: 'Beard Shaping', topic: 'How Laser Beard Shaping Works', split: 'Areas We Treat' },
  { slug: 'divagenesis', dir: 'DivaGenesis', topic: 'What Makes DivaGenesis Different', split: 'Concerns DivaGenesis Can Help With' },
  { slug: 'laser-facials', dir: 'Laser Facials', topic: 'How a Laser Facial Works', split: 'Concerns a Laser Facial Can Help With' },
  { slug: 'lip-pigmentation', dir: 'Lip Pigmentation', topic: 'Why Lips Turn Dark', split: 'How the Laser Works' },
  { slug: 'power-glow', dir: 'Power Glow', topic: 'Why We Pair Microdermabrasion With the Peel', split: 'Concerns Power Glow Can Help With' },
  // added 24 Oct 2026 (tech = image for the Process section, default "Process & Techniques")
  { slug: 'acne-check-peel', dir: 'Acne Check Peel', topic: 'How the Acne Check Peel Works', split: 'Benefits' },
  { slug: 'alexandrite-laser-hair-removal', dir: 'Alexandrite Laser Hair Removal', topic: 'How the Alexandrite Laser Works', split: 'Areas That Can Be Treated' },
  { slug: 'carbon-laser-peel', dir: 'Carbon Laser Peel Treatment', topic: 'How a Carbon Laser Peel Works', split: 'What It Helps With' },
  { slug: 'dark-circles', dir: 'Dark Circles', topic: 'What Are Dark Circles', split: 'Causes of Dark Circles', tech: 'Why Choose Dr. Nivedita Dadu' },
];
function size(file) {                       // WebP header -> width/height
  const b = fs.readFileSync(file);
  if (b.toString('ascii', 0, 4) !== 'RIFF' || b.toString('ascii', 8, 12) !== 'WEBP') throw new Error('not webp: ' + file);
  const t = b.toString('ascii', 12, 16);
  if (t === 'VP8 ') return { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff };
  if (t === 'VP8L') { const v = b.readUInt32LE(21); return { w: (v & 0x3fff) + 1, h: ((v >> 14) & 0x3fff) + 1 }; }
  if (t === 'VP8X') return { w: 1 + b.readUIntLE(24, 3), h: 1 + b.readUIntLE(27, 3) };
  throw new Error('unknown webp: ' + file);
}
const kebab = s => s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const manifest = {};
for (const p of PAGES) {
  const dir = `${SRC}/${p.dir}`;
  const files = fs.readdirSync(dir);
  const want = [1, 2, 3, 4, 5].map(i => `slider-image-${i}.webp`).concat([`${p.topic}.webp`, `${p.split}.webp`, `${p.tech || 'Process & Techniques'}.webp`]);
  for (const w of want) if (!files.includes(w)) throw new Error(`${p.dir}: missing ${w}`);
  const extra = files.filter(f => !want.includes(f));
  const put = name => {
    const from = `${dir}/${name}`, to = `${p.slug}-${kebab(name.replace(/\.webp$/, ''))}.webp`;
    const d = size(from);
    if (WRITE) { fs.mkdirSync(OUT, { recursive: true }); fs.copyFileSync(from, `${OUT}/${to}`); }
    return { src: `/images/treatments/bridal/${to}`, w: String(d.w), h: String(d.h), kb: Math.round(fs.statSync(from).size / 1024) };
  };
  const gallery = [1, 2, 3, 4, 5].map(i => put(`slider-image-${i}.webp`));
  manifest[p.slug] = { gallery, band: put(`${p.topic}.webp`), split: put(`${p.split}.webp`), tech: put(`${p.tech || 'Process & Techniques'}.webp`) };
  const m = manifest[p.slug];
  console.log(`${p.slug.padEnd(17)} slider: ${m.gallery.map(g => `${g.w}x${g.h}/${g.kb}KB`).join(' ')} | band: ${m.band.w}x${m.band.h}/${m.band.kb}KB | split: ${m.split.w}x${m.split.h}/${m.split.kb}KB | process: ${m.tech.w}x${m.tech.h}/${m.tech.kb}KB${extra.length ? ' | EXTRA: ' + extra.join(', ') : ''}`);
}
if (WRITE) fs.writeFileSync(`${S}/bridal-images.json`, JSON.stringify(manifest, null, 1));
console.log(WRITE ? 'copied + manifest written' : 'dry run');
