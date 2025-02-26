import { Router } from "express";
import multer from "multer";
import isAuth from "../middleware/isAuth";
import isAdmin from "../middleware/isAdmin";
import apiTokenAuth from "../middleware/apiTokenAuth";

import * as QueueOptionController from "../controllers/QueueOptionController";
import uploadConfig from "../config/upload";

const upload = multer(uploadConfig);

const queueOptionRoutes = Router();

queueOptionRoutes.get(
  "/queue-options",
  apiTokenAuth,
  isAuth,
  isAdmin,
  QueueOptionController.index
);

queueOptionRoutes.post(
  "/queue-options",
  apiTokenAuth,
  isAuth,
  isAdmin,
  QueueOptionController.store
);

queueOptionRoutes.get(
  "/queue-options/:queueOptionId",
  apiTokenAuth,
  isAuth,
  isAdmin,
  QueueOptionController.show
);

queueOptionRoutes.put(
  "/queue-options/:queueOptionId",
  apiTokenAuth,
  isAuth,
  isAdmin,
  QueueOptionController.update
);

queueOptionRoutes.delete(
  "/queue-options/:queueOptionId",
  apiTokenAuth,
  isAuth,
  isAdmin,
  QueueOptionController.remove
);

queueOptionRoutes.post(
  "/queue-options/:queueOptionId/media-upload",
  apiTokenAuth,
  isAuth,
  isAdmin,
  upload.array("file"),
  QueueOptionController.mediaUpload
);

queueOptionRoutes.delete(
  "/queue-options/:queueOptionId/media-upload",
  apiTokenAuth,
  isAuth,
  isAdmin,
  QueueOptionController.deleteMedia
);
export default queueOptionRoutes;
