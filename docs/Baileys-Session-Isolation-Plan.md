# Baileys Session Isolation Plan

## Goal

Separate a WhatsApp connection from its Baileys authentication session.
Resetting a connection must attach a new, empty session before another QR
code is generated, without deleting the connection, tickets, queues, settings,
or application contacts.

Existing installations must convert legacy sessions automatically on startup,
before attempting to connect. A valid existing session should reconnect without
requiring another QR scan. Conversion must not require per-installation manual
data changes.

## Current behavior

- `backend/src/models/Whatsapp.ts` stores connection configuration and the
  serialized Baileys credentials in `session`.
- `backend/src/helpers/authState.ts` stores Signal keys in `BaileysKeys`,
  indexed by `whatsappId`. `BaileysContacts` is also indexed by that ID.
- The reset endpoint in `backend/src/controllers/WhatsAppSessionController.ts`
  clears credentials and keys but does not clear Baileys contacts, the QR retry
  counter, capture tokens, or pending reconnects.
- `backend/src/libs/wbot.ts` keeps sockets and QR retries in memory by connection
  ID. Asynchronous writes and callbacks can outlive a reset.
- `StartAllWhatsAppsSessions` launches starts with `forEach` and does not await
  them. `StartWhatsAppSession` waits for the socket to open, so waiting for that
  entire operation during startup could block on a QR scan.
- `PUT /whatsappsession/:whatsappId` attempts to clear `session` through
  `UpdateWhatsAppService`, but that service converts an empty string to
  `undefined`.

## Required invariants

1. A connection has at most one active Baileys session. Every session has an
   immutable identity, belongs to exactly one connection, and is never reused
   after reset.
2. Credentials, keys and Baileys contact-cache rows are read and written using
   the session identity, not only the connection ID.
3. Reset atomically switches the active identity to a new empty session.
   Old-session work cannot change the new session, connection status, QR code,
   socket registration or capture state.
4. Temporary network disconnects and graceful shutdown preserve the active
   session for reconnection. Explicit reset replaces it.
5. Conversion is automatic, transactional, idempotent and safe if interrupted or
   attempted concurrently. A failed conversion does not start that connection
   or discard legacy data.
6. Never log or expose authentication credentials, key material, capture tokens
   or QR payloads as part of migration or cleanup diagnostics.

## Implementation

### 1. Session persistence and schema

- Add a Baileys session model with an immutable ID, connection ownership and
  serialized credentials. Add an active-session reference to `Whatsapp`.
- Scope Signal keys and Baileys contacts to the session ID, with appropriate
  foreign keys, indexes and uniqueness constraints. Enforce that the active
  session belongs to its connection.
- Keep connection identity and application-owned data unchanged. Do not clear
  shared company contacts, tickets, messages, LID mappings or shared caches as
  a substitute for clearing session data.
- Add Sequelize migrations and model registration. Ensure schema migrations run
  before conversion on each supported deployment path; the backend Dockerfile
  already runs Sequelize migrations before starting the server.
- Define safe cleanup of retired sessions, including retry and logging on
  failure. Do not retain obsolete credentials indefinitely. A rollback must not
  silently discard credentials or keys: either provide a verified reverse
  migration or explicitly refuse an unsafe downgrade.

### 2. Automatic legacy conversion

- Add a conversion service used by every Baileys start path, including startup,
  explicit starts and imports. Lock the connection row in a database transaction.
- If an active session already exists, use it. Otherwise create one and transfer
  `Whatsapp.session`, its `BaileysKeys` and `BaileysContacts` rows.
- Preserve the serialized credentials and binary key values using the existing
  `BufferJSON` representation. Account for legacy session JSON containing
  embedded keys; verify the historical format and define precedence when a key
  is also present in `BaileysKeys`. Fail visibly on malformed or conflicting
  data rather than silently creating a fresh session.
- Attach the new session and remove or clear legacy copies only after all data
  is transferred within the same transaction. An unpaired connection receives
  an empty session. A transaction failure leaves the old state available for
  retry.
