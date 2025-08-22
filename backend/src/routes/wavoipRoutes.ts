import express from "express";
import isAuth from "../middleware/isAuth";
import isAdmin from "../middleware/isAdmin";

import * as WavoipController from "../controllers/WavoipController";

const wavoipRoutes = express.Router();

wavoipRoutes.post(
  "/wavoip/:whatsappId",
  isAuth,
  isAdmin,
  WavoipController.saveToken
);

wavoipRoutes.delete(
  "/wavoip/:whatsappId",
  isAuth,
  isAdmin,
  WavoipController.deleteToken
);

wavoipRoutes.get(
  "/wavoip/:whatsappId",
  isAuth,
  isAdmin,
  WavoipController.getToken
);

export default wavoipRoutes;
