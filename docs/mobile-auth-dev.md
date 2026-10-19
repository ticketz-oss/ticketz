# Native iOS authentication bridge — development only

This release adds no user, database table, role or channel session. The existing
Portuguese Google/Clerk web flow and all of its issuer, azp, Origin, verified-email
and tenant checks remain unchanged. Production is disabled by configuration.

## Environment and URLs

- Global dev base: `https://dev.espacowhats.com.br/backend` (master account only).
- Tenant test base: `https://teste.dev.espacowhats.com.br/backend` (slug `teste`).
- AC Norte dev uses its separate existing runtime at
  `https://acnorte.dev.espacowhats.com.br/backend`; do not use production URLs or
  copy production sessions/data. Deployment health is a separate live check.
- Enable `MOBILE_AUTH_ENABLED=true` only in the appropriate dev backend.
  It also requires a complete enabled Clerk Development configuration with test
  keys and `CLERK_TENANT_BASE_DOMAIN=dev.espacowhats.com.br`. `NODE_ENV` is not used
  as an environment discriminator. Live keys or production domain always disable
  the bridge. Default is disabled. No secrets are added to source or native app.

## Contract (paths relative to the backend base)

`GET /auth/mobile/config` returns HTTP 200 `{ "enabled": boolean }`.

1. Native generates a cryptographically random verifier of 43–128 RFC 7636
   unreserved characters and state of 22–128 base64url characters. Compute
   `codeChallenge=base64url(SHA256(verifier))`, exactly 43 canonical characters.
   Keep verifier/state in the native process, never in URLs or analytics.
2. Open the selected HTTPS tenant's `/login/mobile` in ASWebAuthenticationSession.
   The page receives only challenge and state, uses the existing Google web flow,
   and obtains an ordinary app access token and jrt cookie on that same origin.
3. Browser calls `POST /auth/mobile/authorize` with app Bearer access token,
   HttpOnly jrt cookie, normal browser Origin, JSON `{ "codeChallenge": "...",
   "state": "..." }`. It returns HTTP 200 `{ "code": "...", "state": "..." }`.
   The tenant derived from an explicitly authorized dev Origin must equal BOTH
   JWT/cookie company IDs. User IDs and tokenVersion must match a current active
   user. Impersonation/original-user metadata is rejected. Redirect URLs from
   clients are not accepted or used.
4. Browser uses the constant `espacowhats://auth/callback?code=...&state=...`.
   This URL contains no app/Clerk tokens. Native validates scheme, host, path,
   exactly one code/state, matching pending state and the originally selected
   backend. It must not obtain a new backend or tenant from callback parameters.
5. Native calls `POST /auth/mobile/exchange` on that same backend with JSON
   `{ "code": "...", "codeVerifier": "..." }`; no Origin is needed. HTTP 200
   returns `{ "token": "...", "user": { ...existing SerializeUser fields } }`
   and the existing Secure HttpOnly SameSite=None `jrt` refresh cookie (7 days).
   Access JWT lifetime remains 15 minutes. Do not log response bodies/cookies.

Codes are random 256-bit secrets; Redis keys contain only SHA-256(code).
Records contain challenge, userId, companyId, tokenVersion and expiry, never a
JWT, refresh token, provider profile, raw code, state or verifier. TTL is 90s.
Namespace includes Clerk issuer, tenant base and queue prefix to separate runtimes.
After correct PKCE and active-user/runtime revalidation, Lua compares/deletes the
exact record atomically. A concurrent/replayed/expired code cannot issue a second
session. Wrong verifier does not consume the legitimate code. No fallback on
Redis failure. A network failure after code consumption requires starting again.

All routes, including errors and rate limits, use `Cache-Control: no-store`,
`Pragma: no-cache`, `Referrer-Policy: no-referrer`. Limits per process/IP per 5m:
config 60, authorize 20, exchange 30. HTTP429 includes standard retry/rate headers.
Errors: `ERR_MOBILE_AUTH_REQUEST`400, `ERR_MOBILE_AUTH_INVALID`401,
`ERR_MOBILE_AUTH_FORBIDDEN`403, `ERR_MOBILE_AUTH_DISABLED`503,
`ERR_MOBILE_AUTH_RATE_LIMIT`429; existing inactive/suspended/runtime errors remain.
In a horizontally scaled deployment, migrate the limiter to shared storage;
single-use code consumption is already shared and atomic in Redis.

## Existing native password/refresh contract

- `POST /auth/login` JSON `{email,password,slug}` returns `{token,user}` and jrt.
  Omit slug only for the master account. Never search another company on failure.
- `POST /auth/refresh_token` uses jrt cookie only and rotates tokens/cookie.
  A revoked password/tokenVersion, suspended or inactive company prevents renewal.
- Protected endpoints use `Authorization: Bearer <app token>`, not a Clerk JWT.
- `GET /auth/me` currently additionally needs jrt and returns only id/profile/
  email/super; use login/refresh user payload for the full native identity.
- `DELETE /auth/logout` needs Bearer and clears jrt. Existing access tokens are
  not revoked server-side by this legacy endpoint. Erase native cookie/Keychain/
  in-memory tokens even if network logout fails. Never persist tokens/passwords
  in UserDefaults. Keep a per-environment/per-tenant cookie store.
- Invalid credentials401; expired access currently403 `ERR_SESSION_EXPIRED`;
  refresh missing/expired401; suspended/inactive403. Retry one serialized refresh
  only for session-expired errors, never for every403 or tenant denial.

## Quick replies and isolation audit

`GET /quick-messages/list` (Bearer) returns an array of id,shortcode,message,
companyId,userId,createdAt,updatedAt and company{id,name}. It derives company/user
from the authenticated token and respects company setting `quickMessages`:
`individual` (default) restricts owner; other configured modes expose tenant scope.
Selection should fill a draft; do not automatically send the template.

The legacy GET/DELETE `/quick-messages/:id` services do not currently enforce
company ownership. Do not expose these actions through the mobile client until a
separately reviewed tenant-isolation correction. This bridge does not change them.
There were no dedicated mobile routes before this release; do not confuse MCP
OAuth access tokens with ordinary application user sessions.

## Isolated verification (never npm test lifecycle)

Run Jest directly: `npx jest --runInBand --coverage=false
src/__tests__/services/MobileAuthService.spec.ts
src/__tests__/services/MobileAuthRoutes.spec.ts
src/__tests__/services/ClerkGoogleAuthService.spec.ts`.
Adapters are mocked; no database, real Clerk identity, WhatsApp session or remote
endpoint is touched. Build and live native Google E2E remain separate release gates.
