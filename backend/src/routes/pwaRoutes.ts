import express from "express";
import * as PwaController from "../controllers/PwaController";

const pwaRoutes = express.Router();

pwaRoutes.get("/manifest.json", PwaController.manifest);
pwaRoutes.get("/favicon.ico", PwaController.favicon);

export default pwaRoutes;
