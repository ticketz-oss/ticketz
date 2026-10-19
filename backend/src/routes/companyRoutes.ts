import express from "express";
import isAuth from "../middleware/isAuth";
import isSuper from "../middleware/isSuper";
import multer from "multer";
import rateLimit from "express-rate-limit";
import AppError from "../errors/AppError";

import * as CompanyController from "../controllers/CompanyController";

const companyRoutes = express.Router();

companyRoutes.get("/companies/list", isAuth, isSuper, CompanyController.list);
companyRoutes.get("/companies", isAuth, isSuper, CompanyController.index);
companyRoutes.get("/companies/:id", isAuth, CompanyController.show);
companyRoutes.post("/companies", isAuth, isSuper, CompanyController.store);
companyRoutes.put("/companies/:id", isAuth, isSuper, CompanyController.update);
companyRoutes.put(
  "/companies/:id/schedules",
  isAuth,
  CompanyController.updateSchedules
);
companyRoutes.delete(
  "/companies/:id",
  isAuth,
  isSuper,
  CompanyController.remove
);
const signupUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 3, fields: 20, fieldSize: 4096 },
  fileFilter: (_req, file, callback) => {
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.mimetype)) {
      return callback(new Error("ERR_SIGNUP_INVALID_IMAGE"));
    }
    return callback(null, true);
  }
}).fields([
  { name: "logo", maxCount: 1 },
  { name: "banner", maxCount: 1 },
  { name: "sideImage", maxCount: 1 }
]);
companyRoutes.post(
  "/companies/cadastro",
  rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "ERR_SIGNUP_RATE_LIMIT" }
  }),
  (req, res, next) =>
    signupUpload(req, res, error => {
      next(error ? new AppError("ERR_SIGNUP_INVALID_IMAGE", 400) : undefined);
    }),
  CompanyController.signup
);
export default companyRoutes;
