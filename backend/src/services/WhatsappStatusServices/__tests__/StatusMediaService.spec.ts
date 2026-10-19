import fs from "fs";
import os from "os";
import path from "path";
import sharp from "sharp";
import { Op } from "sequelize";
import privateFiles from "../../../config/privateFiles";
import WhatsappStatusPost from "../../../models/WhatsappStatusPost";
import {
  sniffMime,
  storeStatusMedia,
  maxVideoBytes,
  resolveStatusMediaPath,
  cleanupOrphanStatusMedia
} from "../StatusMediaService";

jest.mock("../../../config/privateFiles", () => {
  const mockFs = jest.requireActual<typeof import("fs")>("fs");
  const mockPath = jest.requireActual<typeof import("path")>("path");
  const mockOs = jest.requireActual<typeof import("os")>("os");
  return {
    __esModule: true,
    default: {
      directory: mockFs.mkdtempSync(
        mockPath.join(mockOs.tmpdir(), "ticketz-status-media-test-")
      )
    }
  };
});
jest.mock("../../../models/WhatsappStatusPost", () => ({
  __esModule: true,
  default: { findAll: jest.fn(), update: jest.fn() }
}));

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "ticketz-status-tmp-"));
let tmpCounter = 0;

const writeTmp = (content: Buffer, ext: string): string => {
  tmpCounter += 1;
  const file = path.join(tmpDir, `upload-${tmpCounter}${ext}`);
  fs.writeFileSync(file, new Uint8Array(content));
  return file;
};

const pngBuffer = () =>
  sharp({
    create: { width: 4, height: 4, channels: 3, background: "#fff" }
  })
    .png()
    .toBuffer();

const mp4Buffer = (): Buffer => {
  const buffer = Buffer.alloc(32);
  buffer.writeUInt32BE(32, 0);
  buffer.write("ftypisom", 4, "ascii");
  return buffer;
};

const expectAppError = async (
  promise: Promise<unknown>,
  message: string,
  statusCode: number
) => {
  await expect(promise).rejects.toMatchObject({ message, statusCode });
};

