import { Router } from "express";

import isAuth from "../middleware/isAuth";
import * as UserController from "../controllers/UserController";

import * as FotoUsuarioController from "../controllers/FotoUsuarioController";

const userRoutes = Router();

userRoutes.post(
  "/users/:userId/photo",
  isAuth,
  FotoUsuarioController.autorizar,
  FotoUsuarioController.receber,
  FotoUsuarioController.salvar
);
userRoutes.delete(
  "/users/:userId/photo",
  isAuth,
  FotoUsuarioController.autorizar,
  FotoUsuarioController.salvar
);

userRoutes.get("/users", isAuth, UserController.index);

userRoutes.get("/users/list", isAuth, UserController.list);

userRoutes.post("/users", isAuth, UserController.store);

userRoutes.put("/users/:userId", isAuth, UserController.update);

userRoutes.get("/users/:userId", isAuth, UserController.show);

userRoutes.delete("/users/:userId", isAuth, UserController.remove);

export default userRoutes;
