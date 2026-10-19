import express from "express";
import isAuth from "../middleware/isAuth";
import isBillingAdmin from "../middleware/isBillingAdmin";

import * as BillingAdminController from "../controllers/BillingAdminController";

const billingAdminRoutes = express.Router();

billingAdminRoutes.use("/billing-admin", isAuth, isBillingAdmin);

billingAdminRoutes.get(
  "/billing-admin/overview",
  BillingAdminController.overview
);
billingAdminRoutes.get(
  "/billing-admin/gateway",
  BillingAdminController.gateway
);
billingAdminRoutes.get("/billing-admin/plans", BillingAdminController.plans);
billingAdminRoutes.get(
  "/billing-admin/clients",
  BillingAdminController.clients
);
billingAdminRoutes.put(
  "/billing-admin/clients/:id",
  BillingAdminController.updateClient
);
billingAdminRoutes.get(
  "/billing-admin/invoices",
  BillingAdminController.invoices
);
billingAdminRoutes.post(
  "/billing-admin/invoices",
  BillingAdminController.store
);
billingAdminRoutes.get(
  "/billing-admin/invoices/:id",
  BillingAdminController.showInvoice
);
billingAdminRoutes.put(
  "/billing-admin/invoices/:id",
  BillingAdminController.update
);
billingAdminRoutes.delete(
  "/billing-admin/invoices/:id",
  BillingAdminController.remove
);
billingAdminRoutes.post(
  "/billing-admin/invoices/:id/charge",
  BillingAdminController.charge
);
billingAdminRoutes.post(
  "/billing-admin/invoices/:id/send",
  BillingAdminController.send
);
billingAdminRoutes.post(
  "/billing-admin/invoices/:id/refresh",
  BillingAdminController.refresh
);

export default billingAdminRoutes;
