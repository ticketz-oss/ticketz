import { Op } from "sequelize";
import WhatsappStatusPost from "../../../models/WhatsappStatusPost";
import Whatsapp from "../../../models/Whatsapp";
import {
  enqueueStatusPost,
  removeStatusJob
} from "../../../queues/whatsappStatus";
import { getStatusProvider } from "../providers";
import { previewAudience } from "../StatusAudienceService";
import {
  removeStatusMedia,
  resolveStatusMediaPath
} from "../StatusMediaService";
import { emitStatusPost, serializeStatusPost } from "../StatusSocket";
import {
  cancelPendingForCompany,
  cancelPost,
  createPost,
  getCapabilities,
  listPosts,
  publishPost,
  showPost,
  updatePost
} from "../StatusPostService";

jest.mock("../../../models/WhatsappStatusPost", () => ({
  __esModule: true,
  default: {
    findOne: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn()
  }
}));
jest.mock("../../../models/Whatsapp", () => ({
  __esModule: true,
  default: { findOne: jest.fn() }
}));
jest.mock("../../../models/User", () => ({ __esModule: true, default: {} }));
jest.mock("../../../queues/whatsappStatus", () => ({
  enqueueStatusPost: jest.fn(),
  removeStatusJob: jest.fn()
}));
jest.mock("../providers", () => ({ getStatusProvider: jest.fn() }));
jest.mock("../StatusAudienceService", () => ({ previewAudience: jest.fn() }));
jest.mock("../StatusMediaService", () => ({
  resolveStatusMediaPath: jest.fn(),
  removeStatusMedia: jest.fn()
}));
jest.mock("../../../libs/socket", () => ({ getIO: jest.fn() }));
jest.mock("../StatusSocket", () => ({
  ...jest.requireActual("../StatusSocket"),
  emitStatusPost: jest.fn()
}));

const NOW = new Date("2026-10-19T12:00:00Z");
const AUTHOR = { id: 2, name: "Ana" };

const lastEmitted = () => {
  const { calls } = (emitStatusPost as jest.Mock).mock;
  return calls[calls.length - 1][2];
};

const makePost = (fields: Record<string, unknown> = {}) => {
  const post: Record<string, unknown> = {
    id: 5,
    companyId: 7,
    whatsappId: 11,
    kind: "text",
    body: "Oi",
    mediaPath: null,
    mediaMime: null,
    backgroundColor: "#024BF4",
    font: 1,
    audienceMode: "connection_contacts",
    contactListId: null,
    audienceCount: 3,
    scheduledAt: null,
    state: "draft",
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
  // Like Sequelize, the author is only loaded when the reload includes it.
  post.reload = jest.fn(async (options?: { include?: { as?: string }[] }) => {
    if (options?.include?.some(include => include.as === "createdBy")) {
      post.createdBy = AUTHOR;
    }
    return post;
  });
  return post as never as WhatsappStatusPost & {
    update: jest.Mock;
    set: jest.Mock;
  };
};

const capabilities = (overrides = {}) => ({
  publishStatus: true,
  kinds: ["text", "image", "video"],
  reason: null,
  manualExport: false,
  ownPostsSync: false,
  ...overrides
});

const mockProvider = (caps = capabilities()) => {
  const provider = { capabilities: jest.fn(() => caps), publish: jest.fn() };
  (getStatusProvider as jest.Mock).mockReturnValue(provider);
  return provider;
};

const textInput = {
  whatsappId: 11,
  kind: "text" as const,
  body: "Promo de hoje",
  backgroundColor: "#024BF4",
  font: 1,
  audienceMode: "connection_contacts" as const,
  idempotencyKey: "key-1"
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers().setSystemTime(NOW);
  (Whatsapp.findOne as jest.Mock).mockResolvedValue({
    id: 11,
    companyId: 7,
    apiMode: "baileys",
    status: "CONNECTED"
  });
  (WhatsappStatusPost.findOne as jest.Mock).mockResolvedValue(null);
  (WhatsappStatusPost.create as jest.Mock).mockImplementation(async data =>
    makePost({ id: 5, ...data })
  );
  (WhatsappStatusPost.update as jest.Mock).mockResolvedValue([1]);
  (previewAudience as jest.Mock).mockResolvedValue({ count: 3, sample: [] });
  (resolveStatusMediaPath as jest.Mock).mockImplementation(
    (companyId, mediaPath) => `/private/${mediaPath}`
  );
  mockProvider();
});

