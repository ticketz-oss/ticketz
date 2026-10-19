import express from "express";
import isAuth from "../middleware/isAuth";
import * as PushSubscriptionController from "../controllers/PushSubscriptionController";

const pushRoutes = express.Router();

pushRoutes.get(
  "/push/public-key",
  isAuth,
  PushSubscriptionController.publicKey
);

pushRoutes.post("/push/subscribe", isAuth, PushSubscriptionController.store);

pushRoutes.post("/push/unsubscribe", isAuth, PushSubscriptionController.remove);

export default pushRoutes;
