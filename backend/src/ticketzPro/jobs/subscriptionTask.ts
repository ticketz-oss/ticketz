import Bull from "bull";
import { SubscriptionService } from "../services/subscriptionService";

const connection = process.env.REDIS_URI || "redis://127.0.0.1:6379";

const subscriptionTaskQueue = new Bull("subscription-task", connection);

subscriptionTaskQueue.process(async _job => {
  const subscriptionService = SubscriptionService.getInstance();
  await subscriptionService.executeDailyTask();
});

// check everyday 6 a.m.
subscriptionTaskQueue.add({}, { repeat: { cron: "0 6 * * *" } });

const recheckQueue = new Bull("recheck-task", {
  redis: {
    host: "127.0.0.1",
    port: 6379
  }
});

recheckQueue.process(async _job => {
  const subscriptionService = SubscriptionService.getInstance();
  await subscriptionService.executeDailyTask();

  if (subscriptionService.getTaskResult()) {
    await subscriptionService.cancelRechecks();
  }
});

export { subscriptionTaskQueue, recheckQueue };