afterEach(() => {
  jest.useRealTimers();
});

describe("StatusPostService.createPost", () => {
  it("creates a draft with the audience snapshot and emits it", async () => {
    const post = await createPost(7, 2, textInput);
    expect(WhatsappStatusPost.create).toHaveBeenCalledWith(
      expect.objectContaining({
        companyId: 7,
        whatsappId: 11,
        createdByUserId: 2,
        kind: "text",
        body: "Promo de hoje",
        audienceCount: 3,
        state: "draft",
        idempotencyKey: "key-1"
      })
    );
    expect(previewAudience).toHaveBeenCalledWith({
      companyId: 7,
      whatsappId: 11,
      audienceMode: "connection_contacts",
      contactListId: null
    });
    expect(emitStatusPost).toHaveBeenCalledWith(7, "create", post);
  });

  it("emits the created post with its author (createdBy)", async () => {
    await createPost(7, 2, textInput);
    expect(lastEmitted().createdBy).toEqual(AUTHOR);
  });

  it("returns the existing post for a repeated idempotency key", async () => {
    const existing = makePost({ id: 99, idempotencyKey: "key-1" });
    (WhatsappStatusPost.findOne as jest.Mock).mockResolvedValue(existing);
    await expect(createPost(7, 2, textInput)).resolves.toBe(existing);
    expect(WhatsappStatusPost.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { companyId: 7, idempotencyKey: "key-1" }
      })
    );
    expect(WhatsappStatusPost.create).not.toHaveBeenCalled();
    expect(emitStatusPost).not.toHaveBeenCalled();
  });

  it("rejects a missing connection with ERR_STATUS_INVALID_INPUT", async () => {
    await expect(
      createPost(7, 2, { ...textInput, whatsappId: undefined })
    ).rejects.toMatchObject({
      message: "ERR_STATUS_INVALID_INPUT",
      statusCode: 400
    });
    expect(Whatsapp.findOne).not.toHaveBeenCalled();
    expect(WhatsappStatusPost.create).not.toHaveBeenCalled();
  });

  it("rejects a connection of another company with ERR_STATUS_NOT_FOUND", async () => {
    (Whatsapp.findOne as jest.Mock).mockResolvedValue(null);
    await expect(
      createPost(7, 2, { ...textInput, whatsappId: 12 })
    ).rejects.toMatchObject({
      message: "ERR_STATUS_NOT_FOUND",
      statusCode: 404
    });
    expect(Whatsapp.findOne).toHaveBeenCalledWith({
      where: { id: 12, companyId: 7 }
    });
    expect(WhatsappStatusPost.create).not.toHaveBeenCalled();
  });

  it("rejects text over 700 characters", async () => {
    await expect(
      createPost(7, 2, { ...textInput, body: "a".repeat(701) })
    ).rejects.toMatchObject({ message: "ERR_STATUS_BODY_TOO_LONG" });
    await expect(
      createPost(7, 2, { ...textInput, body: "a".repeat(700) })
    ).resolves.toBeTruthy();
    await expect(
      createPost(7, 2, { ...textInput, body: "   " })
    ).rejects.toMatchObject({ message: "ERR_STATUS_BODY_REQUIRED" });
  });

  it("validates color, font and media of the company", async () => {
    await expect(
      createPost(7, 2, { ...textInput, backgroundColor: "blue" })
    ).rejects.toMatchObject({ message: "ERR_STATUS_INVALID_INPUT" });
    await expect(
      createPost(7, 2, { ...textInput, font: 9 })
    ).rejects.toMatchObject({ message: "ERR_STATUS_INVALID_INPUT" });
    await expect(
      createPost(7, 2, { ...textInput, kind: "image", body: null })
    ).rejects.toMatchObject({ message: "ERR_STATUS_MEDIA_REQUIRED" });

    (resolveStatusMediaPath as jest.Mock).mockImplementation(() => {
      throw Object.assign(new Error("ERR_STATUS_NOT_FOUND"), {
        statusCode: 404
      });
    });
    await expect(
      createPost(7, 2, {
        ...textInput,
        kind: "image",
        media: { mediaPath: "whatsapp-status/8/x.jpg", mediaMime: "image/jpeg" }
      })
    ).rejects.toMatchObject({ message: "ERR_STATUS_NOT_FOUND" });
    expect(WhatsappStatusPost.create).not.toHaveBeenCalled();
  });

  it("creates a media draft on an official connection", async () => {
    (Whatsapp.findOne as jest.Mock).mockResolvedValue({
      id: 11,
      companyId: 7,
      apiMode: "official",
      status: "CONNECTED"
    });
    await createPost(7, 2, {
      ...textInput,
      kind: "image",
      body: "Legenda",
      backgroundColor: null,
      font: null,
      media: { mediaPath: "whatsapp-status/7/a.jpg", mediaMime: "image/jpeg" }
    });
    expect(WhatsappStatusPost.create).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: "image",
        mediaPath: "whatsapp-status/7/a.jpg",
        mediaMime: "image/jpeg",
        state: "draft"
      })
    );
  });

  it("keeps a draft with zero audience instead of failing", async () => {
    (previewAudience as jest.Mock).mockRejectedValue(
      Object.assign(new Error("ERR_STATUS_AUDIENCE_EMPTY"), { statusCode: 400 })
    );
    await createPost(7, 2, textInput);
    expect(WhatsappStatusPost.create).toHaveBeenCalledWith(
      expect.objectContaining({ audienceCount: 0 })
    );
  });

  it("propagates other audience errors such as a foreign contact list", async () => {
    (previewAudience as jest.Mock).mockRejectedValue(
      Object.assign(new Error("ERR_STATUS_NOT_FOUND"), { statusCode: 404 })
    );
    await expect(
      createPost(7, 2, {
        ...textInput,
        audienceMode: "contact_list",
        contactListId: 40
      })
    ).rejects.toMatchObject({ message: "ERR_STATUS_NOT_FOUND" });
    expect(WhatsappStatusPost.create).not.toHaveBeenCalled();
  });

  it("requires a contact list in contact_list mode", async () => {
    await expect(
      createPost(7, 2, { ...textInput, audienceMode: "contact_list" })
    ).rejects.toMatchObject({ message: "ERR_STATUS_INVALID_INPUT" });
  });
});

