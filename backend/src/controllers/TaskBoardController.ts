import { Request, Response } from "express";
import { getIO } from "../libs/socket";
import {
  createColumn,
  createTask,
  deleteColumn,
  deleteTask,
  listBoard,
  moveTask,
  reorderColumns,
  updateColumn,
  updateTask,
  showTask
} from "../services/TaskBoardServices/TaskBoardV2Service";

const actorFrom = (req: Request) => ({
  companyId: req.user.companyId,
  userId: Number(req.user.id),
  profile: req.user.profile
});

const notify = (companyId: number): void => {
  getIO()
    .to(`company-${companyId}-mainchannel`)
    .emit("taskBoard", { action: "reload" });
};

export const index = async (req: Request, res: Response): Promise<Response> => {
  const board = await listBoard({
    ...actorFrom(req),
    filterUserId: req.query.userId ? Number(req.query.userId) : undefined,
    completedFrom: req.query.completedFrom as string,
    completedTo: req.query.completedTo as string
  });
  return res.status(200).json(board);
};

export const show = async (req: Request, res: Response): Promise<Response> => {
  const task = await showTask(req.params.id, actorFrom(req));
  return res.status(200).json(task);
};

export const storeColumn = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { companyId } = req.user;
  const column = await createColumn(companyId, req.body);
  notify(companyId);
  return res.status(201).json(column);
};

export const editColumn = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { companyId } = req.user;
  const column = await updateColumn(req.params.id, companyId, req.body);
  notify(companyId);
  return res.status(200).json(column);
};

export const orderColumns = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { companyId } = req.user;
  await reorderColumns(
    companyId,
    Array.isArray(req.body.ids) ? req.body.ids : []
  );
  notify(companyId);
  return res.status(204).send();
};

export const removeColumn = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { companyId } = req.user;
  await deleteColumn(req.params.id, companyId);
  notify(companyId);
  return res.status(204).send();
};

export const storeTask = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { companyId } = req.user;
  const task = await createTask(actorFrom(req), {
    title: req.body.title,
    description: req.body.description,
    targetType: req.body.targetType,
    assignedUserId: req.body.assignedUserId,
    assignedQueueId: req.body.assignedQueueId,
    dueAt: req.body.dueAt
  });
  notify(companyId);
  return res.status(201).json(task);
};

export const editTask = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { companyId } = req.user;
  const task = await updateTask(req.params.id, actorFrom(req), {
    title: req.body.title,
    description: req.body.description,
    targetType: req.body.targetType,
    assignedUserId: req.body.assignedUserId,
    assignedQueueId: req.body.assignedQueueId,
    dueAt: req.body.dueAt,
    version: req.body.version
  });
  notify(companyId);
  return res.status(200).json(task);
};

export const move = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;
  await moveTask({
    id: req.params.id,
    actor: actorFrom(req),
    destinationColumnId: req.body.columnId,
    position: Number(req.body.position),
    version: req.body.version
  });
  notify(companyId);
  return res.status(204).send();
};

export const removeTask = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { companyId } = req.user;
  await deleteTask(req.params.id, actorFrom(req));
  notify(companyId);
  return res.status(204).send();
};
