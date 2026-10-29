import { Logger } from "pino";

/**
 * A simple object cache with a time-to-live (TTL) for each key
 */
export class SimpleObjectCache<T = unknown> {
  private ttl: number;

  private logger: Logger;

  private cache: Map<string, { value: T; timer: NodeJS.Timeout }>;

  /**
   * @param ttl Time to live in milliseconds
   * @param logger
   */
  constructor(ttl: number, logger: Logger = null) {
    this.ttl = ttl;
    this.logger = logger;
    this.cache = new Map();
  }

  /**
   * Set a key-value pair in the cache
   * @param key
   * @param value
   * @returns void
   * @example cache.set('foo', 'bar');
   * @example cache.set('foo', { bar: 'baz' });
   */
  set(key: string, value: T) {
    this.remove(key);

    // Set a new timer
    const timer = setTimeout(() => {
      this.cache.delete(key);
      this.logger?.debug(`Cache key ${key} was expired`);
    }, this.ttl);

    // Store the value and the timer in the cache
    this.cache.set(key, { value, timer });
    this.logger?.debug(`Cache key ${key} was saved`);
  }

  /**
   * Remove a key from the cache
   * @param key
   * @returns void
   */
  remove(key: string) {
    const data = this.cache.get(key);
    if (data) {
      clearTimeout(data.timer);
      this.cache.delete(key);
      this.logger?.debug(`Cache key ${key} was removed`);
    }
  }

  /**
   * Get a value from the cache
   * @param key
   * @returns The value stored in the cache
   * @example cache.get('foo');
   */
  get(key: string) {
    const data = this.cache.get(key);
    if (!data) {
      return null;
    }

    this.logger?.debug(`Cache key ${key} was accessed`);
    return data.value;
  }
}
