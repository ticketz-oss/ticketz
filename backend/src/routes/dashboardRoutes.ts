import express from "express";
import isAuth from "../middleware/isAuth";

import * as DashboardController from "../controllers/DashboardController";
import isAdmin from "../middleware/isAdmin";
import isCompliant from "../middleware/isCompliant";

const routes = express.Router();

routes.get(
  "/dashboard/status",
  isAuth,
  isAdmin,
  isCompliant,
  DashboardController.statusSummary
);

routes.get(
  "/dashboard/tickets",
  isAuth,
  isAdmin,
  isCompliant,
  DashboardController.ticketsStatistic
);

routes.get(
  "/dashboard/users",
  isAuth,
  isAdmin,
  isCompliant,
  DashboardController.usersReport
);

export default routes;
