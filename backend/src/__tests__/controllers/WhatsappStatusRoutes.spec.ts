import fs from "fs";
import os from "os";
import path from "path";

// Tiny upload ceiling (~1 KB) so the oversize test does not need a large body.
process.env.WHATSAPP_STATUS_MAX_IMAGE_MB = "0.001";
process.env.WHATSAPP_STATUS_MAX_VIDEO_MB = "0.001";

jest.mock("../../middleware/isAuth", () => ({
  __esModule: true,
  default: (req, _res, next) => {
    req.user = {
      id: "5",
      companyId: Number(req.get("x-test-company") || 1),
      profile: "user",
      isSuper: false
    };
    next();
  }
}));
jest.mock("../../services/WhatsappStatusServices/StatusFeatureService", () => ({
  isStatusEnabled: jest.fn()
}));
jest.mock("../../services/WhatsappStatusServices/StatusPostService", () => ({
  listPosts: jest.fn(),
  getCapabilities: jest.fn(),
  createPost: jest.fn(),
  updatePost: jest.fn(),
  publishPost: jest.fn(),
  cancelPost: jest.fn(),
  showPost: jest.fn()
}));
jest.mock("../../services/WhatsappStatusServices/StatusSocket", () => ({
  serializeStatusPost: jest.fn(post => ({
    id: post.id,
    state: post.state,
    serialized: true
  }))
}));
jest.mock(
  "../../services/WhatsappStatusServices/StatusAudienceService",
  () => ({
    previewAudience: jest.fn()
  })
);
jest.mock("../../services/WhatsappStatusServices/StatusMediaService", () => ({
  storeStatusMedia: jest.fn(),
  resolveStatusMediaPath: jest.fn(),
  removeStatusMedia: jest.fn()
}));
jest.mock("../../services/WhatsappStatusServices/providers/index", () => ({
  getStatusProvider: jest.fn()
}));
jest.mock("../../models/Whatsapp", () => ({
  __esModule: true,
  default: { findAll: jest.fn(), findOne: jest.fn() }
}));

import "express-async-errors";
import express from "express";
import request from "supertest";
import whatsappStatusRoutes from "../../routes/whatsappStatusRoutes";
import AppError from "../../errors/AppError";
import Whatsapp from "../../models/Whatsapp";
import { isStatusEnabled } from "../../services/WhatsappStatusServices/StatusFeatureService";
import {
  cancelPost,
  createPost,
  listPosts,
  publishPost,
  showPost,
  updatePost
} from "../../services/WhatsappStatusServices/StatusPostService";
import {
  removeStatusMedia,
  resolveStatusMediaPath,
  storeStatusMedia
} from "../../services/WhatsappStatusServices/StatusMediaService";
import { previewAudience } from "../../services/WhatsappStatusServices/StatusAudienceService";
import { getStatusProvider } from "../../services/WhatsappStatusServices/providers/index";

const app = express();
app.use(express.json());
app.use(whatsappStatusRoutes);
// Same AppError → JSON mapping as app.ts.
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
);

const notFound = () => new AppError("ERR_STATUS_NOT_FOUND", 404);

// Posts of company 1 only; any other company gets a 404, like the service.
const ownedPost = {
  id: 3,
  companyId: 1,
  state: "draft",
  kind: "image",
  mediaPath: "whatsapp-status/1/abc.jpg",
  mediaMime: "image/jpeg"
};
const byOwner =
  (result: unknown) =>
  async (companyId: number, id: number): Promise<unknown> => {
    if (companyId !== 1 || id !== 3) throw notFound();
    return result;
  };

let tmpDir: string;
let mediaFile: string;
const mediaBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3]);

beforeAll(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "status-routes-"));
  // .bin extension proves the Content-Type comes from mediaMime, not the file name.
  mediaFile = path.join(tmpDir, "stored.bin");
  fs.writeFileSync(mediaFile, mediaBytes);
});

