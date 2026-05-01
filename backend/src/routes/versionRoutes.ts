import express from "express";
import * as VersionController from "../controllers/VersionController";
import { sessionMiddleware } from "../middleware/sessionMiddleware";

const versionRoutes = express.Router();

versionRoutes.get("/", sessionMiddleware, VersionController.version);

export default versionRoutes;
