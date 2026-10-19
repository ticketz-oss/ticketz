import { Router } from "express";
import * as OgPreviewController from "../controllers/OgPreviewController";

const ogRoutes = Router();

// Preview de link (Open Graph) por tenant. Servido a crawlers roteados pelo
// nginx (por user-agent) para /og-preview.
ogRoutes.get("/og-preview", OgPreviewController.show);

export default ogRoutes;