afterAll(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

beforeEach(() => {
  jest.clearAllMocks();
  (isStatusEnabled as jest.Mock).mockResolvedValue(true);
  (showPost as jest.Mock).mockImplementation(byOwner(ownedPost));
  (publishPost as jest.Mock).mockImplementation(
    byOwner({ ...ownedPost, state: "queued" })
  );
  (cancelPost as jest.Mock).mockImplementation(
    byOwner({ ...ownedPost, state: "cancelled" })
  );
  (resolveStatusMediaPath as jest.Mock).mockImplementation(
    (companyId: number, mediaPath: string) => {
      if (mediaPath !== `whatsapp-status/${companyId}/abc.jpg`)
        throw notFound();
      return mediaFile;
    }
  );
  (createPost as jest.Mock).mockImplementation(async (_c, _u, input) => ({
    id: 10,
    state: "draft",
    mediaPath: input.media?.mediaPath ?? null
  }));
});

it("returns 403 ERR_STATUS_FEATURE_DISABLED for a tenant that is switched off", async () => {
  (isStatusEnabled as jest.Mock).mockResolvedValue(false);

  const responses = await Promise.all([
    request(app).get("/whatsapp-status/connections"),
    request(app).get("/whatsapp-status/posts"),
    request(app)
      .post("/whatsapp-status/posts")
      .set("Idempotency-Key", "k1")
      .send({ kind: "text" }),
    request(app).post("/whatsapp-status/posts/3/publish").send({}),
    request(app).get("/whatsapp-status/posts/3/media")
  ]);

  responses.forEach(response => {
    expect(response.status).toBe(403);
    expect(response.body).toEqual({ error: "ERR_STATUS_FEATURE_DISABLED" });
  });
  expect(isStatusEnabled).toHaveBeenCalledWith(1);
  expect(listPosts).not.toHaveBeenCalled();
  expect(createPost).not.toHaveBeenCalled();
  expect(publishPost).not.toHaveBeenCalled();
  expect(Whatsapp.findAll).not.toHaveBeenCalled();
});

it("returns 404 for a post id of another company on publish, cancel and media", async () => {
  const asCompany2 = (req: request.Test) => req.set("x-test-company", "2");

  const publish = await asCompany2(
    request(app).post("/whatsapp-status/posts/3/publish")
  ).send({ companyId: 1 });
  const cancel = await asCompany2(
    request(app).post("/whatsapp-status/posts/3/cancel")
  ).send({ companyId: 1 });
  const media = await asCompany2(
    request(app).get("/whatsapp-status/posts/3/media?download=1")
  );

  [publish, cancel, media].forEach(response => {
    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: "ERR_STATUS_NOT_FOUND" });
  });
  // companyId always comes from req.user, never from the body.
  expect(publishPost).toHaveBeenCalledWith(2, 3, { scheduledAt: null });
  expect(cancelPost).toHaveBeenCalledWith(2, 3);
  expect(showPost).toHaveBeenCalledWith(2, 3);
  expect(resolveStatusMediaPath).not.toHaveBeenCalled();
});

it("requires Idempotency-Key on create", async () => {
  const missing = await request(app)
    .post("/whatsapp-status/posts")
    .send({ whatsappId: 4, kind: "text", body: "Oi" });
  expect(missing.status).toBe(400);
  expect(missing.body).toEqual({ error: "ERR_STATUS_IDEMPOTENCY_REQUIRED" });
  expect(createPost).not.toHaveBeenCalled();

  const created = await request(app)
    .post("/whatsapp-status/posts")
    .set("Idempotency-Key", "key-123")
    .field("whatsappId", "4")
    .field("kind", "text")
    .field("body", "Oi")
    .field("backgroundColor", "#024BF4")
    .field("font", "1")
    .field("audienceMode", "contact_list")
    .field("contactListId", "");
  expect(created.status).toBe(201);
  expect(created.body).toEqual({ id: 10, state: "draft", serialized: true });
  expect(createPost).toHaveBeenCalledWith(1, 5, {
    whatsappId: 4,
    kind: "text",
    body: "Oi",
    backgroundColor: "#024BF4",
    font: 1,
    audienceMode: "contact_list",
    contactListId: null,
    idempotencyKey: "key-123",
    media: null
  });
});

