// Opens every blog post in the real admin editor (headless Chrome) and checks that the editor
// keeps its whole content: same visible text and the same number of tables/images as the
// database copy. Nothing is saved. Writes each editor's HTML to <outDir>/<slug>.html.
//   node tools/db/admin-editor-check.js <adminUrl> <email> <password> <seed.json> <outDir> [slug...]
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const [ADMIN, EMAIL, PASS, SEED, OUT, ...only] = process.argv.slice(2);
const CHROME = 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe';
const PORT = 9556;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const NAMED = { nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', ndash: '–', mdash: '—', hellip: '…', bull: '•', deg: '°', reg: '®', trade: '™', copy: '©', times: '×', rarr: '→', larr: '←', middot: '·', frac12: '½', eacute: 'é' };
const decode = (s) => s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+\d*);/gi, (m, e) => (e[0] === '#' ? String.fromCodePoint(e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : +e.slice(1)) : NAMED[e.toLowerCase()] ?? m));
const text = (h) => decode(h.replace(/<[^>]+>/g, ' ')).replace(/[\s\u00a0\ufeff]+/g, ' ').trim();
const count = (h, re) => (h.match(re) || []).length;

async function cdp(wsUrl) {
  const ws = new WebSocket(wsUrl);
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  let id = 0;
  const waiting = new Map();
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data);
    if (m.id && waiting.has(m.id)) { waiting.get(m.id)(m); waiting.delete(m.id); }
  };
  const send = (method, params = {}) => new Promise((r) => { const i = ++id; waiting.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  const evaluate = async (expression) => {
    const m = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (m.result?.exceptionDetails) throw new Error(m.result.exceptionDetails.exception?.description || 'evaluate failed');
    return m.result?.result?.value;
  };
  return { send, evaluate, close: () => ws.close() };
}

async function waitFor(page, expression, ms = 20000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    if (await page.evaluate(expression).catch(() => false)) return true;
    await sleep(250);
  }
  return false;
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const seed = JSON.parse(fs.readFileSync(SEED, 'utf8')).filter((r) => !only.length || only.includes(r.slug));
  // reuse a headless Chrome already listening on PORT, otherwise start one
  let targets = await fetch(`http://127.0.0.1:${PORT}/json`).then((r) => r.json()).catch(() => null);
  const chrome = targets ? null : spawn(CHROME, ['--headless=new', '--disable-gpu', `--remote-debugging-port=${PORT}`, `--user-data-dir=${path.join(OUT, '.chrome')}`, '--window-size=1400,1000', 'about:blank'], { stdio: 'ignore', detached: true });
  try {
    for (let i = 0; i < 160 && !targets?.some?.((t) => t.type === 'page'); i++) { await sleep(250); targets = await fetch(`http://127.0.0.1:${PORT}/json`).then((r) => r.json()).catch(() => null); }
    const page = await cdp(targets.find((t) => t.type === 'page').webSocketDebuggerUrl);
    await page.send('Page.enable');
    await page.send('Runtime.enable');
    // always test the admin as deployed now, never a cached older bundle
    await page.send('Network.enable');
    await page.send('Network.clearBrowserCache');
    await page.send('Network.setCacheDisabled', { cacheDisabled: true });

    // log in through the real form
    await page.send('Page.navigate', { url: `${ADMIN}/login` });
    if (!(await waitFor(page, `!!document.querySelector('input[type=password]')`))) throw new Error('login form not found');
    for (const [sel, value] of [['input[type=email],input[name=email]', EMAIL], ['input[type=password]', PASS]]) {
      await page.evaluate(`(()=>{const el=document.querySelector(${JSON.stringify(sel)});el.focus();el.select();})()`);
      await page.send('Input.insertText', { text: value });
    }
    await page.evaluate(`document.querySelector('button[type=submit]').click()`);
    if (!(await waitFor(page, `!!localStorage.getItem('dmc_admin_token')`))) throw new Error('login failed');

    await page.send('Page.navigate', { url: `${ADMIN}/blogs` });
    await sleep(1500);
    const bad = [];
    for (const [n, row] of seed.entries()) {
      // client-side route change: the blog list is loaded once
      await page.evaluate(`(()=>{history.pushState({}, '', '/blogs/edit/${row.slug}');dispatchEvent(new PopStateEvent('popstate'));})()`);
      const probe = JSON.stringify(text(row.full_description).slice(0, 40));
      const ok = await waitFor(page, `(()=>{const e=document.querySelector('.ql-editor');return !!e && e.innerText.replace(/\\s+/g,' ').includes(${probe}.slice(0,25));})()`, 20000);
      const html = (await page.evaluate(`(document.querySelector('.ql-editor')||{}).innerHTML||''`)) || '';
      fs.writeFileSync(path.join(OUT, `${row.slug}.html`), html);
      const a = text(row.full_description), b = text(html);
      const issues = [];
      if (!ok) issues.push('editor did not show the post');
      if (a !== b) {
        let i = 0; while (i < a.length && a[i] === b[i]) i++;
        issues.push(`text differs @${i}: db "…${a.slice(Math.max(0, i - 40), i + 60)}…" editor "…${b.slice(Math.max(0, i - 40), i + 60)}…"`);
      }
      // in-page links must still find their bookmark (<a name> / id) in the editor's copy
      for (const [, target] of row.full_description.matchAll(/href="#([^"]+)"/g)) {
        if (!new RegExp(`(?:name|id)="${target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`).test(html)) issues.push(`bookmark #${target} lost`);
      }
      for (const [name, re] of [['tables', /<table/g], ['images', /<img/g], ['links', /<a [^>]*href=/g], ['lists', /<(?:ul|ol)\b/g]]) {
        if (count(row.full_description, re) !== count(html, re)) issues.push(`${name} ${count(row.full_description, re)} -> ${count(html, re)}`);
      }
      if (issues.length) bad.push([row.slug, issues]);
      if ((n + 1) % 30 === 0) console.log(`  ${n + 1}/${seed.length} checked, ${bad.length} with issues`);
    }
    console.log(`${seed.length} posts opened in the admin editor; ${bad.length} lose or change something`);
    for (const [s, i] of bad.slice(0, 25)) console.log(' ', s, '\n     ' + i.join('\n     '));
    page.close();
  } finally {
    if (chrome) chrome.kill();
  }
})().catch((e) => { console.error(e.message); process.exit(1); });
