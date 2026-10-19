import Queue, { Job } from "bull";
import { Op } from "sequelize";
import AppError from "../../../errors/AppError";
import Whatsapp from "../../../models/Whatsapp";
import WhatsappStatusPost from "../../../models/WhatsappStatusPost";
import {
  enqueueStatusPost,
  handlePublishStatus,
  removeStatusJob,
  startWhatsappStatusQueue
} from "../../../queues/whatsappStatus";
import { getStatusProvider } from "../providers";
import { StatusPublishError } from "../providers/types";
import { resolveAudienceJids } from "../StatusAudienceService";
import { isStatusEnabled } from "../StatusFeatureService";
import {
  cleanupOrphanStatusMedia,
  removeStatusMedia
} from "../StatusMediaService";
import { emitStatusPost } from "../StatusSocket";

jest.mock("bull", () => {
  const queue = {
    add: jest.fn(),
    process: jest.fn(),
    getJob: jest.fn()
  };
  return jest.fn(() => queue);
});
jest.mock("../../../models/WhatsappStatusPost", () => ({
  __esModule: true,
  default: { findByPk: jest.fn(), findAll: jest.fn(), update: jest.fn() }
}));
jest.mock("../../../models/Whatsapp", () => ({
  __esModule: true,
  default: { findOne: jest.fn() }
}));
jest.mock("../../../models/User", () => ({ __esModule: true, default: {} }));
jest.mock("../providers", () => ({ getStatusProvider: jest.fn() }));
jest.mock("../StatusAudienceService", () => ({
  resolveAudienceJids: jest.fn()
}));
jest.mock("../StatusFeatureService", () => ({ isStatusEnabled: jest.fn() }));
jest.mock("../StatusMediaService", () => ({
  cleanupOrphanStatusMedia: jest.fn(),
  removeStatusMedia: jest.fn()
}));
jest.mock("../StatusSocket", () => ({ emitStatusPost: jest.fn() }));

// Bull is created once on import; keep its instance before clearMocks runs.
const queue = (Queue as unknown as jest.Mock).mock.results[0].value as {
  add: jest.Mock;
  process: jest.Mock;
  getJob: jest.Mock;
};

const NOW = new Date("2026-10-19T12:00:00Z");
const AUDIENCE = ["5568911111111@s.whatsapp.net"];

const makePost = (fields: Record<string, unknown> = {}) => {
  const post: Record<string, unknown> = {
    id: 5,
    companyId: 7,
    whatsappId: 11,
    kind: "text",
    body: "Oi",
    audienceMode: "connection_contacts",
    contactListId: null,
    scheduledAt: null,
    state: "queued",
    attemptStartedAt: null,
    remoteMessageId: null,
    failureCode: null,
    ...fields
  };
  post.set = jest.fn((patch: Record<string, unknown>) =>
    Object.assign(post, patch)
  );
  post.update = jest.fn(async (patch: Record<string, unknown>) =>
    Object.assign(post, patch)
  );
  return post as never as WhatsappStatusPost & { update: jest.Mock };
};

const job = (postId = 5, attemptsMade = 0) =>
  ({ data: { postId }, attemptsMade, opts: { attempts: 3 } }) as Job<{
    postId: number;
  }>;

const capabilities = (overrides = {}) => ({
  publishStatus: true,
  kinds: ["text", "image", "video"],
  reason: null,
  manualExport: false,
  ownPostsSync: false,
  ...overrides
});

const mockProvider = (caps = capabilities()) => {
  const provider = {
    capabilities: jest.fn(() => caps),
    publish: jest.fn().mockResolvedValue({ remoteMessageId: "3EB0ABC" })
  };
  (getStatusProvider as jest.Mock).mockReturnValue(provider);
  return provider;
};

const AUTHOR = { id: 2, name: "Ana" };

// Like Sequelize, the author is only present when the query includes it.
const withAuthor = (
  options: { include?: { as?: string }[] } | undefined,
  fields: Record<string, unknown> = {}
) =>
  makePost({
    ...fields,
    ...(options?.include?.some(include => include.as === "createdBy")
      ? { createdBy: AUTHOR }
      : {})
  });

