import express from "express";
import isAuth from "../middleware/isAuth";
import isProspeccaoUser from "../middleware/isProspeccaoUser";

import * as ProspeccaoController from "../controllers/ProspeccaoController";

const prospeccaoRoutes = express.Router();

prospeccaoRoutes.use("/prospeccao", isAuth, isProspeccaoUser);

prospeccaoRoutes.get("/prospeccao/produtos", ProspeccaoController.produtos);
prospeccaoRoutes.get(
  "/prospeccao/localidades/paises",
  ProspeccaoController.countries
);
prospeccaoRoutes.get(
  "/prospeccao/localidades/estados",
  ProspeccaoController.states
);
prospeccaoRoutes.get(
  "/prospeccao/localidades/cidades",
  ProspeccaoController.cities
);
prospeccaoRoutes.get(
  "/prospeccao/automacao",
  ProspeccaoController.automationShow
);
prospeccaoRoutes.put(
  "/prospeccao/automacao",
  ProspeccaoController.automationUpdate
);
prospeccaoRoutes.patch(
  "/prospeccao/automacao/ativacao",
  ProspeccaoController.automationActivation
);
prospeccaoRoutes.get("/prospeccao/leads", ProspeccaoController.leads);
prospeccaoRoutes.post(
  "/prospeccao/leads/:leadId/conversa",
  ProspeccaoController.abrirConversa
);
prospeccaoRoutes.post("/prospeccao/buscas", ProspeccaoController.store);
prospeccaoRoutes.get("/prospeccao/buscas/:jobId", ProspeccaoController.show);

export default prospeccaoRoutes;
