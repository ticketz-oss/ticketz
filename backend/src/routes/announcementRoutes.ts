import express from "express";
import isAuth from "../middleware/isAuth";
import isAdmin from "../middleware/isAdmin";

import * as AnnouncementController from "../controllers/AnnouncementController";
import multer from "multer";
import uploadConfig from "../config/upload";

const upload = multer(uploadConfig);

const routes = express.Router();

routes.get("/announcements/list", isAuth, AnnouncementController.findList);

// Feed of what the logged user should actually see, used by the popover.
routes.get("/announcements/feed", isAuth, AnnouncementController.feed);

routes.get("/announcements", isAuth, isAdmin, AnnouncementController.index);

routes.get("/announcements/:id", isAuth, isAdmin, AnnouncementController.show);

routes.post("/announcements", isAuth, isAdmin, AnnouncementController.store);

routes.put(
  "/announcements/:id",
  isAuth,
  isAdmin,
  AnnouncementController.update
);

routes.delete(
  "/announcements/:id",
  isAuth,
  isAdmin,
  AnnouncementController.remove
);

routes.post(
  "/announcements/:id/media-upload",
  isAuth,
  isAdmin,
  upload.array("file"),
  AnnouncementController.mediaUpload
);

routes.delete(
  "/announcements/:id/media-upload",
  isAuth,
  isAdmin,
  AnnouncementController.deleteMedia
);

export default routes;
