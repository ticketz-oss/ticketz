import express from "express";
import isAuth from "../middleware/isAuth";
import isAdmin from "../middleware/isAdmin";

import * as ContactListItemController from "../controllers/ContactListItemController";

const routes = express.Router();

routes.get(
  "/contact-list-items/list",
  isAuth,
  isAdmin,
  ContactListItemController.findList
);

routes.get(
  "/contact-list-items",
  isAuth,
  isAdmin,
  ContactListItemController.index
);

routes.get(
  "/contact-list-items/:id",
  isAuth,
  isAdmin,
  ContactListItemController.show
);

routes.post(
  "/contact-list-items",
  isAuth,
  isAdmin,
  ContactListItemController.store
);

routes.put(
  "/contact-list-items/:id",
  isAuth,
  isAdmin,
  ContactListItemController.update
);

routes.delete(
  "/contact-list-items/:id",
  isAuth,
  isAdmin,
  ContactListItemController.remove
);

export default routes;
