# About pages layout (dadumedicalcentre.com design)

The five About pages are built with the **layout of the dadumedicalcentre.com About pages** and keep
the **text and photos of the live drniveditadadu.com About pages**:

| Page | View | Reference layout |
|---|---|---|
| /dr-nivedita-dadu-skin-specialist-in-delhi | dr-nivedita-dadu.html | /dr-nivedita-dadu |
| /about-clinic | about-clinic.html | /about-clinic |
| /general-dermatology | general-dermatology.html | none on the reference (404), so the About Clinic components |
| /cosmetic-dermatology | cosmetic-dermatology.html | none on the reference (404), so the About Clinic components |
| /technology | technology.html | /technology (card grid) |

The pages load one extra stylesheet, `public/css/about.css`. This is set by `css: '/css/about.css'` in
`config/pages.js` and `pageCssUrl` in `utils/seo.js`.

| File | What it does |
|---|---|
| `port-css.js` | Writes `about.css` from the reference CSS in `ref/` and then appends `about-extra.css`. The styled-jsx scope classes are removed, and the reference coral and orange shades are mapped to this site's peach tokens. |
| `about-extra.css` | This site's own additions. It holds values measured on the rendered reference where a later override wins, plus the details/summary FAQ styling (the FAQ schema reads `details.faq-row`), the gallery, the card grids and the stories. |
| `compose-dermatology.js`, `compose-doctor.js` | One-time builders. They lift every heading, paragraph, card, review and photo from the earlier views in `backups/about-pages-2026-10-27/views/` into the reference components. After that run the views are the source of truth, so edit the views directly. |

After any edit, run `node port-css.js`. Then compare the pages with the live site (text and images) before you publish.
