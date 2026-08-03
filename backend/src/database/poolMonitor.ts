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
  __lastQuery?: string;
  __lastQueryStartedAt?: number;
  __lastQueryFinishedAt?: number;
  __queryCount?: number;
}

interface Pool {
  acquire: (...args: unknown[]) => Promise<PoolClient>;
  release: (client: PoolClient) => void;
  size: number;
  available: number;
  using?: number;
  waiting?: number;
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
 * Rolling counter for query execution time on Postgres. Helps identify slow
 * queries even when pool wait times are low.
 */
const slowQueryCounter = new SlowEventCounter({
  label: "queries executed",
  thresholdMs: 1000
});

/**
 * Per-minute peak pool usage and query volume.
 */
let snapshotState = {
  maxUsing: 0,
  maxWaiting: 0,
  maxSize: 0,
  totalQueries: 0,
  slowReleases: 0,
  periodStart: Date.now()
};

/**
 * Threshold for warning about long-held connections. Most DB work in this
 * backend should complete in milliseconds; connections held for longer than
 * this value are likely contributing to tail latency even when average wait
 * times look healthy.
 */
const heldWarningThresholdMs = Math.max(
  100,
  Number(process.env.POOL_HELD_WARNING_MS) || 1000
);

/**
 * Extract a concise SQL signature for logging: table name + operation.
 */
const summarizeQuery = (sql: string | undefined): string => {
  if (!sql) return "unknown";
  const trimmed = sql.trim().toUpperCase();
  const op =
    trimmed.match(/^(SELECT|INSERT|UPDATE|DELETE|WITH)/)?.[0] || "OTHER";
  const table =
    trimmed.match(/(?:FROM|INTO|UPDATE|JOIN)\s+"?([A-Z_][A-Z0-9_]*)/)?.[1] ||
    "unknown";
  return `${op} ${table}`;
};

/**
 * Flush all pool-monitor counters and snapshots. Called by the every-minute
 * cron to emit aggregated per-minute diagnostics.
 */
export const flushPoolMonitor = (): void => {
  slowWaitCounter.flush();
  slowQueryCounter.flush();

  logger.info(
    {
      ...snapshotState,
      elapsedMs: Date.now() - snapshotState.periodStart
    },
    "poolMonitor: pool usage snapshot"
  );
  snapshotState = {
    maxUsing: 0,
    maxWaiting: 0,
    maxSize: 0,
    totalQueries: 0,
    slowReleases: 0,
    periodStart: Date.now()
  };
};

/**
 * Instrument the Sequelize connection pool to measure and log how long
 * queries wait for a free connection (pool wait time) and how long they
 * actually take to execute on Postgres (query execution time).
 *
 * The instrumentation is cheap (a couple of Date.now() calls per query), so
 * it is always enabled. Logging is intentionally quiet:
 *   - trace: per-query pool wait and hold times (silent by default)
 *   - warn: only when a connection was held longer than
 *           POOL_HELD_WARNING_MS (default 1s)
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

  // Wrap the underlying pg.Client.query to capture the SQL and execution
  // duration for every query run on this connection. This lets us distinguish
  // between slow Postgres queries and application-level delays that hold a
  // connection after the query finished.
  const instrumentClient = (client: PoolClient): void => {
    interface PgClientLike {
      query: (...args: unknown[]) => unknown;
    }

    const pgClient = client as unknown as PgClientLike;
    if (typeof pgClient.query !== "function") return;

    const originalQuery = pgClient.query.bind(pgClient);
    pgClient.query = (...queryArgs: unknown[]) => {
      const startedAt = Date.now();
      client.__lastQueryStartedAt = startedAt;
      client.__lastQuery =
        typeof queryArgs[0] === "string"
          ? queryArgs[0]
          : (queryArgs[0] as { text?: string })?.text;
      client.__queryCount = (client.__queryCount || 0) + 1;

      const finalize = () => {
        client.__lastQueryFinishedAt = Date.now();
        const executeMs = client.__lastQueryFinishedAt - startedAt;
        slowQueryCounter.record(executeMs);
      };

      try {
        const result = originalQuery(...queryArgs);
        if (
          result &&
          typeof result === "object" &&
          "then" in result &&
          typeof (result as { then?: unknown }).then === "function"
        ) {
          (result as Promise<unknown>).then(finalize, finalize);
        } else {
          finalize();
        }
        return result;
      } catch (err) {
        finalize();
        throw err;
      }
    };
  };

  // Wrap acquire() to measure how long each query waits for a connection and
  // instrument the client for per-query tracking.
  const originalAcquire = pool.acquire.bind(pool);
  pool.acquire = async (...args: unknown[]) => {
    const requestedAt = Date.now();
    const client = await originalAcquire(...args);
    const waitMs = Date.now() - requestedAt;
    client.__acquireRequestedAt = requestedAt;
    client.__queryCount = 0;
    instrumentClient(client);

    snapshotState.maxUsing = Math.max(snapshotState.maxUsing, pool.using || 0);
    snapshotState.maxWaiting = Math.max(
      snapshotState.maxWaiting,
      pool.waiting || 0
    );
    snapshotState.maxSize = Math.max(snapshotState.maxSize, pool.size || 0);

    slowWaitCounter.record(waitMs);

    return client;
  };

  // Wrap release() to measure how long a connection was held (checked out).
  const originalRelease = pool.release.bind(pool);
  pool.release = (client: PoolClient) => {
    const now = Date.now();
    const heldMs = now - (client?.__acquireRequestedAt || now);
    const lastExecuteMs = client?.__lastQueryFinishedAt
      ? client.__lastQueryFinishedAt - (client.__lastQueryStartedAt || 0)
      : undefined;
    const idleAfterQueryMs = client?.__lastQueryFinishedAt
      ? now - client.__lastQueryFinishedAt
      : undefined;

    snapshotState.totalQueries += client?.__queryCount || 0;

    if (heldMs > heldWarningThresholdMs) {
      snapshotState.slowReleases += 1;
      logger.warn(
        {
          heldMs,
          executeMs: lastExecuteMs,
          idleAfterQueryMs,
          pid: client?.processID,
          queryCount: client?.__queryCount,
          lastQuery: client?.__lastQuery,
          querySummary: summarizeQuery(client?.__lastQuery),
          pool: {
            size: pool.size,
            available: pool.available,
            using: pool.using,
            waiting: pool.waiting
          }
        },
        `poolMonitor: connection held for ${heldMs}ms`
      );
    }

    return originalRelease(client);
  };

  logger.debug("poolMonitor: enabled");
};
