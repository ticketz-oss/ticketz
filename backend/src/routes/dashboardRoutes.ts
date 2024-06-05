import express from "express";
import isAuth from "../middleware/isAuth";

import * as DashboardController from "../controllers/DashbardController";
import isAdmin from "../middleware/isAdmin";

const routes = express.Router();

routes.get("/dashboard", isAuth, isAdmin, DashboardController.index);

export default routes;
