// Map the result images (public/images/gallery/results) to treatment pages, using the treatment
// printed on each image's strip (read by eye into data/results-read.txt).
// Only clear, single-treatment names are mapped; combinations and vague names ("Laser treatment",
// "Medications") go nowhere. Usage: node results-map.js [--write]   -> data/results-map.json
const fs = require('fs');
const WRITE = process.argv.includes('--write');
const IMG_DIR = 'D:/DMC website rework/dr-nivedita/local/website/public/images/gallery/results';
const files = fs.readdirSync(IMG_DIR).filter(f => f.endsWith('.webp')).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
const rows = fs.readFileSync(__dirname + '/data/results-read.txt', 'utf8').split('\n').filter(l => /^\d+ \|/.test(l))
  .map(l => { const [i, t, c] = l.split(' | ').map(s => s.trim()); return { i: +i, file: files[+i], treatment: t, caseText: c }; });
if (rows.length !== files.length) throw new Error(`read ${rows.length} rows for ${files.length} images`);

// treatment as printed (lower-case, ® and "DMC-" dropped) -> page(s)
const RULES = [
  [/^acne check peel$|^acne check$|^acne check treatment( (1 session))?$|^dmc acne check treatment$|^acne check peel treatment/, ['acne-treatment/acne-check-peel-treatment', 'bridal-dermatology/acne-check-peel'], 'Acne Check Peel'],
  [/^acne zap laser$/, ['acne-treatment/acne-zap-laser'], 'Acne Zap Laser'],
  [/^lip fillers?$/, ['non-surgical-facial-enhancements/lip-enhancement'], 'Lip Fillers'],
  [/^fillers$|^dermal fillers$/, ['anti-ageing-therapies/filler', 'bridal-dermatology/dermal-fillers'], 'Fillers'],
  [/^threadlift$|^threads$/, ['anti-ageing-therapies/thread-lift'], 'Thread Lift'],
  [/^magic blend( treatment)?$/, ['pigmentation/magic-blend'], 'Magic Blend'],
  [/^magic blend 2\.0$/, ['pigmentation/magic-blend-2.0'], 'Magic Blend 2.0'],
  [/^fraxogenus$/, [], 'DMC-Fraxogenus'],               // no Fraxogenus page on this site
  [/^pixigenus$/, ['stretch-marks/pixigenus-stretch-marks'], 'DMC-Pixigenus', c => /stretch/i.test(c)],
  [/^microneedling radiofrequency$|^micro needling radio frequency$|^mnrf$/, ['acne-scars/micro-needling-radiofrequency', 'bridal-dermatology/mnrf-microneedling-radiofrequency'], 'Micro Needling Radiofrequency', c => /acne scar/i.test(c)],
  [/^microneedling radiofrequency$|^micro needling radio frequency with prp$/, ['stretch-marks/mnrf', 'bridal-dermatology/mnrf-for-stretch-marks'], 'MNRF', c => /stretch/i.test(c)],
  [/^erbium fiber laser$/, ['acne-scars/erbium-fibre-laser-acne-scars'], 'Erbium Fibre Laser', c => /acne scar/i.test(c)],
  [/^erbium fiber laser \(stretch marks\)$/, ['stretch-marks/erbium-fibre-laser-stretch-marks'], 'Erbium Fibre Laser'],
  [/^tixel$/, ['acne-scars/tixel-acne-scars'], 'Tixel', c => /acne scar/i.test(c)],
  [/^derma roller$/, ['acne-scars/dermaroller', 'bridal-dermatology/dermaroller-for-acne-scars'], 'Dermaroller', c => /acne scar/i.test(c)],
  [/^microneedling$/, [], 'Microneedling', c => /acne scar/i.test(c)],
  [/^laser hair reduction$|^eyebrow laser hair reduction$|^upper lip laser hair reduction$/, ['laser-hair-removal/soprano-ice-laser-hair-reduction', 'bridal-dermatology/soprano-ice-laser-hair-reduction', 'bridal-dermatology/laser-hair-removal'], 'Laser Hair Reduction'],
  // only the image printed "Laser Hair Removal" goes on the Bridal Laser Hair Removal page (user, 26 Oct 2026)
  [/^laser hair removal$/, ['laser-hair-removal/soprano-ice-laser-hair-reduction', 'bridal-dermatology/soprano-ice-laser-hair-reduction', 'bridal-dermatology/laser-hair-removal'], 'Laser Hair Removal'],
  [/^laser hair reduction \(alexandrite\)$/, ['laser-hair-removal/alexandrite-laser', 'bridal-dermatology/alexandrite-laser-hair-removal'], 'Alexandrite Laser'],
  [/^laser hair reduction \(diode\)$/, ['laser-hair-removal/diode-laser', 'bridal-dermatology/diode-laser-hair-removal'], 'Diode Laser'],
  [/^laser beard shaping$/, ['laser-hair-removal/beard-shaping', 'bridal-dermatology/beard-shaping'], 'Laser Beard Shaping'],
  [/^root restore therapy$/, ['hair-fall/root-restore-therapy'], 'DMC-Root Restore Therapy'],
  [/^advanced hgp$/, ['hair-fall/advanced-hgp'], 'Advanced HGP'],
  [/^hgp$|^hair growth promoters$/, ['hair-fall/hair-growth-promoters-therapy', 'bridal-dermatology/dmc-hgp-hair-growth-promoters'], 'HGP (Hair Growth Promoters)'],
  [/^365 oxyboost$/, ['premium-services/365-oxyboost'], '365 Oxyboost'],
  [/^collagen induction therapy$/, ['anti-ageing-therapies/collagen-induction-therapy'], 'Collagen Induction Therapy'],
  [/^berry blast facial$/, [], 'DMC-Berry Blast Facial'],   // no page
  [/^hydrafacial$/, ['premium-services/hydrafacial'], 'Hydrafacial'],
  [/^hydra revive$/, ['premium-services/hydra-revive'], 'Hydra Revive'],
  [/^insta regen$/, ['anti-ageing-therapies/insta-regen'], 'DMC-Insta Regen'],
  [/^instaglam$/, ['premium-services/Instaglam-treatment'], 'DMC-Instaglam'],
  [/^non-surgical nose enhancement$/, ['non-surgical-facial-enhancements/nose-enhancement'], 'Non-Surgical Nose Enhancement'],
  [/^anti-wrinkle injection$/, ['anti-ageing-therapies/anti-wrinkle-injections'], 'Anti-Wrinkle Injection'],
  [/^photofacial$/, ['premium-services/photofacials', 'bridal-dermatology/photofacial'], 'Photofacial'],
  [/^laser toning$/, ['pigmentation/laser-toning', 'bridal-dermatology/laser-toning'], 'Laser Toning'],
  [/^chemical peels$/, ['pigmentation/chemical-peels'], 'Chemical Peels'],
  [/^powerexfo peel$/, [], 'PowerExfo Peel'],                 // no page
  [/^microblading$/, ['non-surgical-facial-enhancements/microblading-eyebrows-treatment'], 'Microblading'],
  [/^meso glow$/, ['pigmentation/mesotherapy'], 'Meso Glow'],
];
const norm = t => t.toLowerCase().replace(/®/g, '').replace(/^dmc\s*-?\s*/, '').replace(/\s+/g, ' ').trim();
// the category label under each card, from the page's category
const CAT_LABEL = {
  'acne-treatment': 'Acne/Pimple', 'acne-scars': 'Acne Scars', 'anti-ageing-therapies': 'Anti-Aging', 'hair-fall': 'Hairfall/Hair Loss',
  'laser-hair-removal': 'Unwanted Hair', 'non-surgical-facial-enhancements': 'Non-Surgical Facial Enhancement', 'pigmentation': 'Pigmentation',
  'premium-services': 'Skin Glow', 'stretch-marks': 'Stretch Marks', 'bridal-dermatology': 'Bridal Dermatology', 'plastic-surgery': 'Plastic Surgery',
};
// On the Bridal Dermatology pages a card carries the page's own name instead of the rule title
// (e.g. "Dermal Fillers", not "Fillers"; user, 26 Oct 2026). Names from data/bridal-pages.json (bridal-build.js).
const TITLE_ON_PAGE = Object.fromEntries(JSON.parse(fs.readFileSync(__dirname + '/data/bridal-pages.json', 'utf8'))
  .map(p => ['bridal-dermatology/' + p.slug, p.name]));
