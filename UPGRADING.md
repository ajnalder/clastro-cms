# Upgrading a Clastro CMS deployment

This document is the contract for upgrading an existing Clastro CMS client
deployment to the latest version of this starter. Paste the *prompt* at the
bottom into any LLM (Claude Code, Cursor, ChatGPT, etc.) running against the
client repo, and the workflow below will execute.

The starter releases are tagged on GitHub
(`v0.2.0`, `v0.3.0`, `v0.3.1`, `v0.4.0`, `v0.4.1`, `v0.5.0` …) — the upgrade
flow compares the client's local version against a specific tag, not against
the moving `main` branch, so upgrades are reproducible.

## What an upgrade does (and doesn't) touch

A Clastro client deployment is a fork of this starter with three layers
intermixed:

| Layer | Owner | Upgrade behaviour |
|---|---|---|
| **Engine** — admin UI, libs, API routes, layouts, base styles, base content types, DB schema | Starter | Replaced with the upstream version |
| **Client customisations** — additional content types, custom pages/components, brand styling, seed data, the client's logo and copy | Client repo | Preserved untouched |
| **Deployment config + live data** — `wrangler.jsonc` D1/KV/R2 IDs, custom domain, Cloudflare secrets, the live D1 database rows, R2 bucket contents | Cloudflare | Never touched by the upgrade |

The upgrade workflow is deliberately conservative — it asks for your approval
before any destructive action (DB writes, deploys, git pushes, new secrets).

## Hard constraints — the LLM must never violate these

- Never touch `wrangler.jsonc` `account_id`, `database_id`, KV `id`,
  R2 `bucket_name`, `routes.pattern`, or `account_id`. Touching these
  moves the deployment to a different account/database/domain and breaks
  everything.
- Never run `wrangler secret put` unless the upgrade explicitly requires
  a new secret (the changelog will mention it). Existing secrets aren't
  rotated by upgrades.
- Live D1 data must be preserved. Migrations are **additive only** —
  `ALTER TABLE ADD COLUMN`. Never `DROP TABLE`, `DROP COLUMN`, or
  anything that loses rows.
- `git push` and `npm run deploy` only happen with explicit user
  approval — the LLM never deploys autonomously.

## Workflow — do these in order, not in parallel

### 1. Stocktake
- `git status` — confirm clean working tree. If not, stop.
- Read local `src/lib/version.ts` → note current `CLASTRO_VERSION`.
- Fetch the same file from the upstream target tag (default: latest):
  `https://raw.githubusercontent.com/ajnalder/clastro-cms/<TAG>/src/lib/version.ts`
- For every version entry between local and target: read the `changes` array.
- Report to the user: "Local is at X. Upgrading to Y. Here's what changed
  between them: [bulleted summary]. Proceed?" — wait for "yes".

### 2. DB migrations (with approval per migration)
- For each version transition you're crossing, check
  `https://github.com/ajnalder/clastro-cms/tree/<TAG>/db/migrations`
  for a file like `X-to-Y.sql`.
- Show the SQL to the user. Ask: "Run this against the live D1? [y/n]"
- On approval: `wrangler d1 execute <db-name> --remote --file <path>`.
- If you see `DROP` statements, stop and ask.

### 3. Engine code — file by file
For each file changed upstream between local and target:
- If local file is identical to upstream's previous version → overwrite.
- If local file mixes engine and client code (typical: `content-types.ts`,
  `schema.sql`, `wrangler.jsonc`) → merge carefully: take engine changes,
  preserve client additions. Show the merged result before saving.
- Skip files that are purely client-specific (custom pages/components
  that don't exist upstream).

**Pure engine — safe to overwrite if locally unchanged:**
- `src/lib/{auth,runtime,ai,seo,design-tokens,version,google-*}.ts`
- `src/lib/repository.ts` (unless client added custom methods — uncommon)
- `src/components/admin/AdminApp.tsx` and supporting admin components
- `src/pages/api/[...path].ts`
- `src/styles/base.css`, `src/styles/components.css`

**Mixed — merge carefully:**
- `src/lib/content-types.ts` — keep client content type definitions
- `db/schema.sql` — additive only (the migration handled the live DB)
- `wrangler.jsonc` — take new `vars` keys (e.g. `GOOGLE_OAUTH_CLIENT_ID`
  in 0.4.1) but never overwrite IDs/domain

**Never auto-update:**
- Custom pages, custom React components, brand styling overrides
- Seeded data
- Anything in `public/` that's the client's branding/assets

### 4. New environment secrets
- Scan the changelog for mentions of `wrangler secret put` or new env vars.
- For each, tell the user: "v0.X.Y added a new secret `<NAME>`. Run
  `npx wrangler secret put <NAME>` yourself and paste the value when
  prompted." Never run secret-writing commands yourself.

### 5. Verify
- `npx astro check` — must be 0 errors. If errors, stop and report.
- `npm test` — must pass. If failing, stop and report.

### 6. Bump version + commit
- Update `src/lib/version.ts` `CLASTRO_VERSION` to match upstream target.
- Update `package.json` version to match.
- Append upstream changelog entries you applied to `CLASTRO_CHANGELOG`.
- `git add` only files you changed (be specific; never `git add -A`).
- Commit with a message like:
  `Upgrade Clastro from vX to vY — [one-line summary]`

### 7. Deploy gate
- Show `git diff --stat HEAD~1`.
- Ask: "Push to origin and run `npm run deploy`? [y/n]"
- On "yes": `git push origin main`, then `npm run deploy`.
- Report the new Worker Version ID from the deploy output.

## Conflict resolution

If you hit ambiguity — file looks heavily customised, merge isn't obvious,
client added something that conflicts with engine changes — STOP and ask
the user. Better to defer than break.

---

## The prompt (paste this into the LLM)

```
Read https://raw.githubusercontent.com/ajnalder/clastro-cms/main/UPGRADING.md
and execute the upgrade workflow against this repo. Target the latest
upstream tag unless I tell you otherwise.

Hard rules: never touch wrangler.jsonc IDs/domain, never run wrangler
secret put or wrangler d1 execute or git push or npm run deploy without
my explicit "yes" in this chat. Migrations must be additive only —
stop and ask if you see DROP statements.

Begin with step 1 (stocktake): report local version vs upstream and
the diff of changes, then wait for my approval.
```

That's it. The prompt is intentionally short — the contract lives here.
