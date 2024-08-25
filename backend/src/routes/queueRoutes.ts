import { Router } from "express";
import multer from "multer";
import isAuth from "../middleware/isAuth";
import isAdmin from "../middleware/isAdmin";

import * as QueueController from "../controllers/QueueController";
import uploadConfig from "../config/upload";

const upload = multer(uploadConfig);
const queueRoutes = Router();

queueRoutes.get("/queue", isAuth, QueueController.index);

queueRoutes.post("/queue", isAuth, isAdmin, QueueController.store);

queueRoutes.get("/queue/:queueId", isAuth, QueueController.show);

queueRoutes.put("/queue/:queueId", isAuth, isAdmin, QueueController.update);

queueRoutes.delete("/queue/:queueId", isAuth, isAdmin, QueueController.remove);

queueRoutes.post(
  "/queue/:queueId/media-upload",
  isAuth,
  isAdmin,
  upload.array("file"),
  QueueController.mediaUpload
);

queueRoutes.delete(
  "/queue/:queueId/media-upload",
  isAuth,
  isAdmin,
  QueueController.deleteMedia
);

export default queueRoutes;
