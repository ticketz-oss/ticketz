import { Router } from "express";
import isAuth from "../middleware/isAuth";

import * as QueueOptionController from "../controllers/QueueOptionController";
import multer from "multer";
import uploadConfig from "../config/upload";

const upload = multer(uploadConfig);

const queueOptionRoutes = Router();

queueOptionRoutes.get("/queue-options", isAuth, QueueOptionController.index);

queueOptionRoutes.post("/queue-options", isAuth, QueueOptionController.store);

queueOptionRoutes.get("/queue-options/:queueOptionId", isAuth, QueueOptionController.show);

queueOptionRoutes.put("/queue-options/:queueOptionId", isAuth, QueueOptionController.update);

queueOptionRoutes.delete("/queue-options/:queueOptionId", isAuth, QueueOptionController.remove);

queueOptionRoutes.post(
    "/queue-options/:queueOptionId/media-upload",
    isAuth,
    upload.array("file"),
    QueueOptionController.mediaUpload
  );
  
  queueOptionRoutes.delete(
    "/queue-options/:queueOptionId/media-upload",
    isAuth,
    QueueOptionController.deleteMedia
  );
export default queueOptionRoutes;
