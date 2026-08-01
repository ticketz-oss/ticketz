import { Sequelize } from "sequelize-typescript";
import { logger } from "../utils/logger";
import { SlowEventCounter } from "./slowEventCounter";

/**
 * Minimal structural type for the Sequelize connection pool (sequelize-pool).
 * The pool is a plain class (not an EventEmitter), so we wrap its acquire and
 * release methods to measure wait/hold times.
 */
interface PoolClient {
  processID?: number;
  __acquireRequestedAt?: number;
}

interface Pool {
  acquire: (...args: unknown[]) => Promise<PoolClient>;
  release: (client: PoolClient) => void;
  size: number;
  available: number;
}

/**
 * Rolling counter for queries that waited for a connection. The summary is
 * emitted by the every-minute cron in queues.ts via flushSlowWaitCounter().
 */
export const slowWaitCounter = new SlowEventCounter({
  label: "queries waited for a connection",
  thresholdMs: 50
});

/**
 * Flush the slow-wait counter, logging a summary if any events accumulated
 * since the last flush. Called by the every-minute cron.
 */
export const flushSlowWaitCounter = (): void => {
  slowWaitCounter.flush();
};

/**
 * Instrument the Sequelize connection pool to measure and log how long
 * queries wait for a free connection (pool wait time) and how long they
 * actually take to execute on Postgres (query execution time).
 *
 * The instrumentation is cheap (a couple of Date.now() calls per query), so
 * it is always enabled. Logging is intentionally quiet:
 *   - trace: per-query pool wait and hold times (silent by default)
 *   - warn: only when a connection was held >5s
 *   - info/warn: a rolling summary of queries that waited for a connection,
 *           emitted by the every-minute cron via flushSlowWaitCounter()
 */
export const initPoolMonitor = (sequelize: Sequelize): void => {
  const pool = (
    sequelize as unknown as {
      connectionManager: { pool?: Pool };
    }
  ).connectionManager?.pool;

  if (!pool) {
    logger.warn("poolMonitor: connection pool not available, skipping");
    return;
  }

  // Wrap acquire() to measure how long each query waits for a connection.
  // acquire() resolves with the client once a connection is available, so the
  // wait time is the time from call to resolution.
  const originalAcquire = pool.acquire.bind(pool);
  pool.acquire = async (...args: unknown[]) => {
    const requestedAt = Date.now();
    const client = await originalAcquire(...args);
    const waitMs = Date.now() - requestedAt;
    client.__acquireRequestedAt = requestedAt;

    logger.trace(
      { waitMs, pid: client?.processID },
      "poolMonitor: connection acquired"
    );

    slowWaitCounter.record(waitMs);

    return client;
  };

  // Wrap release() to measure how long a connection was held (checked out).
  const originalRelease = pool.release.bind(pool);
  pool.release = (client: PoolClient) => {
    const heldMs = Date.now() - (client?.__acquireRequestedAt || 0);
    logger.trace(
      { heldMs, pid: client?.processID },
      "poolMonitor: connection released"
    );
    if (heldMs > 5000) {
      logger.warn(
        { heldMs, pid: client?.processID },
        "poolMonitor: connection held for a long time"
      );
    }
    return originalRelease(client);
  };

  logger.debug("poolMonitor: enabled");
};
