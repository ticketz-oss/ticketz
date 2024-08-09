import express from "express";
import isAuth from "../middleware/isAuth";
import isSuper from "../middleware/isSuper";
import * as TicketzController from "../controllers/TicketzController";

const ticketzStatusRoutes = express.Router();

ticketzStatusRoutes.get(
  "/ticketz/status",
  isAuth,
  isSuper,
  TicketzController.status
);

export default ticketzStatusRoutes;
