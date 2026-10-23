# Dr Nivedita Dadu — website, API and admin

The system behind **drniveditadadu.com**.

| Part | What it is | Changes expected? |
|---|---|---|
| **Website** | Dr Nivedita Dadu's own frontend (Node.js + Express, server-rendered) | **Yes** — this is the part that evolves |
| **API** | The existing DMC backend, reused as-is apart from documented security fixes | Rarely |
| **Admin** | The existing DMC admin panel, reused as-is (compiled — no source code) | Only its URLs, via config |
| **Database** | A **new, separate** Supabase project, created empty (structure only) | Only through migrations |

## Folder structure

```
dr-nivedita/
├── local/
│   ├── website/        the frontend — EDIT HERE for design, content and pages
│   ├── api/            the backend
│   └── admin/          GENERATED — never edit (scripts/build-admin.js local)
├── admin-build/        compiled admin bundle — the single admin source, never edited
├── live-ready/         GENERATED deploy folders — never edit (scripts/build-live-ready.js)
│   ├── drniveditadadu.com/
│   ├── api.drniveditadadu.com/
│   └── admin.drniveditadadu.com/
├── config/
│   ├── environments.json   the ONLY place site, API and admin URLs are defined
│   └── env/                production .env templates copied into live-ready
├── database/
│   ├── schema.sql          GENERATED full structure (scripts/generate-schema.js)
│   ├── bootstrap.sql       admin roles only
│   └── source/             read-only metadata the schema is generated from
├── scripts/            build, provision and run scripts
├── docs/               architecture, backend changes, URL inventory
└── backups/            approved static snapshot, untouched original backend
```

## Where to make a change

| To change… | Edit | Then run |
|---|---|---|
| Website design, content or pages | `local/website/` | `node scripts/build-live-ready.js` |
| API behaviour | `local/api/` (record it in `docs/BACKEND-CHANGES.md`) | `node scripts/build-live-ready.js` |
| A domain (site / API / admin) | `config/environments.json` and `config/env/*` | `node scripts/build-admin.js local` and `node scripts/build-live-ready.js` |
| Database structure | `scripts/generate-schema.js` | regenerate, then apply the difference as a migration — never re-provision a database that holds data |
| Admin screens or branding | **Not possible** — only the compiled bundle exists | obtain the admin's source code first |

`live-ready/` and `local/admin/` are always rebuilt from their sources, so a change is
made once and cannot drift between copies.

## Run locally

```bash
# API  (local/api/.env must point at the NEW Supabase project)
cd local/api && npm install && node server.js                 # http://localhost:4000

# Admin (from dr-nivedita/)
node scripts/build-admin.js local && node scripts/serve-admin.js   # http://localhost:5173

# Website
cd local/website && npm install && npm run dev                # http://localhost:3000
```

## Create the new database (once)

```bash
node scripts/generate-schema.js
PGHOST=db.<project-ref>.supabase.co PGPASSWORD=... node scripts/provision-database.js
PGHOST=... PGPASSWORD=... ADMIN_EMAIL=... ADMIN_NAME=... ADMIN_PASSWORD=... node scripts/create-admin-user.js
```

Then set `SUPABASE_URL` and the **service_role** key in `local/api/.env`. The provisioning
script refuses the DMC databases and any database that already contains data.

## Build for deployment

```bash
node scripts/build-live-ready.js
```

Rebuilds all three folders, then scans them. It **fails** on `.env` files, secret keys or
database credentials, and reports localhost mentions and old-domain media URLs.

## Known limits

- **Admin:** no source code. Branding still reads "DMC Trichology Admin", and some forms
  pre-fill DMC links and images — see `docs/ARCHITECTURE.md`.
- **Backend fallback content:** when the database is empty, About Us and service-detail
  endpoints return built-in DMC Trichology content — see `docs/BACKEND-CHANGES.md`.
- **Website:** serves the homepage only; the live site has 203 URLs to preserve —
  see `docs/URL-INVENTORY.md`.
