import express from "express";
import multer from "multer";
import isAuth from "../middleware/isAuth";
import uploadConfig from "../config/upload";
import * as ChatController from "../controllers/ChatController";
import apiTokenAuth from "../middleware/apiTokenAuth";

const upload = multer(uploadConfig);

const routes = express.Router();

routes.get("/chats", apiTokenAuth, isAuth, ChatController.index);

routes.get("/chats/:id", apiTokenAuth, isAuth, ChatController.show);

routes.get(
  "/chats/:id/messages",
  apiTokenAuth,
  isAuth,
  ChatController.messages
);

routes.post(
  "/chats/:id/messages",
  apiTokenAuth,
  isAuth,
  upload.array("medias"),
  ChatController.saveMessage
);

routes.post("/chats/:id/read", isAuth, ChatController.checkAsRead);

routes.post("/chats", apiTokenAuth, isAuth, ChatController.store);

routes.put("/chats/:id", apiTokenAuth, isAuth, ChatController.update);

routes.delete("/chats/:id", isAuth, ChatController.remove);

export default routes;
