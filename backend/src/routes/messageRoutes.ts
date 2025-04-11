import { Router } from "express";
import multer from "multer";
import isAuth from "../middleware/isAuth";
import uploadConfig from "../config/upload";
import tokenAuth from "../middleware/tokenAuth";

import * as MessageController from "../controllers/MessageController";
import isCompliant from "../middleware/isCompliant";

const messageRoutes = Router();

const upload = multer(uploadConfig);

messageRoutes.post(
  "/messages/forward",
  isAuth,
  isCompliant,
  MessageController.forward
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

/* * /
messageRoutes.get("/api/messages/sendGammu",
  basicAuth,
  MessageController.sendGammu);
);
/* */

export default messageRoutes;
