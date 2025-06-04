import { Router } from "express";
import * as QuickPixController from "../controllers/QuickPixController";
import isAuth from "../middleware/isAuth";
import isAdmin from "../middleware/isAdmin";
import apiTokenAuth from "../middleware/apiTokenAuth";

const routes = Router();

// Add a record
routes.post(
  "/quickpix",
  apiTokenAuth,
  isAuth,
  isAdmin,
  QuickPixController.addRecord
);

// Get record by key
routes.get("/quickpix/k/:key", QuickPixController.getRecordByKey);

// Get one record
routes.get(
  "/quickpix/:id",
  apiTokenAuth,
  isAuth,
  isAdmin,
  QuickPixController.getRecord
);

// List records with a custom metadata filter
routes.get(
  "/quickpix",
  apiTokenAuth,
  isAuth,
  isAdmin,
  QuickPixController.listRecords
);

// Set as paid
routes.patch(
  "/quickpix/:id/paid",
  apiTokenAuth,
  isAuth,
  isAdmin,
  QuickPixController.setAsPaid
);

export default routes;
