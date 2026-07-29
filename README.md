# Kindle Todo

A minimal, single-user todo app built with [Hono](https://hono.dev) on [Cloudflare Workers](https://workers.cloudflare.com), with todos stored in a [Cloudflare D1](https://developers.cloudflare.com/d1/) database.

The UI is plain server-rendered HTML/CSS designed for the **Kindle 5.16 experimental browser** (e-ink friendly, high contrast, works with JavaScript disabled — every action is a classic form POST).

## Features

- Login only — no signup. Credentials come from environment variables/secrets
- HMAC-signed session cookie (HttpOnly, 7-day expiry)
- Todos stored in Cloudflare D1: add, mark done/undo, delete
- Zero client-side JavaScript, Kindle/e-ink optimized layout

## Prerequisites

- [Node.js](https://nodejs.org) 18+
- A [Cloudflare account](https://dash.cloudflare.com/sign-up) (free plan works)
- Wrangler CLI (installed as a dev dependency; used via `npx wrangler`)

## Project Structure

```
package.json
wrangler.jsonc       # Worker config + D1 binding
tsconfig.json
schema.sql           # D1 schema (todos table)
.dev.vars.example    # Template for local secrets
src/
  index.ts           # Hono app + routes
  auth.ts            # Cookie signing/verification, credential checks
  pages.ts           # Server-rendered HTML pages (Kindle-friendly)
  db.ts              # D1 queries
```

## Local Development Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure local secrets

Copy the example file and edit the values:

```bash
cp .dev.vars.example .dev.vars
```

`.dev.vars` (never committed — already in `.gitignore`):

```ini
AUTH_USERNAME=admin
AUTH_PASSWORD=changeme
SESSION_SECRET=a-long-random-string-change-me
```

> Generate a strong `SESSION_SECRET` with: `openssl rand -base64 32`

### 3. Initialize the local D1 database

```bash
npm run db:init:local
```

This applies `schema.sql` to a local D1 database simulated by Miniflare (stored under `.wrangler/`).

### 4. Start the dev server

```bash
npm run dev
```

Open http://localhost:8787 and log in with the credentials from `.dev.vars`.

## Cloudflare Deployment Setup

### 1. Log in to Cloudflare

```bash
npx wrangler login
```

### 2. Create the D1 database

```bash
npx wrangler d1 create kindle-todo
```

The command prints a block like:

```jsonc
"d1_databases": [
  {
    "binding": "DB",
    "database_name": "kindle-todo",
    "database_id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
  }
]
```

Copy the `database_id` value into `wrangler.jsonc`, replacing `REPLACE_WITH_YOUR_DATABASE_ID`.

### 3. Apply the schema to the remote database

```bash
npm run db:init:remote
```

### 4. Set production secrets

Each command prompts for a value (values are stored encrypted by Cloudflare and never appear in code):

```bash
npx wrangler secret put AUTH_USERNAME
npx wrangler secret put AUTH_PASSWORD
npx wrangler secret put SESSION_SECRET
```

### 5. Deploy

```bash
npm run deploy
```

Wrangler prints your live URL, e.g. `https://kindle-todo.<your-subdomain>.workers.dev`.

> The `workers.dev` domain serves over HTTPS automatically, which the Kindle browser needs for cookies to work reliably.

## Using It on a Kindle

1. On the Kindle (firmware 5.16), open **Web Browser** (under the menu / Experimental Browser).
2. Navigate to your deployed URL.
3. Log in with the username/password you set as secrets.
4. Add, complete, and delete todos — every action is a full page reload, no JavaScript required.

## Useful Commands

| Command | Description |
|---|---|
| `npm run dev` | Start local dev server (Miniflare + local D1) |
| `npm run deploy` | Deploy the Worker to Cloudflare |
| `npm run typecheck` | Run TypeScript type checking |
| `npm run db:init:local` | Apply `schema.sql` to the local D1 database |
| `npm run db:init:remote` | Apply `schema.sql` to the remote D1 database |
| `npx wrangler d1 execute kindle-todo --remote --command "SELECT * FROM todos"` | Query the remote database directly |
| `npx wrangler tail` | Stream live logs from the deployed Worker |

## Troubleshooting

- **`database_id` error on deploy** — make sure you replaced `REPLACE_WITH_YOUR_DATABASE_ID` in `wrangler.jsonc` with the ID from `wrangler d1 create`.
- **"no such table: todos"** — run `npm run db:init:local` (local) or `npm run db:init:remote` (production).
- **Login always fails in production** — verify secrets with `npx wrangler secret list`; re-set them with `wrangler secret put` if needed.
- **Redirect loop to /login** — the session cookie could not be verified; ensure `SESSION_SECRET` is set and unchanged (changing it invalidates existing sessions).
