const fs = require('fs'), path = require('path');
const S = process.argv[2];
const V = 'D:/DMC website rework/dr-nivedita/local/website/views';
const BK = S + '/backup-bridal-layout';
const intros = JSON.parse(fs.readFileSync(S + '/bridal-intros.json', 'utf8'));
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const cut = t => { if (t.length <= 155) return t; const c = t.slice(0, 155); return c.slice(0, c.lastIndexOf(' ')).replace(/[,;:.\s]+$/, '') + '…'; };
const CAT = '/treatments/bridal-dermatology/';
let n = 0;
for (const f of fs.readdirSync(V).filter(f => f.endsWith('.html'))) {
  const fp = V + '/' + f;
  let s = fs.readFileSync(fp, 'utf8'), changed = 0;
  for (const { slug, intro } of intros) {
    // a card = <p class="svc-item-text">…</p> followed by its "View Details" link to this page
    const re = new RegExp(`(<p class="svc-item-text">)[^<]*(</p>\\s*<a class="btn-view" href="${CAT}${slug}/">)`, 'g');
    s = s.replace(re, (m, a, b) => { changed++; return a + esc(cut(intro)) + b; });
  }
  if (changed) {
    if (!fs.existsSync(BK + '/' + f)) fs.copyFileSync(fp, BK + '/' + f);
    fs.writeFileSync(fp, s); n += changed;
    console.log(f.padEnd(50), changed, 'cards');
  }
}
console.log('TOTAL', n);
console.log(intros.map(i => `${i.slug}: ${cut(i.intro)}`).join('\n'));
