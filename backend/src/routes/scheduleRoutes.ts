import express from "express";
import isAuth from "../middleware/isAuth";

import * as ScheduleController from "../controllers/ScheduleController";
import multer from "multer";
import uploadConfig from "../config/upload";

const upload = multer(uploadConfig);

const scheduleRoutes = express.Router();

scheduleRoutes.get("/schedules", isAuth, ScheduleController.index);

scheduleRoutes.post("/schedules/preview", isAuth, ScheduleController.preview);
scheduleRoutes.get(
  "/schedules/variables",
  isAuth,
  ScheduleController.variables
);
scheduleRoutes.get(
  "/schedules/:scheduleId/deliveries",
  isAuth,
  ScheduleController.deliveries
);
scheduleRoutes.post(
  "/schedules/:scheduleId/send-now",
  isAuth,
  ScheduleController.sendNow
);

scheduleRoutes.post(
  "/schedules",
  isAuth,
  upload.single("file"),
  ScheduleController.store
);

scheduleRoutes.put(
  "/schedules/:scheduleId",
  isAuth,
  upload.single("file"),
  ScheduleController.update
);

scheduleRoutes.get("/schedules/:scheduleId", isAuth, ScheduleController.show);

scheduleRoutes.delete(
  "/schedules/:scheduleId",
  isAuth,
  ScheduleController.remove
);

export default scheduleRoutes;
