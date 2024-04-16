import { Router } from "express";
import multer from "multer";
import isAuth from "../middleware/isAuth";
import envTokenAuth from "../middleware/envTokenAuth";

import * as SettingController from "../controllers/SettingController";
import isSuper from "../middleware/isSuper";
import uploadConfig from "../config/upload";

const settingRoutes = Router();

settingRoutes.get("/settings", isAuth, SettingController.index);

settingRoutes.get("/public-settings/:settingKey", envTokenAuth, SettingController.publicShow);

// change setting key to key in future
settingRoutes.put("/settings/:settingKey", isAuth, SettingController.update);

const upload = multer(uploadConfig);

settingRoutes.post(
  "/settings/logo",
  isAuth, isSuper,
  upload.single("file"),
  SettingController.storeLogo
);

export default settingRoutes;
