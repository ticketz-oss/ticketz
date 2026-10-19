import { Router } from "express";
import * as PlatformController from "../controllers/PlatformController";
import platformIdempotency from "../middleware/platformIdempotency";
import platformKeyAuth from "../middleware/platformKeyAuth";

const platformRoutes = Router();
const protectedRoutes = Router();

platformRoutes.get("/api/platform/v1/health", PlatformController.health);
platformRoutes.post(
  "/api/platform/v1/acesso/trocar",
  PlatformController.exchangeAccess
);

protectedRoutes.use(platformKeyAuth);
protectedRoutes.use(platformIdempotency);

protectedRoutes.post("/tenants", PlatformController.createTenant);
protectedRoutes.get("/tenants/:id", PlatformController.showTenant);
protectedRoutes.patch("/tenants/:id", PlatformController.updateTenant);
protectedRoutes.post(
  "/tenants/:id/suspensao",
  PlatformController.suspendTenant
);
protectedRoutes.delete("/tenants/:id", PlatformController.deleteTenant);

protectedRoutes.get("/planos", PlatformController.listPlans);
protectedRoutes.get("/tenants/:id/uso", PlatformController.usage);
protectedRoutes.post("/tenants/:id/acesso", PlatformController.access);

protectedRoutes.get("/tenants/:id/financeiro", PlatformController.listFinance);
protectedRoutes.post(
  "/tenants/:id/financeiro",
  PlatformController.createFinance
);
protectedRoutes.get("/financeiro/:id", PlatformController.showFinance);
protectedRoutes.patch("/financeiro/:id", PlatformController.updateFinance);
protectedRoutes.delete("/financeiro/:id", PlatformController.deleteFinance);

platformRoutes.use("/api/platform/v1", protectedRoutes);

export default platformRoutes;
