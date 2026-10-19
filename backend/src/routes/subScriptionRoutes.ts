import express from "express";
import isAuth from "../middleware/isAuth";
import isSuper from "../middleware/isSuper";

import * as SubscriptionController from "../controllers/SubscriptionController";

const subscriptionRoutes = express.Router();
subscriptionRoutes.post(
  "/subscription",
  isAuth,
  SubscriptionController.createSubscription
);
subscriptionRoutes.get(
  "/subscription/quote/:invoiceId",
  isAuth,
  SubscriptionController.quote
);
subscriptionRoutes.post(
  "/subscription/simulate/:invoiceId",
  isAuth,
  isSuper,
  SubscriptionController.simulate
);
subscriptionRoutes.post(
  "/subscription/ticketz/webhook/:type?",
  SubscriptionController.webhook
);

export default subscriptionRoutes;
