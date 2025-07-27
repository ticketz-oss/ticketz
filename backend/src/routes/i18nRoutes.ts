import express from "express";
import { getLanguages } from "../controllers/I18nController";
import isAuth from "../middleware/isAuth";

const i18nRoutes = express.Router();

i18nRoutes.get("/i18n/languages", isAuth, getLanguages);

export default i18nRoutes;
