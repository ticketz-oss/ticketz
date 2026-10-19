import express from "express";
import isPartnerAuth from "../middleware/isPartnerAuth";

import * as PartnerSessionController from "../controllers/PartnerSessionController";
import * as PartnerPortalController from "../controllers/PartnerPortalController";

const routes = express.Router();

// Publicas
routes.post("/partner/auth/login", PartnerSessionController.store);
routes.post("/partner/auth/refresh_token", PartnerSessionController.refresh);
routes.get("/partner/invite/:token", PartnerSessionController.showInvite);
routes.post("/partner/invite/:token", PartnerSessionController.acceptInvite);

// Autenticadas pelo JWT de parceiro. isPartnerAuth nunca popula req.user nem
// req.companyId, entao nenhuma rota de tenant fica alcancavel por este token.
routes.get("/partner/auth/me", isPartnerAuth, PartnerSessionController.me);
routes.delete(
  "/partner/auth/logout",
  isPartnerAuth,
  PartnerSessionController.remove
);

routes.get(
  "/partner/companies",
  isPartnerAuth,
  PartnerPortalController.listCompanies
);
routes.post(
  "/partner/companies",
  isPartnerAuth,
  PartnerPortalController.storeCompany
);
routes.get(
  "/partner/companies/:id",
  isPartnerAuth,
  PartnerPortalController.showCompany
);
routes.put(
  "/partner/companies/:id",
  isPartnerAuth,
  PartnerPortalController.updateCompany
);

routes.get("/partner/plans", isPartnerAuth, PartnerPortalController.listPlans);
routes.get(
  "/partner/payouts",
  isPartnerAuth,
  PartnerPortalController.listPayouts
);
routes.get(
  "/partner/settings",
  isPartnerAuth,
  PartnerPortalController.showSettings
);
routes.put(
  "/partner/settings",
  isPartnerAuth,
  PartnerPortalController.updateSettings
);
routes.get("/partner/helps", isPartnerAuth, PartnerPortalController.listHelps);
routes.get(
  "/partner/help-groups/:id",
  isPartnerAuth,
  PartnerPortalController.showHelpGroup
);

export default routes;
