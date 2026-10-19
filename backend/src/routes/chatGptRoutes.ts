import { Router } from "express";
import * as ChatGptController from "../controllers/ChatGptController";
import isAdmin from "../middleware/isAdmin";
import isAuth from "../middleware/isAuth";
import isSuper from "../middleware/isSuper";

const routes = Router();

routes.get("/chatgpt/integration", isAuth, isAdmin, ChatGptController.show);
routes.delete(
  "/chatgpt/integration/grants",
  isAuth,
  isAdmin,
  ChatGptController.removeAll
);
routes.delete(
  "/chatgpt/integration/grants/:grantId",
  isAuth,
  isAdmin,
  ChatGptController.remove
);
routes.put(
  "/chatgpt/pilot/:companyId",
  isAuth,
  isSuper,
  ChatGptController.updatePilot
);

export default routes;
