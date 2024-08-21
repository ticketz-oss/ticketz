import express from "express";
import * as VersionController from "../controllers/VersionController";

const versionRoutes = express.Router();

versionRoutes.get("/", VersionController.version);

export default versionRoutes;