describe("StatusPostService.updatePost", () => {
  it("edits a failed post back to draft and replaces old media", async () => {
    const post = makePost({
      state: "failed",
      failureCode: "ERR_STATUS_NO_CONFIRMATION",
      kind: "image",
      body: null,
      mediaPath: "whatsapp-status/7/old.jpg",
      mediaMime: "image/jpeg",
      backgroundColor: null,
      font: null
    });
    (WhatsappStatusPost.findOne as jest.Mock).mockResolvedValue(post);
    await updatePost(7, 5, {
      body: "Nova legenda",
      media: { mediaPath: "whatsapp-status/7/new.jpg", mediaMime: "image/jpeg" }
    });
    expect(post.update).toHaveBeenCalledWith(
      expect.objectContaining({
        body: "Nova legenda",
        mediaPath: "whatsapp-status/7/new.jpg",
        state: "draft",
        failureCode: null
      })
    );
    expect(removeStatusMedia).toHaveBeenCalledWith(
      7,
      "whatsapp-status/7/old.jpg"
    );
    expect(emitStatusPost).toHaveBeenCalledWith(7, "update", post);
  });

  it("keeps the edited draft with zero audience when the audience became empty", async () => {
    const post = makePost({ state: "unsupported" });
    (WhatsappStatusPost.findOne as jest.Mock).mockResolvedValue(post);
    (previewAudience as jest.Mock).mockRejectedValue(
      Object.assign(new Error("ERR_STATUS_AUDIENCE_EMPTY"), { statusCode: 400 })
    );
    await updatePost(7, 5, { body: "Outro texto" });
    expect(post.update).toHaveBeenCalledWith(
      expect.objectContaining({
        body: "Outro texto",
        audienceCount: 0,
        state: "draft"
      })
    );
  });

  it("refuses to edit a queued post", async () => {
    (WhatsappStatusPost.findOne as jest.Mock).mockResolvedValue(
      makePost({ state: "queued" })
    );
    await expect(updatePost(7, 5, { body: "x" })).rejects.toMatchObject({
      message: "ERR_STATUS_INVALID_STATE",
      statusCode: 409
    });
  });
});

