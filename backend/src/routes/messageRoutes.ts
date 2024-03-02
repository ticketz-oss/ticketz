import { Router } from "express";
import multer from "multer";
import isAuth from "../middleware/isAuth";
import uploadConfig from "../config/upload";
import tokenAuth from "../middleware/tokenAuth";

import * as MessageController from "../controllers/MessageController";

const messageRoutes = Router();

const upload = multer(uploadConfig);

messageRoutes.get("/messages/:ticketId", isAuth, MessageController.index);

messageRoutes.post(
  "/messages/:ticketId",
  isAuth,
  upload.array("medias"),
  MessageController.store
);

messageRoutes.post("/messages/edit/:messageId", isAuth, MessageController.edit);

messageRoutes.delete("/messages/:messageId", isAuth, MessageController.remove);

messageRoutes.post("/api/messages/send",
  tokenAuth,
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
