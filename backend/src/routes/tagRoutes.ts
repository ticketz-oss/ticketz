import express from "express";
import isAuth from "../middleware/isAuth";

import * as TagController from "../controllers/TagController";
import apiTokenAuth from "../middleware/apiTokenAuth";

const tagRoutes = express.Router();

tagRoutes.get("/tags/list", apiTokenAuth, isAuth, TagController.list);

tagRoutes.get("/tags", apiTokenAuth, isAuth, TagController.index);

tagRoutes.post("/tags", apiTokenAuth, isAuth, TagController.store);

tagRoutes.put("/tags/:tagId", apiTokenAuth, isAuth, TagController.update);

tagRoutes.get("/tags/:tagId", apiTokenAuth, isAuth, TagController.show);

tagRoutes.delete("/tags/:tagId", apiTokenAuth, isAuth, TagController.remove);

tagRoutes.post("/tags/sync", apiTokenAuth, isAuth, TagController.syncTags);

export default tagRoutes;
