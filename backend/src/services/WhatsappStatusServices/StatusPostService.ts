import { Op, UniqueConstraintError } from "sequelize";
import AppError from "../../errors/AppError";
import User from "../../models/User";
import Whatsapp from "../../models/Whatsapp";
import WhatsappStatusPost, {
  StatusAudienceMode,
  StatusKind,
  StatusPostState
} from "../../models/WhatsappStatusPost";
import {
  enqueueStatusPost,
  removeStatusJob
} from "../../queues/whatsappStatus";
import { getStatusProvider } from "./providers";
import { StatusCapabilities } from "./providers/types";
import { previewAudience } from "./StatusAudienceService";
import {
  removeStatusMedia,
  resolveStatusMediaPath
} from "./StatusMediaService";
import { emitStatusPost } from "./StatusSocket";

export type CreateStatusPostInput = {
  whatsappId: number;
  kind: StatusKind;
  body?: string | null;
  backgroundColor?: string | null;
  font?: number | null;
  audienceMode: StatusAudienceMode;
  contactListId?: number | null;
  idempotencyKey: string;
  media?: { mediaPath: string; mediaMime: string } | null;
};

export type UpdateStatusPostInput = Partial<
  Omit<CreateStatusPostInput, "idempotencyKey">
>;

const MAX_BODY = 700;
const MAX_SCHEDULE_MS = 30 * 24 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const DRAFT_RETENTION_MS = 7 * DAY_MS;
const KINDS: StatusKind[] = ["text", "image", "video"];
const AUDIENCE_MODES: StatusAudienceMode[] = [
  "connection_contacts",
  "contact_list"
];
const EDITABLE: StatusPostState[] = ["draft", "failed", "unsupported"];
const PUBLISHABLE: StatusPostState[] = ["draft", "failed", "unsupported"];
// Finished posts can always be cancelled: cancel only changes the row and
// removes the media. Pending ones only while the worker has not handed them
// to the session.
const CANCELLABLE_FINISHED: StatusPostState[] = ["failed", "unsupported"];
const CANCELLABLE_PENDING: StatusPostState[] = ["draft", "queued"];

// The author shown on the story; every post sent to the browser carries it.
const createdByInclude = () => ({
  model: User,
  as: "createdBy",
  attributes: ["id", "name"]
});

const notFound = () => new AppError("ERR_STATUS_NOT_FOUND", 404);
const invalid = (code = "ERR_STATUS_INVALID_INPUT") => new AppError(code, 400);
const invalidState = () => new AppError("ERR_STATUS_INVALID_STATE", 409);

const findPost = async (
  companyId: number,
  id: number
): Promise<WhatsappStatusPost> => {
  const post = await WhatsappStatusPost.findOne({
    where: { id, companyId },
    include: [createdByInclude()]
  });
  if (!post) throw notFound();
  return post;
};

const findConnection = async (
  companyId: number,
  whatsappId: number
): Promise<Whatsapp> => {
  // A missing id would reach Sequelize as undefined and fail with a 500.
  if (!Number.isInteger(whatsappId)) throw invalid();
  const connection = await Whatsapp.findOne({
    where: { id: whatsappId, companyId }
  });
  if (!connection) throw notFound();
  return connection;
};

type PostContent = {
  whatsappId: number;
  kind: StatusKind;
  body: string | null;
  mediaPath: string | null;
  mediaMime: string | null;
  backgroundColor: string | null;
  font: number | null;
  audienceMode: StatusAudienceMode;
  contactListId: number | null;
};

// Validates the merged content of a post; media must live in the company folder.
const validateContent = (companyId: number, content: PostContent): void => {
  if (!KINDS.includes(content.kind)) throw invalid();
  if (!AUDIENCE_MODES.includes(content.audienceMode)) throw invalid();
  if (content.audienceMode === "contact_list" && !content.contactListId) {
    throw invalid();
  }
  if (content.body && content.body.length > MAX_BODY) {
    throw invalid("ERR_STATUS_BODY_TOO_LONG");
  }
  if (content.kind === "text") {
    if (!content.body || !content.body.trim()) {
      throw invalid("ERR_STATUS_BODY_REQUIRED");
    }
  } else {
    if (!content.mediaPath || !content.mediaMime) {
      throw invalid("ERR_STATUS_MEDIA_REQUIRED");
    }
    if (!content.mediaMime.startsWith(`${content.kind}/`)) {
      throw invalid("ERR_STATUS_MEDIA_INVALID");
    }
    resolveStatusMediaPath(companyId, content.mediaPath);
  }
  if (
    content.backgroundColor !== null &&
    !/^#[0-9A-F]{6}$/i.test(content.backgroundColor)
  ) {
    throw invalid();
  }
  if (
    content.font !== null &&
    (!Number.isInteger(content.font) || content.font < 0 || content.font > 5)
  ) {
    throw invalid();
  }
};

const audienceInput = (companyId: number, content: PostContent) => ({
  companyId,
  whatsappId: content.whatsappId,
  audienceMode: content.audienceMode,
  contactListId: content.contactListId
});