describe("StatusPostService.publishPost", () => {
  it("queues an immediate publish", async () => {
    const post = makePost();
    (WhatsappStatusPost.findOne as jest.Mock).mockResolvedValue(post);
    await publishPost(7, 5, {});
    expect(post.update).toHaveBeenCalledWith(
      expect.objectContaining({ state: "queued", scheduledAt: null })
    );
    expect(enqueueStatusPost).toHaveBeenCalledWith(post);
    expect(emitStatusPost).toHaveBeenCalledWith(7, "update", post);
  });

  it("marks the post unsupported on official connections without enqueuing", async () => {
    const post = makePost();
    (WhatsappStatusPost.findOne as jest.Mock).mockResolvedValue(post);
    (Whatsapp.findOne as jest.Mock).mockResolvedValue({
      id: 11,
      companyId: 7,
      apiMode: "official"
    });
    mockProvider(
      capabilities({
        publishStatus: false,
        kinds: [],
        reason: "OFFICIAL_API",
        manualExport: true
      })
    );
    const result = await publishPost(7, 5, {});
    expect(result.state).toBe("unsupported");
    expect(result.failureCode).toBe("ERR_STATUS_OFFICIAL_API");
    expect(enqueueStatusPost).not.toHaveBeenCalled();
    expect(emitStatusPost).toHaveBeenCalledWith(7, "update", post);
  });

  it("marks a kind that the connection cannot publish as unsupported", async () => {
    const post = makePost({
      kind: "video",
      mediaPath: "whatsapp-status/7/v.mp4"
    });
    (WhatsappStatusPost.findOne as jest.Mock).mockResolvedValue(post);
    mockProvider(capabilities({ kinds: ["text", "image"] }));
    const result = await publishPost(7, 5, {});
    expect(result.state).toBe("unsupported");
    expect(result.failureCode).toBe("ERR_STATUS_UNSUPPORTED");
    expect(enqueueStatusPost).not.toHaveBeenCalled();
  });

  it("queues with delay when scheduledAt is in the future", async () => {
    const post = makePost();
    (WhatsappStatusPost.findOne as jest.Mock).mockResolvedValue(post);
    const scheduledAt = new Date(NOW.getTime() + 2 * 3600 * 1000);
    await publishPost(7, 5, { scheduledAt });
    expect(post.update).toHaveBeenCalledWith(
      expect.objectContaining({ state: "queued", scheduledAt })
    );
    expect(enqueueStatusPost).toHaveBeenCalledWith(
      expect.objectContaining({ id: 5, scheduledAt })
    );
  });

  it("schedules even while the session is disconnected, so the worker retries later", async () => {
    const post = makePost();
    (WhatsappStatusPost.findOne as jest.Mock).mockResolvedValue(post);
    mockProvider(
      capabilities({ publishStatus: false, reason: "DISCONNECTED" })
    );
    await publishPost(7, 5, {
      scheduledAt: new Date(NOW.getTime() + 3600 * 1000)
    });
    expect(post.state).toBe("queued");
    expect(enqueueStatusPost).toHaveBeenCalled();

    const now = makePost();
    (WhatsappStatusPost.findOne as jest.Mock).mockResolvedValue(now);
    await publishPost(7, 5, {});
    expect(now.state).toBe("unsupported");
    expect(now.failureCode).toBe("ERR_STATUS_DISCONNECTED");
  });

  it("rejects scheduledAt in the past", async () => {
    const post = makePost();
    (WhatsappStatusPost.findOne as jest.Mock).mockResolvedValue(post);
    await expect(
      publishPost(7, 5, { scheduledAt: new Date(NOW.getTime() - 60000) })
    ).rejects.toMatchObject({ message: "ERR_STATUS_SCHEDULE_INVALID" });
    await expect(
      publishPost(7, 5, {
        scheduledAt: new Date(NOW.getTime() + 31 * 24 * 3600 * 1000)
      })
    ).rejects.toMatchObject({ message: "ERR_STATUS_SCHEDULE_INVALID" });
    await expect(
      publishPost(7, 5, { scheduledAt: new Date("invalid") })
    ).rejects.toMatchObject({ message: "ERR_STATUS_SCHEDULE_INVALID" });
    expect(post.update).not.toHaveBeenCalled();
    expect(enqueueStatusPost).not.toHaveBeenCalled();
  });

  it("refuses to publish with an empty audience", async () => {
    const post = makePost();
    (WhatsappStatusPost.findOne as jest.Mock).mockResolvedValue(post);
    (previewAudience as jest.Mock).mockRejectedValue(
      Object.assign(new Error("ERR_STATUS_AUDIENCE_EMPTY"), { statusCode: 400 })
    );
    await expect(publishPost(7, 5, {})).rejects.toMatchObject({
      message: "ERR_STATUS_AUDIENCE_EMPTY"
    });
    expect(enqueueStatusPost).not.toHaveBeenCalled();
  });
});