it("stores uploaded media for the user's company before creating the post", async () => {
  (storeStatusMedia as jest.Mock).mockImplementation(
    async (_companyId, _kind, tmpPath: string) => {
      fs.unlinkSync(tmpPath);
      return {
        mediaPath: "whatsapp-status/1/new.jpg",
        mediaMime: "image/jpeg"
      };
    }
  );

  const response = await request(app)
    .post("/whatsapp-status/posts")
    .set("Idempotency-Key", "key-img")
    .field("whatsappId", "4")
    .field("kind", "image")
    .field("body", "")
    .field("audienceMode", "connection_contacts")
    .attach("media", Buffer.from([0x89, 0x50, 0x4e, 0x47]), "photo.png");

  expect(response.status).toBe(201);
  expect(storeStatusMedia).toHaveBeenCalledWith(
    1,
    "image",
    expect.stringContaining(os.tmpdir())
  );
  expect(createPost).toHaveBeenCalledWith(
    1,
    5,
    expect.objectContaining({
      kind: "image",
      body: null,
      media: { mediaPath: "whatsapp-status/1/new.jpg", mediaMime: "image/jpeg" }
    })
  );
  expect(removeStatusMedia).not.toHaveBeenCalled();
});

it("rejects uploads above the size limit with ERR_STATUS_MEDIA_TOO_LARGE", async () => {
  const response = await request(app)
    .post("/whatsapp-status/posts")
    .set("Idempotency-Key", "key-big")
    .field("whatsappId", "4")
    .field("kind", "image")
    .field("audienceMode", "connection_contacts")
    .attach("media", Buffer.alloc(4096, 1), "big.jpg");

  expect(response.status).toBe(413);
  expect(response.body).toEqual({ error: "ERR_STATUS_MEDIA_TOO_LARGE" });
  expect(storeStatusMedia).not.toHaveBeenCalled();
  expect(createPost).not.toHaveBeenCalled();
});

it("streams media only for the owner company with its mime type", async () => {
  const inline = await request(app).get("/whatsapp-status/posts/3/media");
  expect(inline.status).toBe(200);
  expect(inline.headers["content-type"]).toBe("image/jpeg");
  expect(inline.headers["content-disposition"]).toBeUndefined();
  expect(inline.body.toString("hex")).toBe(
    Buffer.from(mediaBytes).toString("hex")
  );
  expect(showPost).toHaveBeenCalledWith(1, 3);
  expect(resolveStatusMediaPath).toHaveBeenCalledWith(
    1,
    "whatsapp-status/1/abc.jpg"
  );

  const download = await request(app).get(
    "/whatsapp-status/posts/3/media?download=1"
  );
  expect(download.status).toBe(200);
  expect(download.headers["content-type"]).toBe("image/jpeg");
  expect(download.headers["content-disposition"]).toBe(
    'attachment; filename="status-3.jpg"'
  );

  const other = await request(app)
    .get("/whatsapp-status/posts/3/media")
    .set("x-test-company", "2");
  expect(other.status).toBe(404);
  expect(other.body).toEqual({ error: "ERR_STATUS_NOT_FOUND" });

  (showPost as jest.Mock).mockResolvedValueOnce({
    ...ownedPost,
    kind: "text",
    mediaPath: null,
    mediaMime: null
  });
  const noMedia = await request(app).get("/whatsapp-status/posts/3/media");
  expect(noMedia.status).toBe(404);
  expect(noMedia.body).toEqual({ error: "ERR_STATUS_NOT_FOUND" });
});