const lastEmitted = () => {
  const { calls } = (emitStatusPost as jest.Mock).mock;
  return calls[calls.length - 1][2];
};

const usePost = (post: WhatsappStatusPost) =>
  (WhatsappStatusPost.findByPk as jest.Mock).mockResolvedValue(post);

beforeEach(() => {
  jest.useFakeTimers().setSystemTime(NOW);
  (isStatusEnabled as jest.Mock).mockResolvedValue(true);
  (Whatsapp.findOne as jest.Mock).mockResolvedValue({
    id: 11,
    companyId: 7,
    apiMode: "baileys",
    status: "CONNECTED"
  });
  (WhatsappStatusPost.update as jest.Mock).mockResolvedValue([1]);
  (resolveAudienceJids as jest.Mock).mockResolvedValue(AUDIENCE);
  queue.getJob.mockResolvedValue(null);
  mockProvider();
});

afterEach(() => {
  jest.useRealTimers();
});

describe("handlePublishStatus", () => {
  it("publishes a queued post and stores remoteMessageId, publishedAt and expiresAt = +24h", async () => {
    const post = makePost();
    usePost(post);
    const provider = mockProvider();

    await handlePublishStatus(job());

    expect(Whatsapp.findOne).toHaveBeenCalledWith({
      where: { id: 11, companyId: 7 }
    });
    expect(resolveAudienceJids).toHaveBeenCalledWith({
      companyId: 7,
      whatsappId: 11,
      audienceMode: "connection_contacts",
      contactListId: null
    });
    // The claim is conditional, so a concurrent cancel wins.
    expect(WhatsappStatusPost.update).toHaveBeenCalledWith(
      { state: "publishing", attemptStartedAt: NOW },
      { where: { id: 5, state: "queued", attemptStartedAt: null } }
    );
    expect(provider.publish).toHaveBeenCalledWith(
      post,
      expect.objectContaining({ id: 11 }),
      AUDIENCE
    );
    expect(post.update).toHaveBeenLastCalledWith({
      state: "published",
      remoteMessageId: "3EB0ABC",
      publishedAt: NOW,
      expiresAt: new Date(NOW.getTime() + 24 * 3600 * 1000),
      failureCode: null
    });
    expect(emitStatusPost).toHaveBeenCalledTimes(2);
    expect(emitStatusPost).toHaveBeenLastCalledWith(7, "update", post);
  });

  it("keeps a published video available for 24 hours and schedules its expiry", async () => {
    const mediaPath = "whatsapp-status/7/video.mp4";
    const post = makePost({ kind: "video", mediaPath });
    usePost(post);
    const provider = mockProvider();

    await handlePublishStatus(job());

    expect(provider.publish).toHaveBeenCalledWith(
      post,
      expect.objectContaining({ id: 11 }),
      AUDIENCE
    );
    expect(post.state).toBe("published");
    expect(post.mediaPath).toBe(mediaPath);
    expect(removeStatusMedia).not.toHaveBeenCalled();
    expect(queue.add).toHaveBeenCalledWith(
      "ExpireMedia",
      { postId: 5 },
      expect.objectContaining({
        jobId: "status-media-expire-5",
        delay: 24 * 3600 * 1000
      })
    );
    expect(provider.publish.mock.invocationCallOrder[0]).toBeLessThan(
      post.update.mock.invocationCallOrder[0]
    );
    expect(post.update.mock.invocationCallOrder[0]).toBeLessThan(
      queue.add.mock.invocationCallOrder[0]
    );
  });

  it("retains media when WhatsApp does not confirm the send", async () => {
    const mediaPath = "whatsapp-status/7/video.mp4";
    const post = makePost({ kind: "video", mediaPath });
    usePost(post);
    mockProvider().publish.mockRejectedValue(
      new StatusPublishError("ERR_STATUS_NO_CONFIRMATION", true)
    );

    await handlePublishStatus(job());

    expect(post.state).toBe("failed");
    expect(post.mediaPath).toBe(mediaPath);
    expect(removeStatusMedia).not.toHaveBeenCalled();
  });

  it("emits a published post with its author (createdBy)", async () => {
    (WhatsappStatusPost.findByPk as jest.Mock).mockImplementation(
      async (_id: number, options) => withAuthor(options)
    );

    await handlePublishStatus(job());

    expect(lastEmitted().state).toBe("published");
    expect(lastEmitted().createdBy).toEqual(AUTHOR);
  });

  it("never resends a post that was already handed to the session (ERR_STATUS_OUTCOME_UNKNOWN)", async () => {
    // Job repeated after the worker died between sendMessage and saving.
    const post = makePost({
      state: "publishing",
      attemptStartedAt: new Date(NOW.getTime() - 60000)
    });
    usePost(post);
    const provider = mockProvider();

    await expect(handlePublishStatus(job(5, 1))).resolves.toBeUndefined();

    expect(provider.publish).not.toHaveBeenCalled();
    expect(post.state).toBe("failed");
    expect(post.failureCode).toBe("ERR_STATUS_OUTCOME_UNKNOWN");
    expect(emitStatusPost).toHaveBeenCalledWith(7, "update", post);
  });

  it("marks ERR_STATUS_OUTCOME_UNKNOWN without retry when the send itself throws", async () => {
    const post = makePost();
    usePost(post);
    mockProvider().publish.mockRejectedValue(new Error("Timed Out"));

    await expect(handlePublishStatus(job())).resolves.toBeUndefined();

    expect(post.state).toBe("failed");
    expect(post.failureCode).toBe("ERR_STATUS_OUTCOME_UNKNOWN");
  });

  it("keeps the code of a permanent provider error", async () => {
    const post = makePost();
    usePost(post);
    mockProvider().publish.mockRejectedValue(
      new StatusPublishError("ERR_STATUS_NO_CONFIRMATION", true)
    );

    await expect(handlePublishStatus(job())).resolves.toBeUndefined();

    expect(post.state).toBe("failed");
    expect(post.failureCode).toBe("ERR_STATUS_NO_CONFIRMATION");
  });

  it("skips posts that are gone or no longer queued", async () => {
    const provider = mockProvider();
    (WhatsappStatusPost.findByPk as jest.Mock).mockResolvedValue(null);
    await handlePublishStatus(job());
    usePost(makePost({ state: "cancelled" }));
    await handlePublishStatus(job());
    expect(provider.publish).not.toHaveBeenCalled();
    expect(emitStatusPost).not.toHaveBeenCalled();
  });

  it("does not publish when the post was cancelled before the claim", async () => {
    const post = makePost();
    usePost(post);
    const provider = mockProvider();
    (WhatsappStatusPost.update as jest.Mock).mockResolvedValue([0]);

    await handlePublishStatus(job());

    expect(provider.publish).not.toHaveBeenCalled();
    expect(post.update).not.toHaveBeenCalled();
  });

  it("cancels when the company feature was disabled after scheduling", async () => {
    const post = makePost({ scheduledAt: NOW });
    usePost(post);
    const provider = mockProvider();
    (isStatusEnabled as jest.Mock).mockResolvedValue(false);

    await handlePublishStatus(job());

    expect(isStatusEnabled).toHaveBeenCalledWith(7);
    expect(provider.publish).not.toHaveBeenCalled();
    expect(post.state).toBe("cancelled");
    expect(post.failureCode).toBe("ERR_STATUS_FEATURE_DISABLED");
    expect(emitStatusPost).toHaveBeenCalledWith(7, "update", post);
  });

  it("fails with ERR_STATUS_CONNECTION_MISMATCH when the connection now belongs to another company", async () => {
    const post = makePost();
    usePost(post);
    const provider = mockProvider();
    (Whatsapp.findOne as jest.Mock).mockResolvedValue(null);

    await expect(handlePublishStatus(job())).resolves.toBeUndefined();

    expect(Whatsapp.findOne).toHaveBeenCalledWith({
      where: { id: 11, companyId: 7 }
    });
    expect(provider.publish).not.toHaveBeenCalled();
    expect(post.state).toBe("failed");
    expect(post.failureCode).toBe("ERR_STATUS_CONNECTION_MISMATCH");
  });

  it("rethrows while disconnected so Bull retries, then fails on the last attempt", async () => {
    const post = makePost();
    usePost(post);
    const provider = mockProvider(
      capabilities({ publishStatus: false, reason: "DISCONNECTED" })
    );

    await expect(handlePublishStatus(job(5, 0))).rejects.toMatchObject({
      code: "ERR_STATUS_CONNECTION_UNAVAILABLE",
      permanent: false
    });
    expect(post.state).toBe("queued");

    await expect(handlePublishStatus(job(5, 2))).resolves.toBeUndefined();
    expect(post.state).toBe("failed");
    expect(post.failureCode).toBe("ERR_STATUS_CONNECTION_UNAVAILABLE");
    expect(provider.publish).not.toHaveBeenCalled();
  });

  it("returns a post to queued and retries when the session vanished before sending", async () => {
    const post = makePost();
    usePost(post);
    mockProvider().publish.mockRejectedValue(
      new StatusPublishError("ERR_STATUS_CONNECTION_UNAVAILABLE", false)
    );

    await expect(handlePublishStatus(job(5, 0))).rejects.toMatchObject({
      code: "ERR_STATUS_CONNECTION_UNAVAILABLE"
    });
    expect(post.update).toHaveBeenCalledWith({
      state: "queued",
      attemptStartedAt: null
    });
    expect(post.state).toBe("queued");
    expect(post.attemptStartedAt).toBeNull();
  });

  it("marks unsupported when the connection became official", async () => {
    const post = makePost();
    usePost(post);
    (Whatsapp.findOne as jest.Mock).mockResolvedValue({
      id: 11,
      companyId: 7,
      apiMode: "official"
    });
    const provider = mockProvider(
      capabilities({
        publishStatus: false,
        kinds: [],
        reason: "OFFICIAL_API",
        manualExport: true
      })
    );

    await handlePublishStatus(job());

    expect(provider.publish).not.toHaveBeenCalled();
    expect(resolveAudienceJids).not.toHaveBeenCalled();
    expect(post.state).toBe("unsupported");
    expect(post.failureCode).toBe("ERR_STATUS_OFFICIAL_API");
  });

  it("fails with the audience code when the audience is empty", async () => {
    const post = makePost();
    usePost(post);
    const provider = mockProvider();
    (resolveAudienceJids as jest.Mock).mockRejectedValue(
      new AppError("ERR_STATUS_AUDIENCE_EMPTY", 400)
    );

    await handlePublishStatus(job());

    expect(provider.publish).not.toHaveBeenCalled();
    expect(post.state).toBe("failed");
    expect(post.failureCode).toBe("ERR_STATUS_AUDIENCE_EMPTY");
  });

  it("serializes two posts of the same connection", async () => {
    const first = makePost({ id: 1 });
    const second = makePost({ id: 2 });
    (WhatsappStatusPost.findByPk as jest.Mock).mockImplementation(
      async (id: number) => (id === 1 ? first : second)
    );
    let releaseFirst: (value: { remoteMessageId: string }) => void;
    const provider = mockProvider();
    provider.publish.mockImplementation(post =>
      post.id === 1
        ? new Promise(resolve => {
            releaseFirst = resolve;
          })
        : Promise.resolve({ remoteMessageId: "SECOND" })
    );

    const one = handlePublishStatus(job(1));
    const two = handlePublishStatus(job(2));
    // Let both jobs reach the per-connection lock.
    for (let i = 0; i < 20; i += 1) {
      await Promise.resolve();
    }
    expect(provider.publish).toHaveBeenCalledTimes(1);
    expect(provider.publish.mock.calls[0][0]).toBe(first);

    releaseFirst({ remoteMessageId: "FIRST" });
    await Promise.all([one, two]);

    expect(provider.publish).toHaveBeenCalledTimes(2);
    expect(provider.publish.mock.calls[1][0]).toBe(second);
    expect(first.remoteMessageId).toBe("FIRST");
    expect(second.remoteMessageId).toBe("SECOND");
  });
});