// Drafts may be saved before anyone talked to the connection (Cloud API
// drafts included); publishing checks the audience again and fails fast.
const draftAudienceCount = async (
  companyId: number,
  content: PostContent
): Promise<number> => {
  try {
    return (await previewAudience(audienceInput(companyId, content))).count;
  } catch (error) {
    if (error?.message === "ERR_STATUS_AUDIENCE_EMPTY") return 0;
    throw error;
  }
};

const nullable = <T>(value: T | undefined | null): T | null =>
  value === undefined || value === "" ? null : value;

export const listPosts = async (
  companyId: number,
  filters: { whatsappId?: number; active?: boolean }
): Promise<WhatsappStatusPost[]> => {
  const now = new Date();
  const where: Record<string | symbol, unknown> = { companyId };
  if (filters.whatsappId) where.whatsappId = filters.whatsappId;
  if (filters.active) {
    // Pending posts stay visible until they run, even when scheduled days ahead.
    where[Op.or] = [
      { state: "published", expiresAt: { [Op.gt]: now } },
      { state: { [Op.in]: ["queued", "publishing"] } },
      {
        // A scheduled post may fail days after creation; count from failing.
        state: { [Op.in]: ["failed", "unsupported"] },
        updatedAt: { [Op.gte]: new Date(now.getTime() - DAY_MS) }
      },
      // Drafts (Cloud API ones included) stay reachable until the daily
      // cleanup cancels them after DRAFT_RETENTION_MS without edits.
      {
        state: "draft",
        updatedAt: { [Op.gte]: new Date(now.getTime() - DRAFT_RETENTION_MS) }
      }
    ];
  }
  return WhatsappStatusPost.findAll({
    where,
    include: [createdByInclude()],
    order: [["createdAt", "ASC"]]
  });
};

export const getCapabilities = async (
  companyId: number,
  whatsappId: number
): Promise<StatusCapabilities> => {
  const connection = await findConnection(companyId, whatsappId);
  return getStatusProvider(connection).capabilities(connection);
};

export const createPost = async (
  companyId: number,
  userId: number,
  input: CreateStatusPostInput
): Promise<WhatsappStatusPost> => {
  const idempotencyKey = String(input.idempotencyKey || "").trim();
  if (!idempotencyKey || idempotencyKey.length > 80) {
    throw invalid("ERR_STATUS_IDEMPOTENCY_REQUIRED");
  }
  const existing = await WhatsappStatusPost.findOne({
    where: { companyId, idempotencyKey }
  });
  if (existing) return existing;

  await findConnection(companyId, input.whatsappId);
  const isText = input.kind === "text";
  const content: PostContent = {
    whatsappId: input.whatsappId,
    kind: input.kind,
    body: nullable(input.body),
    mediaPath: isText ? null : nullable(input.media?.mediaPath),
    mediaMime: isText ? null : nullable(input.media?.mediaMime),
    backgroundColor: isText ? nullable(input.backgroundColor) : null,
    font: isText ? nullable(input.font) : null,
    audienceMode: input.audienceMode,
    contactListId:
      input.audienceMode === "contact_list"
        ? nullable(input.contactListId)
        : null
  };
  validateContent(companyId, content);
  const audienceCount = await draftAudienceCount(companyId, content);

  let post: WhatsappStatusPost;
  try {
    post = await WhatsappStatusPost.create({
      ...content,
      companyId,
      createdByUserId: userId,
      audienceCount,
      state: "draft",
      idempotencyKey
    } as never);
  } catch (error) {
    if (!(error instanceof UniqueConstraintError)) throw error;
    // A concurrent request with the same key won the race.
    const winner = await WhatsappStatusPost.findOne({
      where: { companyId, idempotencyKey }
    });
    if (!winner) throw error;
    return winner;
  }
  await post.reload({ include: [createdByInclude()] });
  emitStatusPost(companyId, "create", post);
  return post;
};