it("lists only connections of the user's company with capabilities", async () => {
  const connections = [
    { id: 4, name: "QR", apiMode: "baileys", status: "CONNECTED" },
    { id: 6, name: "Cloud", apiMode: "official", status: "CONNECTED" }
  ];
  (Whatsapp.findAll as jest.Mock).mockResolvedValue(connections);
  const capabilities = jest.fn(connection =>
    connection.apiMode === "official"
      ? {
          publishStatus: false,
          kinds: [],
          reason: "OFFICIAL_API",
          manualExport: true,
          ownPostsSync: false
        }
      : {
          publishStatus: true,
          kinds: ["text", "image", "video"],
          reason: null,
          manualExport: false,
          ownPostsSync: false
        }
  );
  (getStatusProvider as jest.Mock).mockReturnValue({ capabilities });

  const response = await request(app)
    .get("/whatsapp-status/connections")
    .set("x-test-company", "7");

  expect(response.status).toBe(200);
  expect(Whatsapp.findAll).toHaveBeenCalledWith(
    expect.objectContaining({ where: { companyId: 7 } })
  );
  expect(response.body).toEqual([
    {
      id: 4,
      name: "QR",
      number: null,
      apiMode: "baileys",
      status: "CONNECTED",
      capabilities: {
        publishStatus: true,
        kinds: ["text", "image", "video"],
        reason: null,
        manualExport: false,
        ownPostsSync: false
      }
    },
    {
      id: 6,
      name: "Cloud",
      number: null,
      apiMode: "official",
      status: "CONNECTED",
      capabilities: {
        publishStatus: false,
        kinds: [],
        reason: "OFFICIAL_API",
        manualExport: true,
        ownPostsSync: false
      }
    }
  ]);
  expect(getStatusProvider).toHaveBeenCalledWith(connections[0]);
  expect(capabilities).toHaveBeenCalledWith(connections[1]);
});

it("returns 404 for audience preview on another company's connection", async () => {
  (Whatsapp.findOne as jest.Mock).mockResolvedValue(null);
  const foreign = await request(app).get(
    "/whatsapp-status/audience-preview?whatsappId=9&audienceMode=connection_contacts"
  );
  expect(foreign.status).toBe(404);
  expect(foreign.body).toEqual({ error: "ERR_STATUS_NOT_FOUND" });
  expect(Whatsapp.findOne).toHaveBeenCalledWith(
    expect.objectContaining({ where: { id: 9, companyId: 1 } })
  );
  expect(previewAudience).not.toHaveBeenCalled();

  (Whatsapp.findOne as jest.Mock).mockResolvedValue({ id: 4, companyId: 1 });
  (previewAudience as jest.Mock).mockResolvedValue({
    count: 2,
    sample: ["Ana", "João"]
  });
  const own = await request(app).get(
    "/whatsapp-status/audience-preview?whatsappId=4&audienceMode=contact_list&contactListId=12"
  );
  expect(own.status).toBe(200);
  expect(own.body).toEqual({ count: 2, sample: ["Ana", "João"] });
  expect(previewAudience).toHaveBeenCalledWith({
    companyId: 1,
    whatsappId: 4,
    audienceMode: "contact_list",
    contactListId: 12
  });
});

it("lists, updates and schedules posts of the user's company", async () => {
  (listPosts as jest.Mock).mockResolvedValue([{ id: 1, state: "published" }]);
  const list = await request(app).get(
    "/whatsapp-status/posts?whatsappId=4&active=true"
  );
  expect(list.status).toBe(200);
  expect(list.body).toEqual([{ id: 1, state: "published", serialized: true }]);
  expect(listPosts).toHaveBeenCalledWith(1, { whatsappId: 4, active: true });

  (updatePost as jest.Mock).mockResolvedValue({ id: 3, state: "draft" });
  const updated = await request(app)
    .put("/whatsapp-status/posts/3")
    .send({ body: "Novo texto", font: "2" });
  expect(updated.status).toBe(200);
  expect(updatePost).toHaveBeenCalledWith(1, 3, {
    body: "Novo texto",
    font: 2
  });

  const scheduledAt = "2026-10-20T12:00:00.000Z";
  const scheduled = await request(app)
    .post("/whatsapp-status/posts/3/publish")
    .send({ scheduledAt });
  expect(scheduled.status).toBe(200);
  expect(scheduled.body).toEqual({ id: 3, state: "queued", serialized: true });
  expect(publishPost).toHaveBeenCalledWith(1, 3, {
    scheduledAt: new Date(scheduledAt)
  });

  const invalid = await request(app)
    .post("/whatsapp-status/posts/3/publish")
    .send({ scheduledAt: "not-a-date" });
  expect(invalid.status).toBe(400);
  expect(invalid.body).toEqual({ error: "ERR_STATUS_SCHEDULE_INVALID" });
});
