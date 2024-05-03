import express from "express";
import isAuth from "../middleware/isAuth";

import * as SubscriptionController from "../controllers/SubscriptionController";

const subscriptionRoutes = express.Router();
subscriptionRoutes.post("/subscription", isAuth, SubscriptionController.createSubscription);
subscriptionRoutes.post("/subscription/ticketz/webhook/:type?", SubscriptionController.webhook);

export default subscriptionRoutes;
