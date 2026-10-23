# Dr. Nivedita Dadu's Dermatology Clinic website

Express server for the approved homepage design: server-rendered HTML, a small form API,
security headers, and the technical SEO foundation (canonical URLs, Open Graph, JSON-LD,
robots.txt, sitemap.xml).

## Requirements

- Node.js 20.12 or newer (uses the built-in `.env` loader and `--watch`)

## Run locally

```bash
npm install
cp .env.example .env      # Windows: copy .env.example .env
npm run dev
```

Open http://localhost:3000. `npm run dev` restarts on server code changes; views, CSS and JS
are re-read on every request in development. Use `npm start` for production.

## Project structure

```text
server.js              starts the HTTP server
app.js                 Express app: middleware order, static files, routes, error handling
config/
  index.js             environment variables (validated at startup)
  site.js              clinic facts used for metadata and structured data
  pages.js             page registry -> page routes + sitemap.xml
  forms.js             form fields and messages for the API
  redirects.js         permanent redirects for the production migration (empty for now)
routes/                pages, /api form endpoints, robots.txt + sitemap.xml
controllers/           page rendering, form handling, SEO files
services/              email delivery, form tokens (anti-bot), status/404 page
middleware/            security headers, rate limiting, redirects, 404 + error handler
utils/                 templating, validation, SEO helpers, JSON-LD, asset versioning
views/                 index.html (homepage), status.html (404/errors), partials/
public/                css/, js/, images/, vendor/swiper/, favicon.ico
archive/               the approved static file and earlier snapshots (not served, git-ignored)
```

## Environment variables

See `.env.example` for every option. The important ones:

| Variable | Purpose |
| --- | --- |
| `NODE_ENV` | `production` enables caching, HSTS and strict checks |
| `SITE_URL` | Public origin for canonical/OG/sitemap URLs. Must be a public `https` origin in production |
| `SEO_ALLOW_INDEXING` | Defaults to `true` in production, `false` elsewhere (always `false` on localhost) |
| `FORM_SECRET` | Signs anti-bot form tokens. Required in production |
| `SMTP_*`, `MAIL_FROM`, `MAIL_TO` | Email delivery for form submissions |
| `TRUST_PROXY` | Set (usually `1`) behind a reverse proxy so rate limits use the visitor IP |

## Routes

| Method | Path | Description |
| --- | --- | --- |
| GET | `/` | Homepage |
| GET | `/index.html` | 301 to `/` |
| GET | `/robots.txt` | Generated from `SITE_URL` and `SEO_ALLOW_INDEXING` |
| GET | `/sitemap.xml` | Generated from `config/pages.js` |
| POST | `/api/appointment` | Hero "Schedule A Consultation" form |
| POST | `/api/contact` | "Contact Us" form |
| POST | `/api/review` | Footer "Rate us" form |
| POST | `/api/newsletter` | Footer newsletter form |

Form endpoints accept JSON (used by `public/js/main.js`) or normal form posts (when JavaScript
is off, the server replies with a themed page). Each request is sanitised and validated
server-side, checked against a hidden honeypot field and a signed timestamp token, and
rate-limited per IP. Responses are `{ ok, message, errors? }` with status 200, 400, 422, 429
or 503.

Without SMTP settings, development prints submissions to the console. Production answers
with "temporarily unavailable" (503) instead of silently dropping enquiries.

## Adding a page

1. Create `views/<name>.html` (copy the `<head>` of `views/index.html`).
2. Add an entry to `config/pages.js` with `path`, `view`, `title`, `description`
   (and optional `breadcrumbs` / `image`).

The route, canonical URL, Open Graph tags, JSON-LD and sitemap entry follow automatically.
Suggested URL patterns: `/treatments/<slug>/`, `/conditions/<slug>/`, `/doctors/<slug>/`,
`/blog/<slug>/`, `/contact/`.

## Redirects

When old drniveditadadu.com URLs are mapped to new ones, add them to `config/redirects.js`
as `{ from: '/old-path', to: '/new-path/' }`. They are served as 301s.

## External API integration

Form submissions can be forwarded to the existing backend. The wiring is complete but
**switched off by default**: while `API_BASE_URL` is empty, `config.api.enabled` is
`false` and submissions are delivered the way they always were (SMTP, or the console
in development). Setting `API_BASE_URL` is the only change needed to turn it on.

> **Never point `API_BASE_URL` at the production API.** Submissions are written to
> whatever database sits behind it, so a local test would create real leads in live
> data. Point it at a local copy of the API (see `../api`) or at a staging
> environment.

How a submission travels:

```
browser --POST /api/<form>--> this site (validate, sanitise, anti-spam, rate limit)
                                   |
                                   +-- API_BASE_URL set? --> services/apiService.js --> backend
                                   +-- otherwise ----------> services/mailService.js
```

- `config/forms.js` holds each form's fields **and** its `api.endpoint` + `api.payload()`,
  so the mapping between this site's field names and the backend's is in one file.
- `services/apiService.js` performs the call, with a timeout. The backend's own 4xx
  messages are shown to the visitor; its 5xx messages are replaced with a generic one,
  because they can contain raw database errors.
- `controllers/formController.js` is the single choke point, and answers in the same
  shape (JSON or themed page) whatever the outcome.
- The browser never talks to the backend: `public/js/main.js` posts only to this site's
  own `/api/...` routes, so no endpoint, key or credential reaches the client.

Current form mapping:

| Site form | Backend endpoint | Notes |
| --- | --- | --- |
| `appointment` | `POST /api/contact` | sent as a lead with `preferredLocation`; the appointment endpoint additionally requires email, service and a date, which this form does not collect |
| `contact` | `POST /api/contact` | `phone` → `mobile`, `subject` → `service` |
| `review` | `POST /api/contact` | recorded as tagged feedback; the backend has no public review endpoint, and this is never published as review schema |
| `newsletter` | `POST /api/newsletter/subscribe` | |

Each form sends a distinct `source` (`dadu-…`) so leads from this site are
identifiable in the admin panel.

## Running the API locally

`../api` is the backend used by this website.

```bash
cd ../api
npm install
cp .env.example .env      # fill in Supabase credentials
npm start                 # http://localhost:4000
```

Then start this site with `API_BASE_URL=http://localhost:4000`. Without valid Supabase
credentials the API boots and answers, but every database call fails — the site shows a
polite error instead, and nothing is lost silently.

## Production checklist

- `NODE_ENV=production`, `SITE_URL=https://<final domain>`
- `FORM_SECRET` set to a long random value
- SMTP credentials and `MAIL_TO` inbox configured
- `TRUST_PROXY` set if a proxy or CDN sits in front of Node
- HTTPS terminated in front of the app (HSTS is sent in production)