describe("StatusPostService.cancelPost", () => {
  it("cancels a queued post and removes its job and media", async () => {
    const post = makePost({
      state: "queued",
      kind: "image",
      mediaPath: "whatsapp-status/7/a.jpg"
    });
    (WhatsappStatusPost.findOne as jest.Mock).mockResolvedValue(post);
    const result = await cancelPost(7, 5);
    expect(WhatsappStatusPost.update).toHaveBeenCalledWith(
      expect.objectContaining({ state: "cancelled", mediaPath: null }),
      {
        where: { id: 5, companyId: 7, state: "queued", attemptStartedAt: null }
      }
    );
    expect(removeStatusJob).toHaveBeenCalledWith(5);
    expect(removeStatusMedia).toHaveBeenCalledWith(
      7,
      "whatsapp-status/7/a.jpg"
    );
    expect(result.state).toBe("cancelled");
    expect(emitStatusPost).toHaveBeenCalledWith(7, "update", post);
  });

  it("refuses to cancel a post that is publishing", async () => {
    (WhatsappStatusPost.findOne as jest.Mock).mockResolvedValue(
      makePost({ state: "publishing", attemptStartedAt: NOW })
    );
    await expect(cancelPost(7, 5)).rejects.toMatchObject({
      message: "ERR_STATUS_INVALID_STATE",
      statusCode: 409
    });
    expect(removeStatusJob).not.toHaveBeenCalled();
    expect(removeStatusMedia).not.toHaveBeenCalled();
  });

  it("cancels a failed post even when its send had started", async () => {
    const post = makePost({
      state: "failed",
      kind: "image",
      mediaPath: "whatsapp-status/7/a.jpg",
      attemptStartedAt: NOW,
      failureCode: "ERR_STATUS_OUTCOME_UNKNOWN"
    });
    (WhatsappStatusPost.findOne as jest.Mock).mockResolvedValue(post);
    const result = await cancelPost(7, 5);
    expect(WhatsappStatusPost.update).toHaveBeenCalledWith(
      expect.objectContaining({ state: "cancelled", mediaPath: null }),
      { where: { id: 5, companyId: 7, state: "failed" } }
    );
    expect(removeStatusMedia).toHaveBeenCalledWith(
      7,
      "whatsapp-status/7/a.jpg"
    );
    expect(removeStatusJob).not.toHaveBeenCalled();
    expect(result.state).toBe("cancelled");
  });

  it("cancels an unsupported post", async () => {
    (WhatsappStatusPost.findOne as jest.Mock).mockResolvedValue(
      makePost({ state: "unsupported", failureCode: "ERR_STATUS_OFFICIAL_API" })
    );
    await expect(cancelPost(7, 5)).resolves.toMatchObject({
      state: "cancelled"
    });
  });

  it("refuses to cancel a published post", async () => {
    (WhatsappStatusPost.findOne as jest.Mock).mockResolvedValue(
      makePost({ state: "published", attemptStartedAt: NOW })
    );
    await expect(cancelPost(7, 5)).rejects.toMatchObject({
      message: "ERR_STATUS_INVALID_STATE",
      statusCode: 409
    });
    expect(WhatsappStatusPost.update).not.toHaveBeenCalled();
    expect(removeStatusMedia).not.toHaveBeenCalled();
  });

  it("refuses when the worker claimed the post in the meantime", async () => {
    (WhatsappStatusPost.findOne as jest.Mock).mockResolvedValue(
      makePost({ state: "queued" })
    );
    (WhatsappStatusPost.update as jest.Mock).mockResolvedValue([0]);
    await expect(cancelPost(7, 5)).rejects.toMatchObject({
      message: "ERR_STATUS_INVALID_STATE"
    });
    expect(removeStatusJob).not.toHaveBeenCalled();
  });

  it("returns 404 for a post of another company", async () => {
    await expect(cancelPost(8, 5)).rejects.toMatchObject({
      message: "ERR_STATUS_NOT_FOUND",
      statusCode: 404
    });
    expect(WhatsappStatusPost.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 5, companyId: 8 } })
    );
  });
});

