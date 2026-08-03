import { logger } from "../utils/logger";

/**
 * Accumulator for slow events (e.g. queries that waited for a connection).
 *
 * Events are recorded with `record()` and the accumulated summary is emitted
 * with `flush()`. The caller is responsible for calling `flush()` on a fixed
 * schedule (e.g. the existing every-minute cron in queues.ts), which logs the
 * summary and resets the accumulator.
 *
 * Only a count, min, max and a running average are kept (no array of values
 * and no running sum), so memory usage is constant regardless of how many
 * events are recorded.
 *
 * The summary includes the count since the last flush plus min/avg/max of the
 * recorded values (e.g. wait times in ms). It is logged at `info` when the
 * worst value (max) is below 1s, and at `warn` when it is >= 1s.
 *
 * Example log line:
 *   "poolMonitor: 5 queries waited for a connection. 51/75/120ms (min/avg/max), threshold 50ms"
 */
export class SlowEventCounter {
  private readonly label: string;

  private readonly thresholdMs: number;

  private count = 0;

  private min: number | null = null;

  private max: number | null = null;

  private avg = 0;

  constructor(options: { label: string; thresholdMs: number }) {
    this.label = options.label;
    this.thresholdMs = options.thresholdMs;
  }

  /**
   * Record an event with an associated value (e.g. wait time in ms).
   */
  record(valueMs: number): void {
    this.count += 1;
    // Incremental running average: newAvg = oldAvg + (value - oldAvg) / count
    this.avg += (valueMs - this.avg) / this.count;
    if (this.min === null || valueMs < this.min) {
      this.min = valueMs;
    }
    if (this.max === null || valueMs > this.max) {
      this.max = valueMs;
    }
  }

  /**
   * Emit a summary of the events accumulated since the last flush, then reset.
   * Returns true if a summary was logged (i.e. there was at least one event).
   */
  flush(): boolean {
    if (this.count === 0) {
      return false;
    }

    const min = this.min as number;
    const max = this.max as number;
    const avg = Math.round(this.avg);
    const level = max >= 1000 ? "warn" : "info";

    logger[level](
      {
        count: this.count,
        min,
        avg,
        max,
        thresholdMs: this.thresholdMs
      },
      `poolMonitor: ${this.count} ${this.label}. ${min}/${avg}/${max}ms (min/avg/max), threshold ${this.thresholdMs}ms`
    );

    this.count = 0;
    this.min = null;
    this.max = null;
    this.avg = 0;
    return true;
  }
}
