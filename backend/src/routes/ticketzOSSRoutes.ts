import { Router } from "express";

import isAuth from "../middleware/isAuth";
import isSuper from "../middleware/isAdmin";
import * as TicketzOSSController from "../controllers/TicketzOSSController";

const ticketzOSSRoutes = Router();

ticketzOSSRoutes.get(
  "/ticketz/registry",
  isAuth,
  isSuper,
  TicketzOSSController.show
);

ticketzOSSRoutes.post(
  "/ticketz/registry",
  isAuth,
  isSuper,
  TicketzOSSController.store
);

export default ticketzOSSRoutes;
