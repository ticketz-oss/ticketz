import { Router } from "express";

import isAuth from "../middleware/isAuth";
import isSuper from "../middleware/isAdmin";
import * as ERPConOSSController from "../controllers/ERPConOSSController";

const erpconOSSRoutes = Router();

erpconOSSRoutes.get(
  "/erpcon/registry",
  isAuth,
  isSuper,
  ERPConOSSController.show
);

erpconOSSRoutes.post(
  "/erpcon/registry",
  isAuth,
  isSuper,
  ERPConOSSController.store
);

export default erpconOSSRoutes;
