import { logger } from "./logger";

/**
 * Holds the graceful shutdown trigger installed by server.ts.
 * The restart controller calls this instead of process.exit(0) so the
 * http-graceful-shutdown handler can finish in-flight work (WhatsApp
 * sessions, queue jobs, open requests) before the process exits.
 */
let shutdownTrigger: (() => Promise<void>) | null = null;

export function registerShutdownTrigger(trigger: () => Promise<void>): void {
  shutdownTrigger = trigger;
}

export async function triggerGracefulShutdown(): Promise<void> {
  if (shutdownTrigger) {
    await shutdownTrigger();
    return;
  }

  logger.warn(
    "Graceful shutdown trigger not registered; falling back to process.exit(0)."
  );
  process.exit(0);
}
