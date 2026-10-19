import os from "os";
import { NextFunction, Request, Response, Router } from "express";
import multer from "multer";
import isAuth from "../middleware/isAuth";
import isWhatsappStatusEnabled from "../middleware/isWhatsappStatusEnabled";
import AppError from "../errors/AppError";
import * as WhatsappStatusController from "../controllers/WhatsappStatusController";

const routes = Router();

const megabytes = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

// Coarse ceiling for the temp upload; storeStatusMedia applies the per-kind limit.
const maxUploadBytes = Math.floor(
  Math.max(
    megabytes(process.env.WHATSAPP_STATUS_MAX_IMAGE_MB, 5),
    megabytes(process.env.WHATSAPP_STATUS_MAX_VIDEO_MB, 20)
  ) *
    1024 *
    1024
);

const upload = multer({
  storage: multer.diskStorage({ destination: os.tmpdir() }),
  limits: { fileSize: maxUploadBytes, files: 1 }
});

const statusMediaUpload = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  upload.single("media")(req, res, err => {
    if (!err) return next();
    if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
      return next(new AppError("ERR_STATUS_MEDIA_TOO_LARGE", 413));
    }
    return next(new AppError("ERR_STATUS_MEDIA_INVALID", 400));
  });
};

// Rejects before multer writes anything to disk.
const requireIdempotencyKey = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  if (!req.get("Idempotency-Key")?.trim()) {
    throw new AppError("ERR_STATUS_IDEMPOTENCY_REQUIRED", 400);
  }
  next();
};

const guard = [isAuth, isWhatsappStatusEnabled];

routes.get(
  "/whatsapp-status/connections",
  ...guard,
  WhatsappStatusController.listConnections
);

routes.get(
  "/whatsapp-status/connections/:whatsappId/capabilities",
  ...guard,
  WhatsappStatusController.connectionCapabilities
);

routes.get(
  "/whatsapp-status/audience-preview",
  ...guard,
  WhatsappStatusController.audiencePreview
);

routes.get(
  "/whatsapp-status/posts",
  ...guard,
  WhatsappStatusController.listPosts
);

routes.post(
  "/whatsapp-status/posts",
  ...guard,
  requireIdempotencyKey,
  statusMediaUpload,
  WhatsappStatusController.createPost
);

routes.put(
  "/whatsapp-status/posts/:id",
  ...guard,
  statusMediaUpload,
  WhatsappStatusController.updatePost
);

routes.post(
  "/whatsapp-status/posts/:id/publish",
  ...guard,
  WhatsappStatusController.publishPost
);

routes.post(
  "/whatsapp-status/posts/:id/cancel",
  ...guard,
  WhatsappStatusController.cancelPost
);

routes.get(
  "/whatsapp-status/posts/:id/media",
  ...guard,
  WhatsappStatusController.showMedia
);

export default routes;
