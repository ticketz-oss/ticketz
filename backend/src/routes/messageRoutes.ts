import { Router } from "express";
import multer from "multer";
import isAuth from "../middleware/isAuth";
import uploadConfig from "../config/upload";
import tokenAuth from "../middleware/tokenAuth";

import * as MessageController from "../controllers/MessageController";
import isCompliant from "../middleware/isCompliant";
import gammuAuth from "../middleware/gammuAuth";
import isAdmin from "../middleware/isAdmin";

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
  isCompliant,
  MessageController.index
);

messageRoutes.post(
  "/messages/:ticketId",
  isAuth,
  isCompliant,
  upload.array("medias"),
  MessageController.store
);

messageRoutes.post(
  "/messages/edit/:messageId",
  isAuth,
  isCompliant,
  MessageController.edit
);

messageRoutes.post(
  "/messages/react/:messageId",
  isAuth,
  isCompliant,
  MessageController.react
);

messageRoutes.delete(
  "/messages/:messageId",
  isAuth,
  isCompliant,
  MessageController.remove
);

messageRoutes.post(
  "/api/messages/send",
  tokenAuth,
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
  isCompliant,
  MessageController.send
);

export default messageRoutes;
