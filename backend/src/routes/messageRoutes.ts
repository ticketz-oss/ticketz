import { Router } from "express";
import multer from "multer";
import isAuth from "../middleware/isAuth";
import uploadConfig from "../config/upload";
import tokenAuth from "../middleware/tokenAuth";

import * as MessageController from "../controllers/MessageController";
import isCompliant from "../middleware/isCompliant";
import gammuAuth from "../middleware/gammuAuth";
import isAdmin from "../middleware/isAdmin";

import { checkSubscription } from "../ticketzPro/middleware/checkSubscription";

const messageRoutes = Router();

const upload = multer(uploadConfig);

messageRoutes.post(
  "/messages/forward",
  isAuth,
  isCompliant,
  MessageController.forward
);

messageRoutes.get(
  "/messages/history/:contactId/:whatsappId",
  isAuth,
  isAdmin,
  isCompliant,
  MessageController.history
);

messageRoutes.get(
  "/messages/:ticketId",
  isAuth,
  checkSubscription,
  isCompliant,
  MessageController.index
);

messageRoutes.post(
  "/messages/:ticketId",
  isAuth,
  checkSubscription,
  isCompliant,
  upload.array("medias"),
  MessageController.store
);

messageRoutes.post(
  "/messages/edit/:messageId",
  isAuth,
  checkSubscription,
  isCompliant,
  MessageController.edit
);

messageRoutes.post(
  "/messages/react/:messageId",
  isAuth,
  checkSubscription,
  isCompliant,
  MessageController.react
);

messageRoutes.delete(
  "/messages/:messageId",
  isAuth,
  checkSubscription,
  isCompliant,
  MessageController.remove
);

messageRoutes.post(
  "/api/messages/send",
  tokenAuth,
  checkSubscription,
  isCompliant,
  upload.array("medias"),
  MessageController.send
);

messageRoutes.get(
  "/api/messages/send",
  gammuAuth,
  checkSubscription,
  isCompliant,
  MessageController.send
);

export default messageRoutes;
