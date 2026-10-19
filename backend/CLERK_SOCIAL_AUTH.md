# Google via Clerk

The existing password and refresh-token flows remain unchanged. This integration
exchanges a verified Clerk session for the existing application tokens; it never
creates users, companies, memberships or WhatsApp sessions.

## Deployment configuration

Set these variables through the deployment secret/config manager, never Git:

- `CLERK_GOOGLE_ENABLED=true` only after Google has been configured and validated
  in the matching Clerk instance. This explicit deployment switch is not a live
  poll of the Clerk Dashboard; set it to false when disabling the provider there.
- `CLERK_ENVIRONMENT=production` requires both `pk_live_` and `sk_live_` keys.
  `development` requires both `pk_test_` and `sk_test_` keys. This deliberately
  does not depend on `NODE_ENV`: a dev Docker build still runs in production mode.
- `CLERK_SECRET_KEY`: backend-only secret for that instance.
- `CLERK_PUBLISHABLE_KEY`: corresponding public key.
- `CLERK_ISSUER`: HTTPS origin encoded in the public key, without trailing slash.
- `CLERK_AUTHORIZED_PARTIES`: comma-separated exact frontend origins. No wildcard
  or origin copied from incoming headers. Include each enabled tenant explicitly.
- `CLERK_TENANT_BASE_DOMAIN`: `espacowhats.com.br` for production or
  `dev.espacowhats.com.br` for dev. The signed `azp` hostname determines the tenant;
  a body slug must match it. Base domain / www / app target `MASTER_COMPANY_ID`
  (default 1); `{slug}.base` targets only the corresponding tenant. Localhost is
  allowed only with the explicit development configuration for local QA.

Missing, malformed or mixed-instance/environment configuration disables Google.
Apple and Microsoft are always disabled by this release. Never put live keys in
dev. Node >=20.9 is required by the pinned official Backend SDK.

## API

`GET /auth/social/providers` (no-store) returns:

```json
{
  "publishableKey": null,
  "providers": {
    "google": { "enabled": false },
    "apple": { "enabled": false },
    "microsoft": { "enabled": false }
  }
}
```

When configured, Google is true and the public key is provided. No secret is
included. `POST /auth/social/google` accepts `{ "clerkToken": "...", "slug":
"acnorte" }`; on success returns `{ "token": "...", "user": { ... } }` and the
existing `jrt` refresh cookie. The endpoint is rate-limited. Failures use
`ERR_SOCIAL_LOGIN_DISABLED` (503), `ERR_SOCIAL_LOGIN_INVALID` (401),
`ERR_SOCIAL_LOGIN_NO_ACCESS` (403; ask the tenant administrator to register the
same email), or the existing inactive/suspended company errors. Frontend must
translate these keys and must not use Clerk user presence alone for app access.

The backend verifies the signature, issuer and authorized origin, requires the
HTTP Origin to match that signed origin (including during API tests), rejects
pending sessions, and checks that the
Clerk session is active and belongs to the user, and requires a verified primary
email linked to a verified Google external account. It matches that email only
inside the exact tenant and never falls back to other tenants. Only after this
tenant passes the existing `TENANT_RUNTIME_COMPANY_ID` /
`TENANT_RUNTIME_EXCLUDED_COMPANY_IDS` ownership guard may account lookup proceed;
the dedicated runtime also requires its separate queue prefix. Only after this
authorization may Google name and trusted HTTPS image URL update the existing
user. Role, super flag, password, email, tokenVersion and channel sessions stay
unchanged. Provider images are displayed remotely, not downloaded or proxied by
this backend. The migration widens the existing picture column to TEXT to avoid
truncating Clerk proxy URLs; its rollback deliberately does not narrow the column.

## Verification

Run focused tests without the database-destructive npm test lifecycle:

```sh
npx jest --runInBand --coverage=false src/__tests__/services/ClerkGoogleAuthService.spec.ts src/services/UserServices/__tests__/FotoUsuarioService.spec.ts
npm run generate:i18nkeys
npm run build
```

The tests mock Clerk and database adapters; they do not replace an end-to-end
provider login test in each deployed environment.