describe("StatusPostService.cancelPendingForCompany", () => {
  it("cancels all queued posts of a company when the feature is disabled", async () => {
    const a = makePost({ id: 1, state: "queued" });
    const b = makePost({ id: 2, state: "queued" });
    (WhatsappStatusPost.findAll as jest.Mock).mockResolvedValue([a, b]);
    await cancelPendingForCompany(7);
    expect(WhatsappStatusPost.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ where: { companyId: 7, state: "queued" } })
    );
    expect(WhatsappStatusPost.update).toHaveBeenCalledWith(
      { state: "cancelled", failureCode: "ERR_STATUS_FEATURE_DISABLED" },
      {
        where: { id: 1, companyId: 7, state: "queued", attemptStartedAt: null }
      }
    );
    expect(removeStatusJob).toHaveBeenCalledWith(1);
    expect(removeStatusJob).toHaveBeenCalledWith(2);
    expect(a.state).toBe("cancelled");
    expect(b.failureCode).toBe("ERR_STATUS_FEATURE_DISABLED");
    expect(emitStatusPost).toHaveBeenCalledTimes(2);
  });

  it("emits cancelled posts with their author (createdBy)", async () => {
    (WhatsappStatusPost.findAll as jest.Mock).mockImplementation(
      async (options: { include?: { as?: string }[] }) => [
        makePost({
          id: 1,
          state: "queued",
          ...(options.include?.some(include => include.as === "createdBy")
            ? { createdBy: AUTHOR }
            : {})
        })
      ]
    );
    await cancelPendingForCompany(7);
    expect(lastEmitted().state).toBe("cancelled");
    expect(lastEmitted().createdBy).toEqual(AUTHOR);
  });
});

