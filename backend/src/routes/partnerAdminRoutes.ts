import express from "express";
import isAuth from "../middleware/isAuth";
import isSuper from "../middleware/isSuper";

import * as PartnerAdminController from "../controllers/PartnerAdminController";

const routes = express.Router();

routes.get("/partners", isAuth, isSuper, PartnerAdminController.index);
routes.post("/partners", isAuth, isSuper, PartnerAdminController.store);

// Antes de /partners/:id para nao ser capturada pela rota parametrizada.
routes.get(
  "/partners/payouts",
  isAuth,
  isSuper,
  PartnerAdminController.payouts
);
routes.post(
  "/partners/payouts/:id/retry",
  isAuth,
  isSuper,
  PartnerAdminController.retryPayout
);

routes.get("/partners/:id", isAuth, isSuper, PartnerAdminController.show);
routes.put("/partners/:id", isAuth, isSuper, PartnerAdminController.update);
routes.delete("/partners/:id", isAuth, isSuper, PartnerAdminController.remove);
routes.post(
  "/partners/:id/invite-link",
  isAuth,
  isSuper,
  PartnerAdminController.invite
);

export default routes;