export const updatePost = async (
  companyId: number,
  id: number,
  patch: UpdateStatusPostInput
): Promise<WhatsappStatusPost> => {
  const post = await findPost(companyId, id);
  if (!EDITABLE.includes(post.state)) throw invalidState();

  const whatsappId = patch.whatsappId ?? post.whatsappId;
  if (whatsappId !== post.whatsappId) {
    await findConnection(companyId, whatsappId);
  }
  const kind = patch.kind ?? post.kind;
  const isText = kind === "text";
  const pick = <K extends keyof PostContent>(
    key: K,
    value: PostContent[K] | undefined
  ): PostContent[K] =>
    value === undefined ? nullable(post[key] as PostContent[K]) : value;
  const audienceMode = patch.audienceMode ?? post.audienceMode;
  const content: PostContent = {
    whatsappId,
    kind,
    body: nullable(pick("body", patch.body)),
    mediaPath: isText
      ? null
      : patch.media
        ? patch.media.mediaPath
        : nullable(post.mediaPath),
    mediaMime: isText
      ? null
      : patch.media
        ? patch.media.mediaMime
        : nullable(post.mediaMime),
    backgroundColor: isText
      ? nullable(pick("backgroundColor", patch.backgroundColor))
      : null,
    font: isText ? nullable(pick("font", patch.font)) : null,
    audienceMode,
    contactListId:
      audienceMode === "contact_list"
        ? nullable(pick("contactListId", patch.contactListId))
        : null
  };
  validateContent(companyId, content);
  const audienceCount = await draftAudienceCount(companyId, content);

  const previousMedia = post.mediaPath;
  await post.update({
    ...content,
    audienceCount,
    state: "draft",
    scheduledAt: null,
    failureCode: null,
    attemptStartedAt: null,
    remoteMessageId: null
  });
  if (previousMedia && previousMedia !== content.mediaPath) {
    await removeStatusMedia(companyId, previousMedia);
  }
  emitStatusPost(companyId, "update", post);
  return post;
};

export const publishPost = async (
  companyId: number,
  id: number,
  options: { scheduledAt?: Date | null }
): Promise<WhatsappStatusPost> => {
  const now = Date.now();
  let scheduledAt: Date | null = null;
  if (options.scheduledAt) {
    scheduledAt = new Date(options.scheduledAt);
    const at = scheduledAt.getTime();
    if (Number.isNaN(at) || at < now || at > now + MAX_SCHEDULE_MS) {
      throw invalid("ERR_STATUS_SCHEDULE_INVALID");
    }
  }

  const post = await findPost(companyId, id);
  if (!PUBLISHABLE.includes(post.state)) throw invalidState();
  const connection = await findConnection(companyId, post.whatsappId);
  const capabilities = getStatusProvider(connection).capabilities(connection);

  // A session that is offline now may be back by the scheduled time; the
  // worker retries and fails explicitly if it is still offline then.
  const canQueue =
    capabilities.publishStatus ||
    (capabilities.reason === "DISCONNECTED" && !!scheduledAt);
  if (!canQueue || !capabilities.kinds.includes(post.kind)) {
    const reason = capabilities.publishStatus
      ? "UNSUPPORTED"
      : capabilities.reason || "UNSUPPORTED";
    await post.update({
      state: "unsupported",
      failureCode: `ERR_STATUS_${reason}`,
      scheduledAt: null
    });
    emitStatusPost(companyId, "update", post);
    return post;
  }

  // An empty audience fails now instead of in the worker.
  const { count } = await previewAudience({
    companyId,
    whatsappId: post.whatsappId,
    audienceMode: post.audienceMode,
    contactListId: post.contactListId ?? null
  });

  await post.update({
    state: "queued",
    scheduledAt,
    audienceCount: count,
    failureCode: null,
    attemptStartedAt: null,
    remoteMessageId: null,
    publishedAt: null,
    expiresAt: null
  });
  await enqueueStatusPost(post);
  emitStatusPost(companyId, "update", post);
  return post;
};

export const cancelPost = async (
  companyId: number,
  id: number
): Promise<WhatsappStatusPost> => {
  const post = await findPost(companyId, id);
  const finished = CANCELLABLE_FINISHED.includes(post.state);
  const pending =
    CANCELLABLE_PENDING.includes(post.state) && !post.attemptStartedAt;
  if (!finished && !pending) throw invalidState();
  const previousState = post.state;
  const { mediaPath } = post;
  const changes = {
    state: "cancelled" as StatusPostState,
    scheduledAt: null,
    mediaPath: null,
    mediaMime: null
  };
  // Conditional so a worker that already claimed the post wins.
  const [count] = await WhatsappStatusPost.update(changes, {
    where: {
      id: post.id,
      companyId,
      state: previousState,
      ...(pending ? { attemptStartedAt: null } : {})
    }
  });
  if (!count) throw invalidState();
  post.set(changes);

  if (previousState === "queued") await removeStatusJob(post.id);
  if (mediaPath) await removeStatusMedia(companyId, mediaPath);
  emitStatusPost(companyId, "update", post);
  return post;
};

export const showPost = async (
  companyId: number,
  id: number
): Promise<WhatsappStatusPost> => findPost(companyId, id);

export const cancelPendingForCompany = async (
  companyId: number
): Promise<void> => {
  const posts = await WhatsappStatusPost.findAll({
    where: { companyId, state: "queued" },
    include: [createdByInclude()]
  });
  const changes = {
    state: "cancelled" as StatusPostState,
    failureCode: "ERR_STATUS_FEATURE_DISABLED"
  };
  // eslint-disable-next-line no-restricted-syntax
  for (const post of posts) {
    const [count] = await WhatsappStatusPost.update(changes, {
      where: { id: post.id, companyId, state: "queued", attemptStartedAt: null }
    });
    if (count) {
      post.set(changes);

      await removeStatusJob(post.id);
      emitStatusPost(companyId, "update", post);
    }
  }
};
