import express from "express";
import isAuth from "../middleware/isAuth";

import * as DashboardController from "../controllers/DashbardController";
import isAdmin from "../middleware/isAdmin";
import isCompliant from "../middleware/isCompliant";

const routes = express.Router();

routes.get(
  "/dashboard",
  isAuth,
  isAdmin,
  isCompliant,
  DashboardController.index
);

export default routes;
