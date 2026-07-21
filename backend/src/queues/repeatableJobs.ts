import { logger } from "../utils/logger";

type RepeatableJobInfo = {
  key: string;
};

type RepeatableQueue = Pick<
  import("bull").Queue,
  "getRepeatableJobs" | "removeRepeatableByKey"
>;

export type RepeatableQueueEntry = {
  name: string;
  queue: RepeatableQueue;
};

export async function clearRepeatableJobsFromQueues(
  queues: RepeatableQueueEntry[]
): Promise<void> {
  await Promise.all(
    queues.map(async ({ name, queue }) => {
      try {
        const repeatableJobs =
          (await queue.getRepeatableJobs()) as RepeatableJobInfo[];

        if (!repeatableJobs.length) {
          return;
        }

        await Promise.all(
          repeatableJobs.map(async repeatableJob => {
            await queue.removeRepeatableByKey(repeatableJob.key);
          })
        );

        logger.info(
          { queue: name, count: repeatableJobs.length },
          "clearRepeatableJobsFromQueues: removed repeatable jobs"
        );
      } catch (err) {
        logger.warn(
          { err, queue: name },
          "clearRepeatableJobsFromQueues: failed to remove repeatable jobs"
        );
      }
    })
  );
}
