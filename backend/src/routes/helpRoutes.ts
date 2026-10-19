import express from "express";
import isAuth from "../middleware/isAuth";
import isAdmin from "../middleware/isAdmin";

import * as HelpController from "../controllers/HelpController";

const routes = express.Router();

routes.get("/helps/list", isAuth, HelpController.findList);

// Conteudos de um card, para a tela do tenant.
routes.get("/helps/groups/:id", isAuth, HelpController.showGroupContents);

// Rotas de gestao: isAdmin abre para o dono de cada empresa, e o controller
// aplica a fronteira entre empresas card a card.
routes.get("/helps", isAuth, isAdmin, HelpController.index);

routes.post("/helps", isAuth, isAdmin, HelpController.store);

// Antes de "/:id": senao "reorder" seria lido como um id.
routes.put("/helps/reorder", isAuth, isAdmin, HelpController.reorder);

routes.get("/helps/:id", isAuth, isAdmin, HelpController.show);

routes.put("/helps/:id", isAuth, isAdmin, HelpController.update);

routes.delete("/helps/:id", isAuth, isAdmin, HelpController.remove);

export default routes;
