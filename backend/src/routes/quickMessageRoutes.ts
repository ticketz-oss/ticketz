import multer from "multer";
import express from "express";
import isAuth from "../middleware/isAuth";
import uploadConfig from "../config/upload";

import * as QuickMessageController from "../controllers/QuickMessageController";

const upload = multer(uploadConfig);

const routes = express.Router();

routes.get("/quick-messages/list", isAuth, QuickMessageController.findList);

routes.get("/quick-messages", isAuth, QuickMessageController.index);

routes.get("/quick-messages/:id", isAuth, QuickMessageController.show);

routes.post(
  "/quick-messages",
  isAuth,
  upload.array("file"),
  QuickMessageController.store
);

routes.put(
  "/quick-messages/:id",
  isAuth,
  upload.array("file"),
  QuickMessageController.update
);

routes.delete("/quick-messages/:id", isAuth, QuickMessageController.remove);

export default routes;
