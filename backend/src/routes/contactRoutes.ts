import express from "express";
import isAuth from "../middleware/isAuth";

import * as ContactController from "../controllers/ContactController";
import * as ImportPhoneContactsController from "../controllers/ImportPhoneContactsController";
import apiTokenAuth from "../middleware/apiTokenAuth";

const contactRoutes = express.Router();

contactRoutes.post(
  "/contacts/import",
  isAuth,
  ImportPhoneContactsController.store
);

contactRoutes.get("/contacts", apiTokenAuth, isAuth, ContactController.index);

contactRoutes.get(
  "/contacts/list",
  apiTokenAuth,
  isAuth,
  ContactController.list
);

contactRoutes.get(
  "/contacts/:contactId",
  apiTokenAuth,
  isAuth,
  ContactController.show
);

contactRoutes.post("/contacts", apiTokenAuth, isAuth, ContactController.store);

contactRoutes.put(
  "/contacts/:contactId",
  apiTokenAuth,
  isAuth,
  ContactController.update
);

contactRoutes.delete(
  "/contacts/:contactId",
  apiTokenAuth,
  isAuth,
  ContactController.remove
);

export default contactRoutes;
