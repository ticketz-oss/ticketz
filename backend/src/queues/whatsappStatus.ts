import Queue, { Job } from "bull";
import { Mutex } from "async-mutex";
import { Op } from "sequelize";
import AppError from "../errors/AppError";
import {
  runtimeCompanyWhere,
  runtimeQueueOptions
} from "../helpers/tenantRuntime";
import User from "../models/User";
import Whatsapp from "../models/Whatsapp";
import WhatsappStatusPost, {
  StatusPostState
} from "../models/WhatsappStatusPost";
import { getStatusProvider } from "../services/WhatsappStatusServices/providers";
import { StatusPublishError } from "../services/WhatsappStatusServices/providers/types";
import { resolveAudienceJids } from "../services/WhatsappStatusServices/StatusAudienceService";
import { isStatusEnabled } from "../services/WhatsappStatusServices/StatusFeatureService";
import {
  cleanupOrphanStatusMedia,
  removeStatusMedia
} from "../services/WhatsappStatusServices/StatusMediaService";
import { emitStatusPost } from "../services/WhatsappStatusServices/StatusSocket";
import { logger } from "../utils/logger";

/* eslint-disable no-restricted-syntax */

type PublishJobData = { postId: number };

const queue = new Queue(
  "WhatsappStatusPublish",
  process.env.REDIS_URI || "",
  runtimeQueueOptions()
);

const DAY_MS = 24 * 60 * 60 * 1000;
const OUTCOME_UNKNOWN = "ERR_STATUS_OUTCOME_UNKNOWN";
const CONNECTION_UNAVAILABLE = "ERR_STATUS_CONNECTION_UNAVAILABLE";

// Posts are emitted to the browser, which shows who created them.
const createdByInclude = () => ({
  model: User,
  as: "createdBy",
  attributes: ["id", "name"]
});

const jobIdOf = (postId: number): string => `status-post-${postId}`;

// One publish at a time per connection: the session is a single socket.
const connectionLocks = new Map<number, Mutex>();
const lockFor = (whatsappId: number): Mutex => {
  let lock = connectionLocks.get(whatsappId);
  if (!lock) {
    lock = new Mutex();
    connectionLocks.set(whatsappId, lock);
  }
  return lock;
};

const finish = async (
  post: WhatsappStatusPost,
  fields: {
    state: StatusPostState;
    failureCode: string | null;
    remoteMessageId?: string;
    publishedAt?: Date;
    expiresAt?: Date;
  }
): Promise<void> => {
  await post.update(fields);
  emitStatusPost(post.companyId, "update", post);
};

const isLastAttempt = (job: Job<PublishJobData>): boolean =>
  job.attemptsMade + 1 >= (job.opts?.attempts || 1);

export const enqueueStatusPost = async (
  post: WhatsappStatusPost
): Promise<void> => {
  const jobId = jobIdOf(post.id);
  const existing = await queue.getJob(jobId);
  if (existing) {
    // A pending job already covers this post; a finished one would make Bull
    // silently ignore the new add because of the fixed jobId.
    if (!(await existing.isFailed()) && !(await existing.isCompleted())) return;
    await existing.remove();
  }
  const scheduledAt = post.scheduledAt
    ? new Date(post.scheduledAt).getTime()
    : 0;
  await queue.add(
    "Publish",
    { postId: post.id },
    {
      jobId,
      delay: Math.max(0, scheduledAt - Date.now()),
      attempts: 3,
      backoff: { type: "exponential", delay: 30000 },
      removeOnComplete: true
    }
  );
};

export const removeStatusJob = async (postId: number): Promise<void> => {
  const job = await queue.getJob(jobIdOf(postId));
  if (!job) return;
  try {
    await job.remove();
  } catch (error) {
    // An active job cannot be removed; its conditional claim will skip the
    // cancelled post.
    logger.warn(
      { error: error?.message, postId },
      "Could not remove whatsapp status job"
    );
  }
};

