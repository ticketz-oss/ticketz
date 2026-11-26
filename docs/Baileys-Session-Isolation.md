# Baileys session isolation

The backend must run the Sequelize migrations before starting. Run only one
backend process against the database, and stop it before upgrading or
downgrading the application.

On startup or connection start, WhatsApp connections migrate legacy credentials,
keys, and Baileys contacts into a connection-owned session. Other channels are
not converted. A conversion error leaves the legacy data intact and prevents
that connection from starting. Reset creates a new session and retains the
connection, tickets, settings, and application contacts.
User-triggered reset is rejected while a connection start is pending.

After running an older application version, a newly created legacy session takes
precedence when the updated backend starts again. The previously active
isolated session is retained. Do not run old and updated backends concurrently.

The migration can be rolled back after stopping the backend. Downgrade removes
the new foreign key, column, and tables without restoring session data. Active
credentials, Signal keys, and Baileys contact snapshots are discarded; WhatsApp
connections must be paired again. Application contacts are unaffected.

Retired sessions are deleted after reset. Cleanup errors are reported and
retried; a reset response does not report success until cleanup succeeds.
Deleting a session still referenced as active cascades to its WhatsApp
connection; retired-session cleanup only deletes sessions after the active
reference has moved.
