# AGENTS.md — Ticketz

Compact guidance for OpenCode sessions working in this repo.

## Project structure

- Two independent packages, **no root `package.json`**.
  - `backend/` — Node/Express/TypeScript, Sequelize ORM, Postgres, Redis, Bull queues.
  - `frontend/` — React 17 (JavaScript, **not TypeScript**), Material-UI v4, Create React App 5.
- Docker-first deployment; local development is easiest via Docker Compose.

## Backend (`backend/`)

### Entrypoints & build
- Source entry: `src/server.ts`. Compiled output: `dist/server.js`.
- `npm run build` — production compile (no sourcemaps).
- `npm run devbuild` — compile with sourcemaps.
- `npm run dev:server` — run via `ts-node-dev` with `--inspect --respawn --transpile-only`.
- `npm run watch` — `tsc -w`.

### Database
- `npm run db:migrate` — run Sequelize migrations.
- `npm run db:seed` — run all seeders.
- `.sequelizerc` resolves config to `dist/config/database.js`; **build first** before running CLI commands in production.
- `src/bootstrap.ts` loads `.env` (or `.env.test` when `NODE_ENV=test`). `src/config/database.ts` imports this bootstrap, so env vars are available before DB config is read.
- Docker startup runs migrations automatically before starting the server.

### Tests
- `npm test` — runs `pretest` (migrate + seed in test env), then Jest, then `posttest` (undo all migrations).
- Test files: `**/__tests__/**/*.spec.ts`.
- Jest preset: `ts-jest`, environment: `node`, coverage collected from `src/services/**/*.ts`.

### Lint & style
- `npm run lint` — ESLint on `src/**/*.ts`.
- Config in `eslint.config.js`: Prettier enforced as error, double quotes preferred, `import/no-duplicates` is an error, `no-console` is allowed, `@typescript-eslint/no-unused-vars` ignores `_` prefixed args.
- **After edits, run `npx eslint --fix src/**/*.ts` to resolve Prettier violations and warnings.**

### Other scripts
- `npm run generate:i18nkeys` — extracts translation keys into the DB.
- `npm run mark-seeds` — marks all seeds as executed without running them (used during upgrades).

### Runtime quirks
- i18n is initialized asynchronously (`i18nReady`) before the HTTP server starts.
- On startup, the server iterates all companies and starts WhatsApp sessions (`StartAllWhatsAppsSessions`).
- Graceful shutdown handles `SIGINT`/`SIGTERM` with a 30s timeout.
- `app.ts` mounts `/public/*` to serve uploaded files from `uploadConfig.directory`.
- Sentry is initialized unconditionally in `app.ts` (empty `dsn` is harmless).

### Internationalization
- Uses `i18next` with a custom `TranslationsSequelize` backend module.
- Translations live in the Postgres `Translation` table (`language`, `namespace`, `key`, `value`); default namespace is `backend`.
- Export `_t(key, lngSource)` resolves language from a `Ticket`, `Contact`, `Whatsapp`, `Company`, model with `language`, or a raw language string.
- `i18nReady` gates server startup; do not emit translated strings before it resolves.
- `npm run generate:i18nkeys` extracts keys from source into the DB.

## Frontend (`frontend/`)

### Commands
- `npm start` — dev server.
- `npm run build` — production build with `GENERATE_SOURCEMAP=false`.
- `npm run builddev` — production build with sourcemaps.
- `npm test` — CRA test runner (no test files visible in the repo currently).

### Lint & style
- **After edits, run `npx prettier --write src/` (or the specific files changed) to keep formatting consistent and warnings clean.**

### Internationalization
- Uses `i18next` with `i18next-browser-languagedetector`.
- Static dictionaries in `src/translate/languages/*.js` (pt, pt_PT, en, es, fr, de, it, id).
- Detection order: `localStorage` → `navigator`; default/fallback is `en`.
- Namespace is `translations`; import `{ i18n }` from `../../translate/i18n` and call `i18n.t("key")`.

### Build quirks
- The Docker build sets `NODE_OPTIONS=--openssl-legacy-provider` because the React 17 toolchain needs legacy OpenSSL on Node 20+.
- Runtime config is generated from environment variables at container startup and written to `/var/www/public/config.json` by the container entrypoint.

## Docker & local development

- **Full stack locally**: `docker compose -f docker-compose-local.yaml up -d`
  - Frontend on port `3000`, backend on port `8080`.
  - Postgres and Redis included.
  - Default login: `admin@ticketz.host` / `123456`.
- **Infrastructure only** (Postgres + Redis + pgAdmin): `docker compose -f docker-compose-dev.yaml up -d`
- **Internet deployment**: `docker compose -f docker-compose-acme.yaml up -d` (requires editing `.env-backend-acme` and `.env-frontend-acme`).
- Backend container auto-runs migrations and seeds on startup, then starts the app.

## CI / Docker images

- Workflow: `.github/workflows/build-docker.yml`.
- Builds multi-arch (`linux/amd64`, `linux/arm64`) images on push to `main`, `fix/**`, `dev`, `test-**`, and tags `v*.*.*`.
- Publishes to `ghcr.io/ticketz-oss/ticketz-backend` and `ghcr.io/ticketz-oss/ticketz-frontend`.
- CI generates `backend/src/gitinfo.ts` and `frontend/public/gitinfo.json` from git metadata at build time.

## Cross-stack conventions

- **Backend messages** emitted to chat channels (WhatsApp, etc.) must be translated on the backend using `_t(key, entity)` before sending. Never send raw translation keys to end users.
- **Error codes** returned by API responses should remain as keys or codes; the frontend translates them with its own i18n stack.
- **Frontend UI strings** must always use the frontend i18n stack (`i18n.t("key")`).

## License constraint

- Project is **AGPL**. If distributing the system, the source code link must remain easily accessible to all users (default location is the "About Ticketz" screen).