describe("whatsappStatus queue", () => {
  it("uses jobId status-post-<id> and delay from scheduledAt", async () => {
    const scheduledAt = new Date(NOW.getTime() + 90 * 60 * 1000);
    await enqueueStatusPost(makePost({ id: 42, scheduledAt }));
    expect(queue.add).toHaveBeenCalledWith(
      "Publish",
      { postId: 42 },
      {
        jobId: "status-post-42",
        delay: 90 * 60 * 1000,
        attempts: 3,
        backoff: { type: "exponential", delay: 30000 },
        removeOnComplete: true
      }
    );

    await enqueueStatusPost(
      makePost({ id: 43, scheduledAt: new Date(NOW.getTime() - 1000) })
    );
    expect(queue.add).toHaveBeenLastCalledWith(
      "Publish",
      { postId: 43 },
      expect.objectContaining({ jobId: "status-post-43", delay: 0 })
    );
  });

  it("keeps a pending job and replaces a finished one with the same id", async () => {
    queue.getJob.mockResolvedValueOnce({
      isFailed: jest.fn().mockResolvedValue(false),
      isCompleted: jest.fn().mockResolvedValue(false)
    });
    await enqueueStatusPost(makePost({ id: 44 }));
    expect(queue.add).not.toHaveBeenCalled();

    const finished = {
      isFailed: jest.fn().mockResolvedValue(true),
      isCompleted: jest.fn().mockResolvedValue(false),
      remove: jest.fn()
    };
    queue.getJob.mockResolvedValueOnce(finished);
    await enqueueStatusPost(makePost({ id: 44 }));
    expect(finished.remove).toHaveBeenCalled();
    expect(queue.add).toHaveBeenCalledTimes(1);
  });

  it("removes a job by post id", async () => {
    const pending = { remove: jest.fn() };
    queue.getJob.mockResolvedValueOnce(pending);
    await removeStatusJob(42);
    expect(queue.getJob).toHaveBeenCalledWith("status-post-42");
    expect(pending.remove).toHaveBeenCalled();
    await expect(removeStatusJob(43)).resolves.toBeUndefined();
  });

  it("requeues queued posts without a job on startup", async () => {
    const orphan = makePost({ id: 1, state: "queued" });
    const withJob = makePost({ id: 2, state: "queued" });
    const lostSend = makePost({
      id: 3,
      state: "publishing",
      attemptStartedAt: NOW
    });
    (WhatsappStatusPost.findAll as jest.Mock).mockResolvedValue([
      orphan,
      withJob,
      lostSend
    ]);
    queue.getJob.mockImplementation(async (jobId: string) =>
      jobId === "status-post-2"
        ? {
            isFailed: jest.fn().mockResolvedValue(false),
            isCompleted: jest.fn().mockResolvedValue(false)
          }
        : null
    );

    await startWhatsappStatusQueue();

    expect(queue.process).toHaveBeenCalledWith(
      "Publish",
      4,
      handlePublishStatus
    );
    expect(queue.process).toHaveBeenCalledWith(
      "Cleanup",
      1,
      expect.any(Function)
    );
    expect(queue.process).toHaveBeenCalledWith(
      "ExpireMedia",
      1,
      expect.any(Function)
    );
    expect(queue.add).toHaveBeenCalledWith(
      "Cleanup",
      {},
      expect.objectContaining({ repeat: { cron: "0 * * * *" } })
    );
    expect(WhatsappStatusPost.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { state: { [Op.in]: ["queued", "publishing"] } }
      })
    );
    const publishAdds = queue.add.mock.calls.filter(
      call => call[0] === "Publish"
    );
    expect(publishAdds).toEqual([
      [
        "Publish",
        { postId: 1 },
        expect.objectContaining({ jobId: "status-post-1" })
      ]
    ]);
    // A send whose job vanished is never retried blindly.
    expect(lostSend.state).toBe("failed");
    expect(lostSend.failureCode).toBe("ERR_STATUS_OUTCOME_UNKNOWN");

    const cleanup = queue.process.mock.calls.find(
      call => call[0] === "Cleanup"
    )[2];
    await cleanup();
    expect(cleanupOrphanStatusMedia).toHaveBeenCalled();
  });

  it("removes published media when its 24-hour window ends", async () => {
    const mediaPath = "whatsapp-status/7/video.mp4";
    const published = makePost({
      state: "published",
      kind: "video",
      mediaPath,
      expiresAt: new Date(NOW.getTime() + 24 * 3600 * 1000)
    });
    (WhatsappStatusPost.findAll as jest.Mock).mockResolvedValue([]);
    usePost(published);
    await startWhatsappStatusQueue();
    const expireMedia = queue.process.mock.calls.find(
      call => call[0] === "ExpireMedia"
    )[2];

    await expireMedia(job());
    expect(removeStatusMedia).not.toHaveBeenCalled();
    expect(published.mediaPath).toBe(mediaPath);

    jest.setSystemTime(new Date(NOW.getTime() + 24 * 3600 * 1000));
    await expireMedia(job());
    expect(removeStatusMedia).toHaveBeenCalledWith(7, mediaPath);
    expect(published.mediaPath).toBeNull();
    expect(emitStatusPost).toHaveBeenCalledWith(7, "update", published);
  });

  it("fails a publishing post whose job ended failed (stalled) without resending", async () => {
    const stalled = makePost({
      id: 4,
      state: "publishing",
      attemptStartedAt: NOW
    });
    (WhatsappStatusPost.findAll as jest.Mock).mockResolvedValue([stalled]);
    const failedJob = {
      isFailed: jest.fn().mockResolvedValue(true),
      isCompleted: jest.fn().mockResolvedValue(false),
      remove: jest.fn()
    };
    queue.getJob.mockResolvedValue(failedJob);
    const provider = mockProvider();

    await startWhatsappStatusQueue();

    expect(stalled.state).toBe("failed");
    expect(stalled.failureCode).toBe("ERR_STATUS_OUTCOME_UNKNOWN");
    expect(emitStatusPost).toHaveBeenCalledWith(7, "update", stalled);
    expect(provider.publish).not.toHaveBeenCalled();
    expect(queue.add.mock.calls.filter(call => call[0] === "Publish")).toEqual(
      []
    );
  });

  it("leaves a publishing post alone while its job is still pending", async () => {
    const running = makePost({
      id: 6,
      state: "publishing",
      attemptStartedAt: NOW
    });
    (WhatsappStatusPost.findAll as jest.Mock).mockResolvedValue([running]);
    queue.getJob.mockResolvedValue({
      isFailed: jest.fn().mockResolvedValue(false),
      isCompleted: jest.fn().mockResolvedValue(false)
    });

    await startWhatsappStatusQueue();

    expect(running.state).toBe("publishing");
    expect(running.update).not.toHaveBeenCalled();
  });

  it("emits a recovered post with its author (createdBy)", async () => {
    (WhatsappStatusPost.findAll as jest.Mock).mockImplementation(
      async options => [
        withAuthor(options, {
          id: 3,
          state: "publishing",
          attemptStartedAt: NOW
        })
      ]
    );

    await startWhatsappStatusQueue();

    expect(lastEmitted().failureCode).toBe("ERR_STATUS_OUTCOME_UNKNOWN");
    expect(lastEmitted().createdBy).toEqual(AUTHOR);
  });

  it("limits startup recovery to companies of a dedicated runtime", async () => {
    process.env.TENANT_RUNTIME_COMPANY_ID = "7";
    process.env.QUEUE_PREFIX = "tenant7";
    (WhatsappStatusPost.findAll as jest.Mock).mockResolvedValue([]);
    try {
      await startWhatsappStatusQueue();
    } finally {
      delete process.env.TENANT_RUNTIME_COMPANY_ID;
      delete process.env.QUEUE_PREFIX;
    }
    expect(WhatsappStatusPost.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { state: { [Op.in]: ["queued", "publishing"] }, companyId: 7 }
      })
    );
  });
});
