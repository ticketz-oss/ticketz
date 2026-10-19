import express from "express";
import * as WebPushController from "../controllers/WebPushController";
import isAuth from "../middleware/isAuth";

const routes = express.Router();

routes.get("/push/public-key", isAuth, WebPushController.publicKey);
routes.post("/push/subscriptions", isAuth, WebPushController.subscribe);
routes.delete("/push/subscriptions", isAuth, WebPushController.unsubscribe);
routes.post("/push/test", isAuth, WebPushController.test);

export default routes;
