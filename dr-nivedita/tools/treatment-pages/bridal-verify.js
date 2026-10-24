// Fetch each rebuilt page and check: status, section order, no stray **, every Word sentence present, assets load.
const fs = require('fs');
const S = process.argv[2];
const BASE = 'http://localhost:3000';
const PAGES = [['beard-shaping', 'Beard Shaping'], ['divagenesis', 'DivaGenesis'], ['laser-facials', 'Laser Facials'], ['lip-pigmentation', 'Lip Pigmentation'], ['power-glow', 'Power Glow']];
// + the 15 pages added on 24 Oct 2026 (slug + Word file name, written by bridal-build.js)
for (const p of JSON.parse(fs.readFileSync(S + '/bridal-pages.json', 'utf8'))) if (!PAGES.some(([s]) => s === p.slug)) PAGES.push([p.slug, p.doc]);
const NOTE = /\s*\([^()]*(?:to be confirmed|before publishing|live page|current page)[^()]*\)/gi;
const SKIP_H2 = /^(\d+\.\s*)?(Hero & Intro|Hero|Benefits Section|Before & After Results|Before & After|CTA|Closing CTA|Consultation CTA|YouTube Section|Find a Clinic Near You|Awards & Recognition|Newsletter|Footer)$/i;
// Dark Circles: notes for the shared site modules, the H1 marker and the button label are not page text
const SKIP_P = /^(H1:|Button:|\((Patient results|Dark circles video|Shared |Email field|Standard site footer)|Subscribe for dermatologist-approved)/;
const decode = s => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'");
const norm = s => s.replace(/[\u2018\u2019]/g, "'").replace(/\s+/g, ' ').trim();
(async () => {
  let allOk = true;
  for (const [slug, doc] of PAGES) {
    const res = await fetch(`${BASE}/treatments/bridal-dermatology/${slug}/`);
    const html = await res.text();
    const body = html.slice(html.indexOf('<main'), html.indexOf('</main>'));
    const text = norm(decode(body.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, ' ')));
    const order = [...body.matchAll(/<section class="([a-z-]+)/g)].map(m => m[1]).join(' > ');
    const problems = [];
    if (res.status !== 200) problems.push('HTTP ' + res.status);
    if (/\*\*/.test(text)) problems.push('literal ** in page');
    // every Word sentence must be on the page
    const blocks = JSON.parse(fs.readFileSync(`${S}/bridal-json/${doc}.json`, 'utf8').replace(/^\uFEFF/, ''));
    let checked = 0, missing = [];
    for (const b of blocks) {
      let t;
      if (b.k === 'table') t = b.rows.flat().join(' | ');
      else t = (Array.isArray(b.runs) ? b.runs : [b.runs]).map(r => r.t).join('');
      t = norm(t.replace(NOTE, ''));
      if (!t || (b.k === 'h2' && SKIP_H2.test(t.replace(/\*/g, '')))) continue;
      if (/^\(Patient results gallery/.test(t) || SKIP_P.test(t)) continue;            // Before & After hidden for now
      const parts = b.k === 'table' ? b.rows.flat() : t.replace(/^\d+\.\s*/, '').replace(/^Q:\s*/, '').split(/(?<=[.?!:])\s+|\s+Ans\.\s+/);
      for (let p of parts) {
        p = norm(p).replace(/^Ans\.\s*/, '').replace(/:$/, '');
        if (p.length < 3) continue;
        checked++;
        if (!text.includes(p)) missing.push(p);
      }
    }
    if (missing.length) problems.push(`${missing.length} Word fragments missing: ` + missing.slice(0, 6).map(m => JSON.stringify(m.slice(0, 70))).join(' ; '));
    // assets
    const srcs = [...new Set([...html.matchAll(/(?:src|href)="(\/(?:images|css|js)\/[^"]+)"/g)].map(m => m[1]))];
    for (const u of srcs) { const r = await fetch(BASE + u); if (r.status !== 200) problems.push('BROKEN ' + r.status + ' ' + u); }
    const forms = (body.match(/data-form="appointment"/g) || []).length;
    console.log(`\n== ${slug}  HTTP ${res.status}  | ${checked} Word fragments checked | ${forms} forms | ${srcs.length} assets`);
    console.log('   sections: ' + order);
    if (problems.length) { allOk = false; problems.forEach(p => console.log('   PROBLEM: ' + p)); } else console.log('   OK');
  }
  console.log(allOk ? '\nALL PAGES OK' : '\nSOME PROBLEMS');
})();
