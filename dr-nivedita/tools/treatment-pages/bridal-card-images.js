// Bridal service cards (category page + /treatments/) -> slider-image-1 of each page.
const fs = require('fs');
const S = process.argv[2];
const m = JSON.parse(fs.readFileSync(S + '/bridal-images.json', 'utf8'));
const V = 'D:/DMC website rework/dr-nivedita/local/website/views';
let total = 0;
for (const f of ['t-bridal-dermatology.html', 't-index.html']) {
  let s = fs.readFileSync(V + '/' + f, 'utf8');
  let n = 0;
  s = s.replace(/<article class="lst-card[^"]*">[\s\S]*?<\/article>/g, card => {
    const hm = card.match(/href="\/treatments\/bridal-dermatology\/([a-z-]+)\/"/);
    if (!hm || !m[hm[1]]) return card;
    const g = m[hm[1]].gallery[0];
    n++;
    return card.replace(/(<div class="lst-card-media"><img src=")[^"]*("[^>]*? width=")\d+(" height=")\d+/, `$1${g.src}$2${g.w}$3${g.h}`);
  });
  fs.writeFileSync(V + '/' + f, s);
  console.log(f, n, 'cards');
  total += n;
}
if (total !== Object.keys(m).length * 2) throw new Error(`expected ${Object.keys(m).length * 2} bridal cards, got ` + total);
