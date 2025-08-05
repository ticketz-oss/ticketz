import express from "express";
import isAuth from "../middleware/isAuth";
import isSuper from "../middleware/isSuper";
import * as I18nController from "../controllers/I18nController";

const translationRoutes = express.Router();

translationRoutes.get(
  "/translations/languages",
  isAuth,
  isSuper,
  I18nController.listLanguages
);
translationRoutes.get(
  "/translations",
  isAuth,
  isSuper,
  I18nController.getKeysAndValues
);
translationRoutes.post(
  "/translations",
  isAuth,
  isSuper,
  I18nController.upsertTranslation
);

export default translationRoutes;
