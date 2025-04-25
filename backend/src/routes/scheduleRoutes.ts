import express from "express";
import isAuth from "../middleware/isAuth";

import * as ScheduleController from "../controllers/ScheduleController";
import apiTokenAuth from "../middleware/apiTokenAuth";

const scheduleRoutes = express.Router();

scheduleRoutes.get(
  "/schedules",
  apiTokenAuth,
  isAuth,
  ScheduleController.index
);

scheduleRoutes.post(
  "/schedules",
  apiTokenAuth,
  isAuth,
  ScheduleController.store
);

scheduleRoutes.put(
  "/schedules/:scheduleId",
  apiTokenAuth,
  isAuth,
  ScheduleController.update
);

scheduleRoutes.get(
  "/schedules/:scheduleId",
  apiTokenAuth,
  isAuth,
  ScheduleController.show
);

scheduleRoutes.delete(
  "/schedules/:scheduleId",
  apiTokenAuth,
  isAuth,
  ScheduleController.remove
);

export default scheduleRoutes;