describe("StatusPostService reads", () => {
  it("shows only posts of the company", async () => {
    await expect(showPost(8, 5)).rejects.toMatchObject({
      message: "ERR_STATUS_NOT_FOUND",
      statusCode: 404
    });
    const post = makePost();
    (WhatsappStatusPost.findOne as jest.Mock).mockResolvedValue(post);
    await expect(showPost(7, 5)).resolves.toBe(post);
  });

  it("lists active posts of a connection", async () => {
    (WhatsappStatusPost.findAll as jest.Mock).mockResolvedValue([]);
    await listPosts(7, { whatsappId: 11, active: true });
    const options = (WhatsappStatusPost.findAll as jest.Mock).mock.calls[0][0];
    expect(options.where.companyId).toBe(7);
    expect(options.where.whatsappId).toBe(11);
    expect(options.where[Op.or]).toEqual([
      { state: "published", expiresAt: { [Op.gt]: NOW } },
      { state: { [Op.in]: ["queued", "publishing"] } },
      {
        state: { [Op.in]: ["failed", "unsupported"] },
        updatedAt: { [Op.gte]: new Date(NOW.getTime() - 24 * 3600 * 1000) }
      },
      {
        state: "draft",
        updatedAt: {
          [Op.gte]: new Date(NOW.getTime() - 7 * 24 * 3600 * 1000)
        }
      }
    ]);
    expect(options.order).toEqual([["createdAt", "ASC"]]);
  });

  it("lists drafts edited in the last 7 days so Cloud API drafts can be reopened", async () => {
    (WhatsappStatusPost.findAll as jest.Mock).mockResolvedValue([]);
    await listPosts(7, { active: true });
    const options = (WhatsappStatusPost.findAll as jest.Mock).mock.calls[0][0];
    expect(options.where[Op.or]).toContainEqual({
      state: "draft",
      updatedAt: { [Op.gte]: new Date(NOW.getTime() - 7 * 24 * 3600 * 1000) }
    });
  });

  it("keeps a scheduled post that failed days after creation visible for 24h after failing", async () => {
    (WhatsappStatusPost.findAll as jest.Mock).mockResolvedValue([]);
    await listPosts(7, { active: true });
    const options = (WhatsappStatusPost.findAll as jest.Mock).mock.calls[0][0];
    const failedClause = options.where[Op.or].find(
      (clause: { state: Record<symbol, string[]> }) =>
        clause.state[Op.in]?.includes("failed")
    );
    expect(failedClause).not.toHaveProperty("createdAt");
    expect(failedClause.updatedAt).toEqual({
      [Op.gte]: new Date(NOW.getTime() - 24 * 3600 * 1000)
    });
  });

  it("reports capabilities only for connections of the company", async () => {
    await expect(getCapabilities(7, 11)).resolves.toMatchObject({
      publishStatus: true
    });
    (Whatsapp.findOne as jest.Mock).mockResolvedValue(null);
    await expect(getCapabilities(7, 99)).rejects.toMatchObject({
      message: "ERR_STATUS_NOT_FOUND"
    });
  });
});

describe("StatusSocket.serializeStatusPost", () => {
  it("never exposes the media path or audience JIDs", () => {
    const serialized = serializeStatusPost(
      makePost({
        kind: "image",
        mediaPath: "whatsapp-status/7/a.jpg",
        mediaMime: "image/jpeg",
        remoteMessageId: "3EB0",
        idempotencyKey: "k",
        createdBy: { id: 2, name: "Ana", email: "ana@x" }
      })
    );
    expect(serialized).toMatchObject({
      id: 5,
      whatsappId: 11,
      kind: "image",
      mediaMime: "image/jpeg",
      hasMedia: true,
      createdBy: { id: 2, name: "Ana" }
    });
    expect(serialized).not.toHaveProperty("mediaPath");
    expect(serialized).not.toHaveProperty("statusJidList");
    expect(serialized).not.toHaveProperty("remoteMessageId");
    expect(serialized).not.toHaveProperty("idempotencyKey");
    expect(serialized.createdBy).toEqual({ id: 2, name: "Ana" });
  });
});
