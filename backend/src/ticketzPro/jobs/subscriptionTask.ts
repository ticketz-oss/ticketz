import Bull from "bull";
import { SubscriptionService } from "../services/subscriptionService";
import { logger } from "../../utils/logger";

const connection = process.env.REDIS_URI || "redis://127.0.0.1:6379";

const subscriptionTaskQueue = new Bull("subscription-task", connection);

subscriptionTaskQueue.process(async _job => {
  const subscriptionService = SubscriptionService.getInstance();

  // random number of milliseconds between 0 and 5 minuts
  const waitTimer = Math.floor(Math.random() * 300000);
  logger.debug(
    `Waiting ${waitTimer / 1000} seconds before executing daily task`
  );

  setTimeout(async () => {
    subscriptionService.executeDailyTask().then(
      () => {
        logger.debug("Daily task executed successfully");
      },
      err => {
        logger.error("Error while executing daily task", err);
      }
    );
  }, waitTimer);
});

subscriptionTaskQueue.getRepeatableJobs().then(jobs => {
  // remove any job if exists
  jobs.forEach(async job => {
    await subscriptionTaskQueue.removeRepeatableByKey(job.key);
  });

  // check everyday 6 a.m.
  subscriptionTaskQueue.add(
    {},
    {
      repeat: { cron: "0 6 * * *" },
      removeOnComplete: true
    }
  );
});

const recheckQueue = new Bull("recheck-task", connection);

recheckQueue.process(async _job => {
  const subscriptionService = SubscriptionService.getInstance();
  await subscriptionService.executeDailyTask();

  if (subscriptionService.isValid()) {
    await subscriptionService.cancelRechecks();
  }
});

recheckQueue.getRepeatableJobs().then(jobs => {
  // remove any job if exists
  jobs.forEach(async job => {
    await recheckQueue.removeRepeatableByKey(job.key);
  });
});

export { subscriptionTaskQueue, recheckQueue };