const publishOnce = async (post: WhatsappStatusPost): Promise<void> => {
  if (!(await isStatusEnabled(post.companyId))) {
    await finish(post, {
      state: "cancelled",
      failureCode: "ERR_STATUS_FEATURE_DISABLED"
    });
    return;
  }

  const connection = await Whatsapp.findOne({
    where: { id: post.whatsappId, companyId: post.companyId }
  });
  if (!connection) {
    await finish(post, {
      state: "failed",
      failureCode: "ERR_STATUS_CONNECTION_MISMATCH"
    });
    return;
  }

  const provider = getStatusProvider(connection);
  const caps = provider.capabilities(connection);
  if (caps.reason === "DISCONNECTED") {
    throw new StatusPublishError(CONNECTION_UNAVAILABLE, false);
  }
  if (!caps.publishStatus || !caps.kinds.includes(post.kind)) {
    await finish(post, {
      state: "unsupported",
      failureCode: `ERR_STATUS_${caps.publishStatus ? "UNSUPPORTED" : caps.reason || "UNSUPPORTED"}`
    });
    return;
  }

  let audience: string[];
  try {
    audience = await resolveAudienceJids({
      companyId: post.companyId,
      whatsappId: post.whatsappId,
      audienceMode: post.audienceMode,
      contactListId: post.contactListId ?? null
    });
  } catch (error) {
    if (!(error instanceof AppError)) throw error;
    await finish(post, { state: "failed", failureCode: error.message });
    return;
  }

  await lockFor(post.whatsappId).runExclusive(async () => {
    const claim = {
      state: "publishing" as StatusPostState,
      attemptStartedAt: new Date()
    };
    // Conditional, so a cancel that landed while waiting for the lock wins.
    const [claimed] = await WhatsappStatusPost.update(claim, {
      where: { id: post.id, state: "queued", attemptStartedAt: null }
    });
    if (!claimed) return;
    post.set(claim);
    emitStatusPost(post.companyId, "update", post);

    let remoteMessageId: string;
    try {
      ({ remoteMessageId } = await provider.publish(
        post,
        connection,
        audience
      ));
    } catch (error) {
      // A connection-unavailable error is raised before sendMessage.
      if (
        error instanceof StatusPublishError &&
        !error.permanent &&
        error.code === CONNECTION_UNAVAILABLE
      ) {
        await post.update({ state: "queued", attemptStartedAt: null });
      }
      throw error;
    }

    const publishedAt = new Date();
    const expiresAt = new Date(publishedAt.getTime() + DAY_MS);
    await finish(post, {
      state: "published",
      remoteMessageId,
      publishedAt,
      expiresAt,
      failureCode: null
    });
    // Keep the media preview while the Status is within its 24-hour window.
    // The periodic sweep also handles a lost or stalled expiry job.
    if (post.mediaPath) {
      try {
        await queue.add(
          "ExpireMedia",
          { postId: post.id },
          {
            jobId: `status-media-expire-${post.id}`,
            delay: Math.max(0, expiresAt.getTime() - Date.now()),
            attempts: 3,
            backoff: { type: "exponential", delay: 30000 },
            removeOnComplete: true
          }
        );
      } catch (error) {
        logger.warn(
          { error: error?.message, postId: post.id },
          "Could not schedule whatsapp status media expiry"
        );
      }
    }
  });
};

export const handlePublishStatus = async (
  job: Job<PublishJobData>
): Promise<void> => {
  const post = await WhatsappStatusPost.findByPk(job.data.postId, {
    include: [createdByInclude()]
  });
  if (!post || !["queued", "publishing"].includes(post.state)) return;

  // A previous run handed the post to the session and died before saving the
  // result. Sending again could show the same Status twice on the phone.
  if (post.state === "publishing" || post.attemptStartedAt) {
    await finish(post, { state: "failed", failureCode: OUTCOME_UNKNOWN });
    return;
  }

  try {
    await publishOnce(post);
  } catch (error) {
    if (error instanceof StatusPublishError && error.permanent) {
      await finish(post, { state: "failed", failureCode: error.code });
      return;
    }
    if (post.attemptStartedAt) {
      logger.error(
        { error: error?.message, postId: post.id },
        "Whatsapp status send ended without a known outcome"
      );
      await finish(post, { state: "failed", failureCode: OUTCOME_UNKNOWN });
      return;
    }
    if (isLastAttempt(job)) {
      const code =
        error instanceof StatusPublishError
          ? error.code
          : "ERR_STATUS_PUBLISH_FAILED";
      await finish(post, { state: "failed", failureCode: code });
      return;
    }
    throw error;
  }
};

const handleCleanup = async (): Promise<void> => {
  const removed = await cleanupOrphanStatusMedia();
  logger.info({ removed }, "Whatsapp status media cleanup finished");
};

const handleExpireMedia = async (job: Job<PublishJobData>): Promise<void> => {
  const post = await WhatsappStatusPost.findByPk(job.data.postId);
  if (!post?.mediaPath || post.state !== "published" || !post.expiresAt) return;
  if (new Date(post.expiresAt).getTime() > Date.now()) return;
  await removeStatusMedia(post.companyId, post.mediaPath);
  await post.update({ mediaPath: null });
  emitStatusPost(post.companyId, "update", post);
};

// A job that ended (for example failed after stalling twice) will never run
// the handler again, so it counts as missing.
const hasPendingJob = async (postId: number): Promise<boolean> => {
  const job = await queue.getJob(jobIdOf(postId));
  if (!job) return false;
  return !(await job.isFailed()) && !(await job.isCompleted());
};

// Jobs may be lost when Redis is flushed or the backend restarts mid-flight.
const recoverPendingPosts = async (): Promise<void> => {
  const posts = await WhatsappStatusPost.findAll({
    where: {
      state: { [Op.in]: ["queued", "publishing"] },
      ...runtimeCompanyWhere()
    },
    include: [createdByInclude()]
  });
  for (const post of posts) {
    try {
      if (post.state === "queued") {
        await enqueueStatusPost(post);
      } else if (!(await hasPendingJob(post.id))) {
        await finish(post, { state: "failed", failureCode: OUTCOME_UNKNOWN });
      }
    } catch (error) {
      logger.error(
        { error: error?.message, postId: post.id },
        "Could not recover whatsapp status post"
      );
    }
  }
};

export const startWhatsappStatusQueue = async (): Promise<void> => {
  queue.process("Publish", 4, handlePublishStatus);
  queue.process("Cleanup", 1, handleCleanup);
  queue.process("ExpireMedia", 1, handleExpireMedia);
  await queue.add(
    "Cleanup",
    {},
    {
      repeat: { cron: "0 * * * *" },
      jobId: "whatsapp-status-cleanup",
      removeOnComplete: true
    }
  );
  await recoverPendingPosts();
};