describe("StatusMediaService", () => {
  const originalImageMb = process.env.WHATSAPP_STATUS_MAX_IMAGE_MB;
  const originalVideoMb = process.env.WHATSAPP_STATUS_MAX_VIDEO_MB;

  afterEach(() => {
    if (originalImageMb === undefined) {
      delete process.env.WHATSAPP_STATUS_MAX_IMAGE_MB;
    } else {
      process.env.WHATSAPP_STATUS_MAX_IMAGE_MB = originalImageMb;
    }
    if (originalVideoMb === undefined) {
      delete process.env.WHATSAPP_STATUS_MAX_VIDEO_MB;
    } else {
      process.env.WHATSAPP_STATUS_MAX_VIDEO_MB = originalVideoMb;
    }
  });

  afterAll(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    fs.rmSync(privateFiles.directory, { recursive: true, force: true });
  });

  it("sniffs JPEG, PNG, WEBP and MP4 by their bytes", async () => {
    expect(sniffMime(await pngBuffer())).toBe("image/png");
    expect(
      sniffMime(
        await sharp({
          create: { width: 4, height: 4, channels: 3, background: "#fff" }
        })
          .jpeg()
          .toBuffer()
      )
    ).toBe("image/jpeg");
    expect(
      sniffMime(
        await sharp({
          create: { width: 4, height: 4, channels: 3, background: "#fff" }
        })
          .webp()
          .toBuffer()
      )
    ).toBe("image/webp");
    expect(sniffMime(mp4Buffer())).toBe("video/mp4");
    expect(sniffMime(Buffer.from("hello world, not media"))).toBeNull();
    expect(sniffMime(Buffer.alloc(2))).toBeNull();
  });

  it("accepts a real PNG and stores it as JPEG under the company folder", async () => {
    const tmpFile = writeTmp(await pngBuffer(), ".png");

    const result = await storeStatusMedia(7, "image", tmpFile);

    expect(result.mediaPath).toMatch(/^whatsapp-status\/7\/[0-9a-f-]+\.jpg$/);
    expect(result.mediaMime).toBe("image/jpeg");
    const stored = fs.readFileSync(
      path.join(privateFiles.directory, result.mediaPath)
    );
    expect(sniffMime(stored)).toBe("image/jpeg");
    expect(fs.existsSync(tmpFile)).toBe(false);
  });

  it("stores an MP4 as kind video", async () => {
    const tmpFile = writeTmp(mp4Buffer(), ".mp4");

    const result = await storeStatusMedia(7, "video", tmpFile);

    expect(result.mediaPath).toMatch(/^whatsapp-status\/7\/[0-9a-f-]+\.mp4$/);
    expect(result.mediaMime).toBe("video/mp4");
    expect(fs.existsSync(tmpFile)).toBe(false);
  });

  it("accepts a 17.6 MB video and rejects one above the 20 MB default", async () => {
    delete process.env.WHATSAPP_STATUS_MAX_VIDEO_MB;
    expect(maxVideoBytes()).toBe(20 * 1024 * 1024);

    const accepted = Buffer.alloc(Math.ceil(17.6 * 1024 * 1024));
    accepted.write("ftypisom", 4, "ascii");
    const acceptedFile = writeTmp(accepted, ".mp4");
    const stored = await storeStatusMedia(7, "video", acceptedFile);
    expect(
      fs.statSync(path.join(privateFiles.directory, stored.mediaPath)).size
    ).toBe(accepted.length);
    expect(fs.existsSync(acceptedFile)).toBe(false);

    const rejected = Buffer.alloc(maxVideoBytes() + 1);
    rejected.write("ftypisom", 4, "ascii");
    const rejectedFile = writeTmp(rejected, ".mp4");
    await expectAppError(
      storeStatusMedia(7, "video", rejectedFile),
      "ERR_STATUS_MEDIA_TOO_LARGE",
      413
    );
    expect(fs.existsSync(rejectedFile)).toBe(false);
  });

  it("rejects a text file renamed to .jpg with ERR_STATUS_MEDIA_INVALID and deletes the temp file", async () => {
    const tmpFile = writeTmp(Buffer.from("just some text, honest"), ".jpg");

    await expectAppError(
      storeStatusMedia(7, "image", tmpFile),
      "ERR_STATUS_MEDIA_INVALID",
      400
    );
    expect(fs.existsSync(tmpFile)).toBe(false);
  });

  it("rejects a video sent as kind image", async () => {
    const tmpFile = writeTmp(mp4Buffer(), ".jpg");

    await expectAppError(
      storeStatusMedia(7, "image", tmpFile),
      "ERR_STATUS_MEDIA_INVALID",
      400
    );
    expect(fs.existsSync(tmpFile)).toBe(false);
  });

  it("rejects an image sent as kind video", async () => {
    const tmpFile = writeTmp(await pngBuffer(), ".mp4");

    await expectAppError(
      storeStatusMedia(7, "video", tmpFile),
      "ERR_STATUS_MEDIA_INVALID",
      400
    );
    expect(fs.existsSync(tmpFile)).toBe(false);
  });

  it("rejects files above WHATSAPP_STATUS_MAX_IMAGE_MB with ERR_STATUS_MEDIA_TOO_LARGE", async () => {
    process.env.WHATSAPP_STATUS_MAX_IMAGE_MB = "1";
    const png = await pngBuffer();
    const tmpFile = writeTmp(
      Buffer.concat([new Uint8Array(png), new Uint8Array(1024 * 1024 + 1)]),
      ".png"
    );

    await expectAppError(
      storeStatusMedia(7, "image", tmpFile),
      "ERR_STATUS_MEDIA_TOO_LARGE",
      413
    );
    expect(fs.existsSync(tmpFile)).toBe(false);
  });

  it("refuses to resolve another company's media or a ../ path", () => {
    const own = resolveStatusMediaPath(7, "whatsapp-status/7/x.jpg");
    expect(own).toBe(
      path.join(privateFiles.directory, "whatsapp-status", "7", "x.jpg")
    );

    expect(() => resolveStatusMediaPath(8, "whatsapp-status/7/x.jpg")).toThrow(
      expect.objectContaining({
        message: "ERR_STATUS_NOT_FOUND",
        statusCode: 404
      })
    );
    expect(() =>
      resolveStatusMediaPath(8, "whatsapp-status/8/../7/x.jpg")
    ).toThrow(expect.objectContaining({ message: "ERR_STATUS_NOT_FOUND" }));
    expect(() =>
      resolveStatusMediaPath(8, "whatsapp-status/8/../../../etc/passwd")
    ).toThrow(expect.objectContaining({ message: "ERR_STATUS_NOT_FOUND" }));
  });

  it("removes orphan files older than 24h and keeps referenced ones", async () => {
    const now = new Date();
    const companyDir = path.join(
      privateFiles.directory,
      "whatsapp-status",
      "9"
    );
    fs.mkdirSync(companyDir, { recursive: true });
    const old = new Date(now.getTime() - 25 * 60 * 60 * 1000);

    const orphan = path.join(companyDir, "orphan.jpg");
    const referenced = path.join(companyDir, "referenced.jpg");
    const fresh = path.join(companyDir, "fresh.jpg");
    const expired = path.join(companyDir, "expired.mp4");
    [orphan, referenced, fresh, expired].forEach(file =>
      fs.writeFileSync(file, "x")
    );
    [orphan, referenced, expired].forEach(file =>
      fs.utimesSync(file, old, old)
    );

    const expiredPost = {
      id: 31,
      companyId: 9,
      mediaPath: "whatsapp-status/9/expired.mp4",
      update: jest.fn().mockResolvedValue(undefined)
    };
    (WhatsappStatusPost.findAll as jest.Mock)
      .mockResolvedValue([])
      .mockResolvedValueOnce([
        { mediaPath: "whatsapp-status/9/referenced.jpg" },
        { mediaPath: "whatsapp-status/9/expired.mp4" }
      ])
      .mockResolvedValueOnce([expiredPost]);

    const removed = await cleanupOrphanStatusMedia(now);

    expect(WhatsappStatusPost.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          [Op.or]: expect.arrayContaining([
            { state: "published", expiresAt: { [Op.lte]: now } }
          ])
        })
      })
    );

    expect(fs.existsSync(orphan)).toBe(false);
    expect(fs.existsSync(referenced)).toBe(true);
    expect(fs.existsSync(fresh)).toBe(true);
    expect(fs.existsSync(expired)).toBe(false);
    expect(expiredPost.update).toHaveBeenCalledWith({ mediaPath: null });
    expect(removed).toBe(2);
  });

  it("cancels drafts and unsupported posts untouched for 7 days and removes their media", async () => {
    const now = new Date();
    const retentionLimit = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const companyDir = path.join(
      privateFiles.directory,
      "whatsapp-status",
      "12"
    );
    fs.mkdirSync(companyDir, { recursive: true });
    const draftFile = path.join(companyDir, "draft.jpg");
    fs.writeFileSync(draftFile, "x");

    const staleDraft = {
      id: 41,
      companyId: 12,
      state: "draft",
      mediaPath: "whatsapp-status/12/draft.jpg"
    };
    const staleUnsupported = {
      id: 42,
      companyId: 12,
      state: "unsupported",
      mediaPath: null
    };
    (WhatsappStatusPost.findAll as jest.Mock).mockImplementation(
      async (options: { where: { state?: Record<symbol, string[]> } }) =>
        options.where.state?.[Op.in]?.includes("draft")
          ? [staleDraft, staleUnsupported]
          : []
    );
    (WhatsappStatusPost.update as jest.Mock).mockResolvedValue([1]);

    await cleanupOrphanStatusMedia(now);

    expect(WhatsappStatusPost.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          state: { [Op.in]: ["draft", "unsupported"] },
          updatedAt: { [Op.lt]: retentionLimit }
        }
      })
    );
    const changes = {
      state: "cancelled",
      failureCode: "ERR_STATUS_EXPIRED_DRAFT",
      mediaPath: null,
      mediaMime: null
    };
    // Conditional, so a draft edited or published meanwhile is kept.
    expect(WhatsappStatusPost.update).toHaveBeenCalledWith(changes, {
      where: {
        id: 41,
        state: "draft",
        updatedAt: { [Op.lt]: retentionLimit }
      }
    });
    expect(WhatsappStatusPost.update).toHaveBeenCalledWith(changes, {
      where: {
        id: 42,
        state: "unsupported",
        updatedAt: { [Op.lt]: retentionLimit }
      }
    });
    expect(fs.existsSync(draftFile)).toBe(false);
  });

  it("keeps the media of a stale draft that was edited meanwhile", async () => {
    const companyDir = path.join(
      privateFiles.directory,
      "whatsapp-status",
      "13"
    );
    fs.mkdirSync(companyDir, { recursive: true });
    const draftFile = path.join(companyDir, "draft.jpg");
    fs.writeFileSync(draftFile, "x");
    (WhatsappStatusPost.findAll as jest.Mock).mockImplementation(
      async (options: { where: { state?: Record<symbol, string[]> } }) =>
        options.where.state?.[Op.in]?.includes("draft")
          ? [
              {
                id: 43,
                companyId: 13,
                state: "draft",
                mediaPath: "whatsapp-status/13/draft.jpg"
              }
            ]
          : []
    );
    (WhatsappStatusPost.update as jest.Mock).mockResolvedValue([0]);

    await cleanupOrphanStatusMedia(new Date());

    expect(fs.existsSync(draftFile)).toBe(true);
  });
});
