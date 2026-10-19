import express from "express";
import isAuth from "../middleware/isAuth";
import isAdmin from "../middleware/isAdmin";

import * as HelpGroupController from "../controllers/HelpGroupController";

const routes = express.Router();

// isAdmin abre a gestao para o dono de cada empresa; a fronteira entre empresas
// e do controller (assertManageableGroup), nao da rota.
routes.get("/help-groups", isAuth, isAdmin, HelpGroupController.index);

routes.post("/help-groups", isAuth, isAdmin, HelpGroupController.store);

// Antes de "/:id": senao "reorder" cai na rota de id (armadilha ja documentada
// em routes/queueRoutes.ts).
routes.put("/help-groups/reorder", isAuth, isAdmin, HelpGroupController.reorder);

routes.get("/help-groups/:id", isAuth, isAdmin, HelpGroupController.show);

routes.put("/help-groups/:id", isAuth, isAdmin, HelpGroupController.update);

routes.delete("/help-groups/:id", isAuth, isAdmin, HelpGroupController.remove);

export default routes;
