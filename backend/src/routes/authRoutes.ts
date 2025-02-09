import { Router } from "express";
import * as SessionController from "../controllers/SessionController";
import isAuth from "../middleware/isAuth";
import isSuper from "../middleware/isAdmin";

const authRoutes = Router();

authRoutes.post("/login", SessionController.store);
authRoutes.get(
  "/impersonate/:companyId",
  isAuth,
  isSuper,
  SessionController.impersonate
);
authRoutes.post("/refresh_token", SessionController.update);
authRoutes.delete("/logout", isAuth, SessionController.remove);
authRoutes.get("/me", isAuth, SessionController.me);

export default authRoutes;
