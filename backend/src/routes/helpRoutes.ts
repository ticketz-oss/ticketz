import express from "express";
import isAuth from "../middleware/isAuth";
import isSuper from "../middleware/isSuper";

import * as HelpController from "../controllers/HelpController";

const routes = express.Router();

routes.get("/helps/list", isAuth, HelpController.findList);

routes.get("/helps", isAuth, HelpController.index);

routes.get("/helps/:id", isAuth, HelpController.show);

routes.post("/helps", isAuth, isSuper, HelpController.store);

routes.put("/helps/:id", isAuth, isSuper, HelpController.update);

routes.delete("/helps/:id", isAuth, isSuper, HelpController.remove);

export default routes;