const map = {}; const skipped = {};
for (const r of rows) {
  const t = norm(r.treatment);
  if (t === '-') { (skipped['(no treatment printed)'] = skipped['(no treatment printed)'] || []).push(r.i); continue; }
  const rule = RULES.find(([re, , , cond]) => re.test(t) && (!cond || cond(r.caseText)));
  if (!rule || !rule[1].length) { (skipped[r.treatment] = skipped[r.treatment] || []).push(r.i); continue; }
  for (const page of rule[1]) {
    (map[page] = map[page] || []).push({ file: r.file, title: TITLE_ON_PAGE[page] || rule[2], label: CAT_LABEL[page.split('/')[0]] || '', caseText: r.caseText });
  }
}
const pages = Object.keys(map).sort();
console.log(`${pages.length} pages get results (${pages.reduce((n, p) => n + map[p].length, 0)} cards):`);
for (const p of pages) console.log(`  ${p.padEnd(58)} ${String(map[p].length).padStart(3)}  (${map[p][0].title})`);
const sk = Object.entries(skipped).sort((a, b) => b[1].length - a[1].length);
console.log(`\nnot placed on any page: ${sk.reduce((n, [, v]) => n + v.length, 0)} images`);
for (const [t, v] of sk) console.log(`  ${String(v.length).padStart(3)}  ${t}`);
if (WRITE) { fs.writeFileSync(__dirname + '/data/results-map.json', JSON.stringify(map, null, 1)); console.log('\nWROTE data/results-map.json'); }
