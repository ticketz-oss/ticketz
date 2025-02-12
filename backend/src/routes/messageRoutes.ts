import { Router } from "express";
import multer from "multer";
import isAuth from "../middleware/isAuth";
import uploadConfig from "../config/upload";
import tokenAuth from "../middleware/tokenAuth";

import * as MessageController from "../controllers/MessageController";
import gammuAuth from "../middleware/gammuAuth";

import { checkSubscription } from "../ticketzPro/middleware/checkSubscription";

const messageRoutes = Router();

const upload = multer(uploadConfig);

messageRoutes.post("/messages/forward", isAuth, MessageController.forward);

messageRoutes.get(
  "/messages/:ticketId",
  isAuth,
  checkSubscription,
  MessageController.index
);

messageRoutes.post(
  "/messages/:ticketId",
  isAuth,
  checkSubscription,
  upload.array("medias"),
  MessageController.store
);

messageRoutes.post(
  "/messages/edit/:messageId",
  isAuth,
  checkSubscription,
  MessageController.edit
);

messageRoutes.delete(
  "/messages/:messageId",
  isAuth,
  checkSubscription,
  MessageController.remove
);

messageRoutes.post(
  "/api/messages/send",
  tokenAuth,
  checkSubscription,
  upload.array("medias"),
  MessageController.send
);

messageRoutes.get(
  "/api/messages/send",
  gammuAuth,
  checkSubscription,
  MessageController.send
);

export default messageRoutes;
