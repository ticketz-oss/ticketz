import { Router } from "express";

import isAuth from "../middleware/isAuth";
import apiTokenAuth from "../middleware/apiTokenAuth";

import * as UserController from "../controllers/UserController";

const userRoutes = Router();

userRoutes.get("/users", apiTokenAuth, isAuth, UserController.index);

userRoutes.get("/users/list", apiTokenAuth, isAuth, UserController.list);

userRoutes.post("/users", apiTokenAuth, isAuth, UserController.store);

userRoutes.put("/users/:userId", apiTokenAuth, isAuth, UserController.update);

userRoutes.get("/users/:userId", apiTokenAuth, isAuth, UserController.show);

userRoutes.delete(
  "/users/:userId",
  apiTokenAuth,
  isAuth,
  UserController.remove
);

export default userRoutes;
