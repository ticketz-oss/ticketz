import express from "express";
import isAuth from "../middleware/isAuth";
import isSuper from "../middleware/isSuper";

import * as PlanController from "../controllers/PlanController";

const planRoutes = express.Router();

planRoutes.get("/plans", isAuth, PlanController.index);

planRoutes.get("/plans/list", PlanController.list);

planRoutes.get("/plans/all", PlanController.list);

planRoutes.get("/plans/:id", isAuth, PlanController.show);

planRoutes.post("/plans", isAuth, isSuper, PlanController.store);

planRoutes.put("/plans/:id", isAuth, isSuper, PlanController.update);

planRoutes.delete("/plans/:id", isAuth, isSuper, PlanController.remove);

export default planRoutes;
