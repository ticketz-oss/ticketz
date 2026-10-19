# Google authentication and environment isolation

The custom Portuguese Espaço Whats login remains responsible for the interface.
Clerk supplies only the Google identity; the backend requires an existing user in
the exact tenant. Password login remains available. Apple and Microsoft are not
enabled until their credentials and end-to-end flow are configured and tested.

| Deployment | Clerk instance | Key type | Runtime scope |
| --- | --- | --- | --- |
| Global dev | Development | test | Existing dev tenants |
| AC Norte dev | Development | test | Existing isolated AC Norte dev database |
| Global production | Production | live | Excludes AC Norte company 9 |
| AC Norte production | Production | live | Company 9 only, existing production data |

The backend validates matching publishable/secret key prefixes, issuer, explicit
authorized origins, request Origin, signed token azp, active Clerk session and
verified Google email. The tenant is derived from the trusted origin and must
match the requested slug. Runtime tenant ownership is checked before any user
update or token issuance. No company or app user is created by social login.

Secrets are outside the checkout, under `/etc/dokploy/secrets`, with root-only
permissions. Development and production use different files. No secret is
included in the frontend image or returned by the public provider endpoint.
The publishable key is supplied at runtime by the backend. Incorrect or missing
configuration disables Google. `CLERK_ENVIRONMENT` is explicit because all
Docker containers use `NODE_ENV=production`, including development deployments.

Only explicitly authorized origins are accepted. When adding a tenant hostname,
update `CLERK_AUTHORIZED_PARTIES` for its deployment and validate its callback.
Do not use wildcard origins. Callback routes are `/login/google/callback`,
`/login/google/complete`, `/login/google/continue` and `/login/google/error`.
The browser SDK is pinned to 6.31.1 and loaded from the configured Clerk instance;
it does not replace the existing UI or require upgrading React 17.

## Release checks

1. Verify backups, baseline record counts, active WhatsApp connections, current
   images and volume mounts. Never copy development data or credentials to the
   production database or recreate the persistent volumes.
2. Merge current main into the tested development candidate, preserving tenant
   runtime isolation, legal pages and current release workflows. Test, build and
   publish global dev before promotion.
3. Merge the global candidate into AC Norte, preserving SGA, billing flags,
   queue prefix, company ownership, and production session/public/private mounts.
4. Validate the real Google callback with an existing authorized account and
   verify refusal for an unregistered email/tenant. Verify password login, public
   branding, cache headers and private API no-store behavior.
5. Promote only validated branch heads through the repository release workflows.
   Deploy backends sequentially because both production runtimes share a database.
6. Compare connections and data after deploy, check Dokploy status, health and
   served git metadata. A successful build alone is not a successful release.

The only new database migration widens `Users.profilePicUrl` to TEXT so verified
Google/Clerk image URLs are not truncated. It does not reset passwords, tokens,
roles, messages, contacts, or WhatsApp sessions. Remote profile images are not
downloaded into the application's storage.
