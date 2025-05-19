import express from "express";
import isAuth from "../middleware/isAuth";

import * as DashboardController from "../controllers/DashboardController";
import isAdmin from "../middleware/isAdmin";
import isCompliant from "../middleware/isCompliant";
import apiTokenAuth from "../middleware/apiTokenAuth";

const routes = express.Router();

routes.get(
  "/dashboard/status",
  apiTokenAuth,
  isAuth,
  isAdmin,
  isCompliant,
  DashboardController.statusSummary
);

routes.get(
  "/dashboard/tickets",
  apiTokenAuth,
  isAuth,
  isAdmin,
  isCompliant,
  DashboardController.ticketsStatistic
);

routes.get(
  "/dashboard/users",
  apiTokenAuth,
  isAuth,
  isAdmin,
  isCompliant,
  DashboardController.usersReport
);

routes.get(
  "/dashboard/queues",
  apiTokenAuth,
  isAuth,
  isAdmin,
  isCompliant,
  DashboardController.queuesReport
);

export default routes;
