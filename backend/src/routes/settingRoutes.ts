import { Router } from "express";
import isAuth from "../middleware/isAuth";
import envTokenAuth from "../middleware/envTokenAuth";

import * as SettingController from "../controllers/SettingController";

const settingRoutes = Router();

settingRoutes.get("/settings", isAuth, SettingController.index);

settingRoutes.get("/public-settings/:settingKey", envTokenAuth, SettingController.publicShow);

// change setting key to key in future
settingRoutes.put("/settings/:settingKey", isAuth, SettingController.update);

export default settingRoutes;