- Coordinate concurrent processes using database-level locking or equivalent
  cross-process fencing; an in-memory mutex alone is insufficient. Prevent an
  older backend version from writing legacy state during or after conversion.
  Conversion itself must be automatic, but a mixed-version deployment must be
  safely gated rather than assumed safe.
- Await conversion before initiating each socket, without waiting for a user to
  scan a QR code before the server can finish starting. Surface per-connection
  failures and keep unrelated connections startable.

### 3. Reset and socket lifecycle

- Serialize start, reset, logout and import operations per connection, including
  across processes where applicable. Fence operations with the active session
  identity; use atomic conditional database writes or locking instead of a
  check followed by an unguarded write.
- On reset, cancel pending reconnect and delayed import starts, invalidate
  capture tokens, retire the old session and attach a new empty session in an
  atomic transition. Clear session-specific QR retries and connection QR/status.
  Preserve the existing endpoint behavior: reset does not itself need to start
  QR generation; the subsequent start must use the new session.
- Close the old socket and detach listeners. Track sockets from initialization,
  not only after the first QR or open event. Ensure an old close callback
  cannot remove a newer socket.
- Scope auth reads/writes, QR counters, contact-cache updates and capture tokens
  to the session identity. Reject stale connection updates, status changes,
  reconnect timers and imports. Handle already-running asynchronous callbacks
  and writes, not just future event emissions.
- Ensure session-owned data remains isolated even if an old write completes
  after reset. Track or drain in-flight work and handle cleanup failures
  explicitly; do not make a reset success response imply cleanup that failed.
- Treat logout and temporary connection loss separately. Correct the existing
  `403` path so it cannot also fall through to the ordinary reconnect branch.
  Preserve normal automatic reconnection and graceful shutdown behavior.
- A local reset cannot undo a network request already sent or guarantee remote
  linked-device revocation. Preserve current reset semantics; explicit logout
  remains responsible for requesting revocation from WhatsApp.

### 4. Update dependent paths

- Update `backend/src/helpers/authState.ts`, `backend/src/libs/wbot.ts`, the
  Baileys contact services, `wbotMonitor`, and contact import to use session
  identity.
- Update `StartWhatsAppSession`, `StartAllWhatsAppsSessions`, session
  controller endpoints, and connection deletion. Preserve connection IDs,
  permissions, status notifications and existing non-WhatsApp channel behavior.
- Update `ImportWhatsAppSessionService` and passkey capture so imports target
  the intended active session atomically. Invalidate old tokens and ensure a
  delayed import cannot overwrite a session created by a later reset.
- Review `Whatsapp.session` reads, writes and API serialization for compatibility.
  Avoid returning new credential fields in connection responses or socket
  events. Update related documentation and translations only where the
  resulting API or UI behavior requires them.

## Validation and acceptance

- Add focused, locally runnable unit tests for pure migration and lifecycle
  decision logic, including legacy embedded-key handling and stale-session
  fencing. Do not add tests requiring database access or external APIs, and do
  not modify existing tests unless explicitly requested.
- Run backend ESLint with `--fix` only on functionally changed backend files,
  the existing Jest tests, and the backend build/type-check.
- Manually verify with isolated local infrastructure:
  - Existing paired connection converts on startup and reconnects without a QR.
  - Unpaired, already-converted and malformed legacy records behave as
    specified; failed or interrupted conversion is retryable without data loss.
  - Two concurrent conversion attempts produce one active session.
  - Reset followed by scan uses fresh credentials, keys, contact cache and QR
    retry state, while retaining connection settings and tickets.
  - A delayed old auth write, socket event, reconnect or capture import cannot
    affect the new session. Test repeated reset and concurrent starts.
  - Temporary disconnect and server restart reuse the active session; phone
    logout, local logout, QR expiry and `403` take the intended paths.
  - Passkey import, contact import, deletion and both single-process and
    worker-backed Baileys sockets still work.
- Record any unavailable manual checks and deployment limitations explicitly;
  passing pure unit tests alone does not establish database or WhatsApp
  integration correctness.
