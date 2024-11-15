import { Router } from "express";
import multer from "multer";
import isAuth from "../middleware/isAuth";
import isAdmin from "../middleware/isAdmin";
import envTokenAuth from "../middleware/envTokenAuth";

import * as SettingController from "../controllers/SettingController";
import isSuper from "../middleware/isSuper";
import uploadConfig from "../config/upload";
import uploadPrivateConfig from "../config/privateFiles";

const settingRoutes = Router();

settingRoutes.get("/settings", isAuth, isAdmin, SettingController.index);

settingRoutes.get("/settings/:settingKey", isAuth, SettingController.show);

settingRoutes.get(
  "/public-settings/:settingKey",
  envTokenAuth,
  SettingController.publicShow
);

// change setting key to key in future
settingRoutes.put(
  "/settings/:settingKey",
  isAuth,
  isAdmin,
  SettingController.update
);

const upload = multer(uploadConfig);
const uploadPrivate = multer(uploadPrivateConfig);

settingRoutes.post(
  "/settings/logo",
  isAuth,
  isSuper,
  upload.single("file"),
  SettingController.storeLogo
);

settingRoutes.post(
  "/settings/privateFile",
  isAuth,
  isSuper,
  uploadPrivate.single("file"),
  SettingController.storePrivateFile
);

export default settingRoutes;
