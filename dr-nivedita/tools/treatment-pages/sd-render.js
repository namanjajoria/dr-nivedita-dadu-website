// Shared treatment-detail page layout (the Bridal Dermatology layout), used for every treatment page.
// Input is a normalised model whose text fields are already HTML-safe:
// { name, crumb:{name,path}, subtitle, introHtml,
//   band:{title,html}|null, split:[{title,html}], ideal:html|null, cta:{title,desc},
//   process:html|null, cost:{title,html,table,notes,left}|null, faq:[{q,a}],
//   imgs:{gallery:[{src,w,h}], band, split, tech} }
const arrowIco = '<span class="sd-arrow"><svg class="ico"><use href="#i-arrow"/></svg></span>';
const consent = '<p class="consent">By clicking on "Submit", you agree to our <a href="https://www.drniveditadadu.com/privacy-policy">Privacy Policy</a>, <a href="https://www.drniveditadadu.com/legal-disclaimer">Disclaimer</a> and <a href="https://www.drniveditadadu.com/terms-conditions">Terms &amp; Conditions</a>.</p>';
const attr = s => String(s).replace(/<[^>]+>/g, '').replace(/"/g, '&quot;');

function form(wide) {
  const f = (cls, inner) => `<div class="sd-field${cls}">${inner}</div>`;
  const fields = [
    f('', '<input class="sd-input" type="text" name="name" placeholder="Your Name" aria-label="Your Name" required>'),
    f('', '<input class="sd-input" type="tel" name="phone" placeholder="Mobile Number *" aria-label="Mobile Number" required>'),
    f(wide ? ' sd-field--wide' : '', '<select class="sd-input" name="location" aria-label="Preferred Location" required><option value="">Preferred Location *</option><option>Vasant Vihar</option><option>Rajouri Garden</option></select><svg class="ico field-chev"><use href="#i-chev-d"/></svg>'),
  ].join('\n          ');
  return `<form class="sd-form" action="/api/appointment" method="post" data-form="appointment">
        <input type="hidden" name="_ft" value="{{formToken}}">
        <div class="hp-field" aria-hidden="true"><label>Leave this field empty <input type="text" name="website" tabindex="-1" autocomplete="off"></label></div>
        ${wide ? `<div class="sd-form-grid">\n          ${fields}\n        </div>` : fields}
        <button class="sd-submit" type="submit">Submit ${arrowIco}</button>
        ${consent}
        <p class="form-status" role="status" aria-live="polite" hidden></p>
      </form>`;
}
const img = (im, alt, extra = 'loading="lazy"') => `<img src="${im.src}" alt="${attr(alt)}" ${extra} width="${im.w}" height="${im.h}" decoding="async">`;

function renderPage(m) {
  const gal = m.imgs.gallery;
  if (!gal || !gal.length) throw new Error(m.name + ': no images');
  const thumbs = gal.length > 1 ? `
      <div class="sd-thumbs">
        ${gal.map((g, i) => `<button class="sd-thumb${i ? '' : ' is-active'}" type="button" aria-label="Show image ${i + 1}" aria-pressed="${!i}">${img(g, m.name)}</button>`).join('\n        ')}
      </div>` : '';
  const garrows = gal.length > 1 ? `
        <button class="sd-gallery-arrow prev" type="button" aria-label="Previous image"><svg class="ico"><use href="#i-chev-l"/></svg></button>
        <button class="sd-gallery-arrow next" type="button" aria-label="Next image"><svg class="ico"><use href="#i-chev-r"/></svg></button>` : '';

  const band = m.band ? `<section class="sd-band">
  <div class="sd-band-inner">
    <div class="sd-band-text">${m.band.title ? `
      <h2 class="sd-band-title">${m.band.title}</h2>` : ''}
      ${m.band.html}
    </div>
    <div class="sd-band-img">${img(m.imgs.band || gal[0], m.band.title || m.name)}</div>
  </div>
</section>
` : '';

  const split = m.split && m.split.length ? `
<section class="sd-tech sd-tech--split">
  <div class="sd-tech-wrap">
    <div class="sd-tech-img">${img(m.imgs.split || gal[1] || gal[0], m.split[0].title || m.name)}</div>
    <div>${m.split.map(sec => `${sec.title ? `
      <h2 class="sd-heading">${sec.title}</h2>` : ''}
      <div class="sd-tech-text">${sec.html}</div>`).join('')}
    </div>
  </div>
</section>
` : '';

  const ideal = m.ideal ? `
<section class="sd-ideal">
  <div class="sd-ideal-wrap">
    <div class="sd-ideal-left">
      <div class="sd-card">
        <h3 class="sd-card-title">${m.idealTitle || "Ideal Candidates"}</h3>
        ${m.ideal}
      </div>
    </div>
    <div class="sd-ideal-right">
      <h3 class="sd-cta-title">${m.cta.title}</h3>
      <img class="sd-cta-img" src="/images/treatments/ideal-freq.png" alt="" loading="lazy" width="384" height="256" decoding="async">
      <p class="sd-cta-desc">${m.cta.desc}</p>
      <a class="sd-cta-btn" href="#enquiry">Book a Consultation ${arrowIco}</a>
    </div>
  </div>
</section>
` : '';

  const process = m.process ? `
<section class="sd-tech">
  <div class="sd-tech-wrap">
    <div class="sd-tech-img">${img(m.imgs.tech || gal[0], m.name + ' process and techniques')}</div>
    <div>
      <h2 class="sd-heading">${m.processTitle || "Process &amp; Techniques"}</h2>
      <div class="sd-tech-text">${m.process}</div>${(m.processMore || []).map(sec => `
      <h2 class="sd-heading">${sec.title}</h2>
      <div class="sd-tech-text">${sec.html}</div>`).join("")}
    </div>
  </div>
</section>
` : '';

  // Before & After: same as the reference (tint band + heading). Result cards go in when images exist:
  const results = renderResults(m.results);

  const c = m.cost;
  const cost = c ? `
<section class="sd-cost${c.left ? ' sd-cost--left' : ''}">
  <div class="sd-cost-inner">
    <h2 class="sd-heading">${c.title}</h2>
    <div class="sd-cost-text">${c.html || ''}</div>${c.table ? `
    <div class="sd-table-wrap">
      <table class="sd-table">
        <thead><tr>${c.table[0].map(x => `<th scope="col">${x}</th>`).join('')}</tr></thead>
        <tbody>
          ${c.table.slice(1).map(r => `<tr>${r.map(x => `<td>${x}</td>`).join('')}</tr>`).join('\n          ')}
        </tbody>
      </table>
    </div>` : ''}${(c.notes || []).map(n => `\n    <p class="sd-cost-note">${n}</p>`).join('')}
  </div>
</section>
` : '';

  const faqs = m.faq && m.faq.length ? `
    <div class="sd-fe-left" id="faqs">
      <h2 class="sd-fe-title">FAQs</h2>
      <div class="sd-faq">
        ${m.faq.map((f, i) => `<details${i ? '' : ' open'}><summary><h3>${f.q}</h3></summary><div class="sd-faq-a"><p>${f.a}</p></div></details>`).join('\n        ')}
      </div>
    </div>` : '';

  return `{{> inner-page-start}}

<section class="sd-hero">
  <h1 class="sd-hero-title">${m.name}</h1>
  <nav class="sd-crumb" aria-label="Breadcrumb"><ol><li><a href="/">Home</a></li><li><a href="${m.crumb.path}">${m.crumb.name}</a></li><li><span aria-current="page">${m.name}</span></li></ol></nav>
</section>

<section class="sd-intro">
  <div class="sd-intro-wrap">
    <div class="sd-gallery" data-sd-gallery>
      <div class="sd-gallery-frame">
        <div class="sd-gallery-main">${img(gal[0], m.name, 'fetchpriority="high"')}</div>${garrows}
      </div>${thumbs}
    </div>
    <div class="sd-intro-body">
      <h2 class="sd-intro-title">${m.subtitle}</h2>
      ${renderMeta(m.time)}
      <div class="sd-intro-text">${m.introHtml || ''}</div>
      <div class="sd-consult">
        <h2 class="sd-consult-title">Book a Consultation</h2>
      ${form(true)}
      </div>
    </div>
  </div>
</section>

${band}${split}${ideal}${process}${results}${cost}
<section class="sd-fe${faqs ? '' : ' sd-fe--solo'}" id="contact">
  <div class="sd-fe-wrap">${faqs}
    <div class="sd-fe-right">
      <div class="sd-enquiry" id="enquiry">
        <h3 class="sd-enquiry-title">Enquire About This Treatment</h3>
        <p class="sd-enquiry-desc">Schedule your visit for this specialized treatment.</p>
      ${form(false)}
      </div>
    </div>
  </div>
</section>

{{> inner-page-end}}
`;
}

// Before & After section. With no results it is just the heading band (as on the reference);
// with results it is a slider of cards: title, Before | After tiles, category label.
// Each result image holds before (left half) and after (right half) side by side with an info strip
// at the bottom; the two tiles show the two halves of the same file, strip cropped off.
// results = [{ src, title, label, alt, href }]  (href: /results/#<category>)
function renderResults(results) {
  const list = results || [];
  const cards = list.map(r => {
    const alt = attr(r.alt || r.title);
    return `
          <div class="swiper-slide"><a class="sd-result-link" href="${r.href || '/results/'}"><article class="sd-result-card">
            <h3 class="sd-result-title">${r.title}</h3>
            <div class="sd-result-pair">
              <figure class="sd-result-tile"><img class="is-before" src="${r.src}" alt="${alt} - before" loading="lazy" width="750" height="400" decoding="async"><figcaption>Before</figcaption></figure>
              <figure class="sd-result-tile"><img class="is-after" src="${r.src}" alt="${alt} - after" loading="lazy" width="750" height="400" decoding="async"><figcaption>After</figcaption></figure>
            </div>
            ${r.label ? `<p class="sd-result-label">${r.label}</p>` : ''}
          </article></a></div>`;
  }).join('');
  return `
<section class="sd-results">
  <div class="sd-results-inner">
    <div class="sd-results-head"><h2 class="sd-results-title">Before &amp; After Results</h2></div>${list.length ? `
    <div class="sd-results-slider" data-sd-results>
      <button class="sd-results-arrow prev" type="button" aria-label="Previous result"><svg class="ico"><use href="#i-chev-l"/></svg></button>
      <div class="swiper sd-results-swiper">
        <div class="swiper-wrapper">${cards}
        </div>
      </div>
      <button class="sd-results-arrow next" type="button" aria-label="Next result"><svg class="ico"><use href="#i-chev-r"/></svg></button>
    </div>
    <p class="sd-results-note">* Results may vary from person to person.</p>` : ''}
  </div>
</section>
`;
}

// Rating row under the intro title (as on the reference treatment pages): Google rating + review
// count linking to the Vasant Vihar branch on Google Maps, then the session time when it is known.
const GOOGLE = {
  rating: 4.8, reviews: '1,067',
  maps: 'https://www.google.com/maps/place/Dadu+Medical+Centre/@28.5634509,77.1672309,17.5z/data=!4m6!3m5!1s0x390d1db1bd868b1d:0xec48d4de84a8741c!8m2!3d28.5632398!4d77.1661782!16s%2Fg%2F11b6v0wsgt',
};
const STAR_PATH = 'M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z';
function renderMeta(time) {
  const star = (fill, stroke) => `<svg width="16" height="16" viewBox="0 0 24 24" fill="${fill}" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${STAR_PATH}"/></svg>`;
  const stars = [1, 2, 3, 4, 5].map(i => {
    const pct = Math.round(Math.max(0, Math.min(1, GOOGLE.rating - (i - 1))) * 100);
    return `<span class="sd-star">${star('none', '#D1D5DB')}<span class="sd-star-fill${pct < 100 ? ' sd-star-fill--' + pct : ''}">${star('#F5B301', '#F5B301')}</span></span>`;
  }).join('');
  const clock = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>';
  return `<div class="sd-meta"><a class="sd-rating" href="${GOOGLE.maps}" target="_blank" rel="noopener noreferrer" title="See our Google reviews"><span class="sd-rating-num">${GOOGLE.rating}</span><span class="sd-stars" aria-label="Rated ${GOOGLE.rating} out of 5">${stars}</span><span class="sd-reviews">(${GOOGLE.reviews} Reviews)</span></a>${time ? `<span class="sd-duration">${clock}<span>${time}</span></span>` : ''}</div>`;
}

const DEFAULT_CTA = {
  title: 'Not sure which treatment is right for YOU?',
  desc: 'We can help with that! Schedule a free online consultation with one of our expert Doctors and we&#x27;ll help you create a customized plan.',
};
module.exports = { renderPage, renderResults, renderMeta, DEFAULT_CTA };
