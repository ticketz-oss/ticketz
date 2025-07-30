import { Router } from "express";

import isAuth from "../middleware/isAuth";
import * as TasksController from "../controllers/TasksController";

const taskRouter = Router();

taskRouter.get("/tasks", isAuth, TasksController.index);

taskRouter.post("/tasks", isAuth, TasksController.store);

taskRouter.put("/tasks/:id", isAuth, TasksController.update);

taskRouter.get("/tasks/:id", isAuth, TasksController.show);

taskRouter.delete("/tasks/:id", isAuth, TasksController.remove);

export default taskRouter;
