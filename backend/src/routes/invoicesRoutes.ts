import express from "express";
import isAuth from "../middleware/isAuth";
import isSuper from "../middleware/isSuper";
import isAdmin from "../middleware/isAdmin";
import * as InvoicesController from "../controllers/InvoicesController";

const invoiceRoutes = express.Router();

invoiceRoutes.get(
  "/invoices/subscription-notice",
  isAuth,
  isAdmin,
  InvoicesController.subscriptionNotice
);

invoiceRoutes.get("/invoices", isAuth, isSuper, InvoicesController.index);
invoiceRoutes.get("/invoices/list", isAuth, InvoicesController.list);
invoiceRoutes.get("/invoices/all", isAuth, InvoicesController.list);
invoiceRoutes.get("/invoices/:Invoiceid", isAuth, InvoicesController.show);
invoiceRoutes.put("/invoices/:id", isAuth, isSuper, InvoicesController.update);

export default invoiceRoutes;
