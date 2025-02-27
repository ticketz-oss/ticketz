import { Router } from "express";
import multer from "multer";
import isAuth from "../middleware/isAuth";
import isAdmin from "../middleware/isAdmin";

import * as QueueController from "../controllers/QueueController";
import uploadConfig from "../config/upload";
import apiTokenAuth from "../middleware/apiTokenAuth";

const upload = multer(uploadConfig);
const queueRoutes = Router();

queueRoutes.get("/queue", apiTokenAuth, isAuth, QueueController.index);

queueRoutes.post(
  "/queue",
  apiTokenAuth,
  isAuth,
  isAdmin,
  QueueController.store
);

queueRoutes.get("/queue/:queueId", apiTokenAuth, isAuth, QueueController.show);

queueRoutes.put(
  "/queue/:queueId",
  apiTokenAuth,
  isAuth,
  isAdmin,
  QueueController.update
);

queueRoutes.delete(
  "/queue/:queueId",
  apiTokenAuth,
  isAuth,
  isAdmin,
  QueueController.remove
);

queueRoutes.post(
  "/queue/:queueId/media-upload",
  apiTokenAuth,
  isAuth,
  isAdmin,
  upload.array("file"),
  QueueController.mediaUpload
);

queueRoutes.delete(
  "/queue/:queueId/media-upload",
  apiTokenAuth,
  isAuth,
  isAdmin,
  QueueController.deleteMedia
);

export default queueRoutes;
