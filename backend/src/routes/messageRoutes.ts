import { Router } from "express";
import multer from "multer";
import isAuth from "../middleware/isAuth";
import uploadConfig from "../config/upload";
import tokenAuth from "../middleware/tokenAuth";

import * as MessageController from "../controllers/MessageController";
import isCompliant from "../middleware/isCompliant";
import gammuAuth from "../middleware/gammuAuth";
import isAdmin from "../middleware/isAdmin";
import apiTokenAuth from "../middleware/apiTokenAuth";

import { checkSubscription } from "../ticketzPro/middleware/checkSubscription";

const messageRoutes = Router();

const upload = multer(uploadConfig);

messageRoutes.post(
  "/messages/forward",
  apiTokenAuth,
  isAuth,
  isCompliant,
  MessageController.forward
);

messageRoutes.get(
  "/messages/history/:contactId/:whatsappId",
  apiTokenAuth,
  isAuth,
  isAdmin,
  isCompliant,
  MessageController.history
);

messageRoutes.get(
  "/messages/:ticketId",
  apiTokenAuth,
  isAuth,
  checkSubscription,
  isCompliant,
  MessageController.index
);

messageRoutes.post(
  "/messages/:ticketId",
  apiTokenAuth,
  isAuth,
  checkSubscription,
  isCompliant,
  upload.array("medias"),
  MessageController.store
);

messageRoutes.post(
  "/messages/edit/:messageId",
  apiTokenAuth,
  isAuth,
  checkSubscription,
  isCompliant,
  MessageController.edit
);

messageRoutes.post(
  "/messages/react/:messageId",
  apiTokenAuth,
  isAuth,
  checkSubscription,
  isCompliant,
  MessageController.react
);

messageRoutes.delete(
  "/messages/:messageId",
  apiTokenAuth,
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

// wsw compatibility

["Image", "Audio", "Video", "Document"].forEach(type => {
  messageRoutes.post(
    `/api/messages/sendURL${type}`,
    tokenAuth,
    isCompliant,
    MessageController.send
  );
});

messageRoutes.get(
  "/api/messages/send",
  gammuAuth,
  checkSubscription,
  isCompliant,
  MessageController.send
);

export default messageRoutes;
