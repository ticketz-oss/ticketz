import express from "express";
import isAuth from "../middleware/isAuth";
import isAdmin from "../middleware/isAdmin";
import * as controller from "../controllers/CommemorativeDateController";

const routes = express.Router();

routes.get("/commemorative-dates", isAuth, controller.index);
routes.post("/commemorative-dates", isAuth, isAdmin, controller.store);
routes.put("/commemorative-dates/:id", isAuth, isAdmin, controller.update);
routes.delete("/commemorative-dates/:id", isAuth, isAdmin, controller.remove);

export default routes;
