import { clearRepeatableJobsFromQueues } from "../../queues/repeatableJobs";

describe("clearRepeatableJobsFromQueues", () => {
  it("removes every repeatable job from every queue", async () => {
    const queueA = {
      getRepeatableJobs: jest
        .fn()
        .mockResolvedValue([{ key: "a-1" }, { key: "a-2" }]),
      removeRepeatableByKey: jest.fn().mockResolvedValue(undefined)
    };

    const queueB = {
      getRepeatableJobs: jest.fn().mockResolvedValue([{ key: "b-1" }]),
      removeRepeatableByKey: jest.fn().mockResolvedValue(undefined)
    };

    await clearRepeatableJobsFromQueues([
      { name: "QueueA", queue: queueA },
      { name: "QueueB", queue: queueB }
    ]);

    expect(queueA.getRepeatableJobs).toHaveBeenCalledTimes(1);
    expect(queueA.removeRepeatableByKey).toHaveBeenCalledTimes(2);
    expect(queueA.removeRepeatableByKey).toHaveBeenNthCalledWith(1, "a-1");
    expect(queueA.removeRepeatableByKey).toHaveBeenNthCalledWith(2, "a-2");

    expect(queueB.getRepeatableJobs).toHaveBeenCalledTimes(1);
    expect(queueB.removeRepeatableByKey).toHaveBeenCalledTimes(1);
    expect(queueB.removeRepeatableByKey).toHaveBeenCalledWith("b-1");
  });

  it("skips queues without repeatable jobs", async () => {
    const queue = {
      getRepeatableJobs: jest.fn().mockResolvedValue([]),
      removeRepeatableByKey: jest.fn().mockResolvedValue(undefined)
    };

    await clearRepeatableJobsFromQueues([{ name: "Queue", queue }]);

    expect(queue.getRepeatableJobs).toHaveBeenCalledTimes(1);
    expect(queue.removeRepeatableByKey).not.toHaveBeenCalled();
  });
});
