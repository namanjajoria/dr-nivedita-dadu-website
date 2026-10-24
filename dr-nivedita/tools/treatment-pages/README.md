# Treatment page builder

Every treatment page (`views/t-<category>-<slug>.html`) uses one shared layout, the
"Bridal Dermatology" layout. `sd-render.js` draws it, and the CSS/JS for it lives in
`public/css/pages.css` and `public/js/pages.js` (the `sd-*` classes).

Section order: hero → gallery + intro + Book a Consultation → brand-colour band (first topic +
image) → image-left section (second topic + Benefits) → Ideal Candidates + CTA →
Process & Techniques → Cost → FAQs + enquiry form → footer. A section with no content is left out.

## Files

| File | What it does |
| --- | --- |
| `sd-render.js` | The shared page layout. Takes a model, returns the view HTML. |
| `bridal-build.js` | Word files → pages, for Bridal Dermatology. Run: `node bridal-build.js data --write` |
| `bridal-register.js` | Adds the bridal pages built by `bridal-build.js` that are not on the site yet: route + sitemap, service cards (category page and /treatments/), session time. Run: `node bridal-register.js data --write`, then `card-meta.js`, `apply-meta.js`, `apply-results.js`. (The sidebar counts and the "View all N treatments" button are plain text in the views: update them by hand.) |
| `docx-json.ps1` | Word file → JSON blocks (keeps the bold). `bridal-build.js` reads `data/bridal-json/*.json`. |
| `bridal-images.js` | Copies the image folder into `public/images/treatments/bridal/` and writes `data/bridal-images.json`. |
| `old-to-sd.js` | One-off: moved the older pages' content into the shared layout (Oct 2026). |
| `bridal-verify.js`, `all-detail-verify.js` | Checks against the local server (http://localhost:3000): pages load, Word text is all there, images load, footer present. |

## The Word file format the builder expects

Heading 1 = treatment name, then Heading 2 sections in this order:

1. Hero & Intro (an all-bold first line becomes the intro title)
2. First topic (goes in the brand-colour band)
3. Second topic (goes in the image-left section, above Benefits)
4. Benefits Section
5. Ideal Candidates
6. Process & Techniques
7. Before & After Results
8. Cost of … (an optional table, and an optional `*T&C …` note)
9. FAQs (`**Q: question** Ans. answer`)
10. CTA / Closing CTA

Notes written for editors, such as "(… to be confirmed … before publishing)", are left off the page.

## Image folder format (one folder per page)

`slider-image-1..5.webp` (gallery), `<first topic>.webp` (band image), `<second topic>.webp`
(image-left section), `Process & Techniques.webp`.

Slider image 1 is also used on the service cards.

## Before & After results

`data/results-read.txt` lists every image in `public/images/gallery/results/` (sorted by file
name) with the treatment printed on its info strip. `results-map.js --write` turns that into
`data/results-map.json` (page -> images; only clear single-treatment names are mapped), and
`apply-results.js --write` puts the slider into each page's Before & After section. Run
`apply-results.js` again after `bridal-build.js` or `clone-template.js`, because those rewrite the pages.

## Rating row

`apply-meta.js --write` puts the Google rating row (4.8, 1,067 reviews, link to the Vasant Vihar
branch on Google Maps, session time from `data/durations.json`) under each page's intro title.
Run it after `bridal-build.js` / `clone-template.js`, like `apply-results.js`.
