# Baileys session isolation

The backend must run the Sequelize migrations before starting. Run only one
backend process against the database, and stop it before upgrading or
downgrading the application.

On startup or connection start, WhatsApp connections migrate legacy credentials,
keys, and Baileys contacts into a connection-owned session. Other channels are
not converted. A conversion error leaves the legacy data intact and prevents
that connection from starting. Reset creates a new session and retains the
connection, tickets, settings, and application contacts.

After running an older application version, a newly created legacy session takes
precedence when the updated backend starts again. The previously active
isolated session is retained. Do not run old and updated backends concurrently.

The schema migration cannot be rolled back automatically: rolling it back would
discard session credentials and keys. Restoring an older application version
without rolling back the schema does not restore its legacy credentials; it
must establish a new session.

Retired sessions are deleted after reset. Cleanup errors are reported and
retried; a reset response does not report success until cleanup succeeds.
