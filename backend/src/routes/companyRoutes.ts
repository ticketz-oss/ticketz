import express from "express";
import isAuth from "../middleware/isAuth";
import isSuper from "../middleware/isSuper";
import apiTokenAuth from "../middleware/apiTokenAuth";

import * as CompanyController from "../controllers/CompanyController";

const companyRoutes = express.Router();

companyRoutes.get(
  "/companies/list",
  apiTokenAuth,
  isAuth,
  isSuper,
  CompanyController.list
);
companyRoutes.get(
  "/companies",
  apiTokenAuth,
  isAuth,
  isSuper,
  CompanyController.index
);
companyRoutes.get(
  "/companies/:id",
  apiTokenAuth,
  isAuth,
  CompanyController.show
);
companyRoutes.post(
  "/companies",
  apiTokenAuth,
  isAuth,
  isSuper,
  CompanyController.store
);
companyRoutes.put(
  "/companies/:id",
  apiTokenAuth,
  isAuth,
  isSuper,
  CompanyController.update
);
companyRoutes.put(
  "/companies/:id/schedules",
  apiTokenAuth,
  isAuth,
  CompanyController.updateSchedules
);
companyRoutes.delete(
  "/companies/:id",
  apiTokenAuth,
  isAuth,
  isSuper,
  CompanyController.remove
);
companyRoutes.post("/companies/cadastro", CompanyController.signup);
export default companyRoutes;
