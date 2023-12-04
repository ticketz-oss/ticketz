import { Request, Response } from "express";
import { getIO } from "../libs/socket";
import CreateQueueService from "../services/QueueService/CreateQueueService";
import DeleteQueueService from "../services/QueueService/DeleteQueueService";
import ListQueuesService from "../services/QueueService/ListQueuesService";
import ShowQueueService from "../services/QueueService/ShowQueueService";
import UpdateQueueService from "../services/QueueService/UpdateQueueService";
import { isNil } from "lodash";
import Queue from "../models/Queue";
import { head } from "lodash";
import fs from "fs";
import path from "path";
import AppError from "../errors/AppError";

type QueueFilter = {
  companyId: number;
};

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { companyId: userCompanyId } = req.user;
  const { companyId: queryCompanyId } = req.query as unknown as QueueFilter;
  let companyId = userCompanyId;

  if (!isNil(queryCompanyId)) {
    companyId = +queryCompanyId;
  }

  const queues = await ListQueuesService({ companyId });

  return res.status(200).json(queues);
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  const { name, color, greetingMessage, outOfHoursMessage, schedules } =
    req.body;
  const { companyId } = req.user;

  const queue = await CreateQueueService({
    name,
    color,
    greetingMessage,
    companyId,
    outOfHoursMessage,
    schedules
  });

  const io = getIO();
  io.emit(`company-${companyId}-queue`, {
    action: "update",
    queue
  });

  return res.status(200).json(queue);
};

export const show = async (req: Request, res: Response): Promise<Response> => {
  const { queueId } = req.params;
  const { companyId } = req.user;

  const queue = await ShowQueueService(queueId, companyId);

  return res.status(200).json(queue);
};

export const update = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { queueId } = req.params;
  const { companyId } = req.user;

  const queue = await UpdateQueueService(queueId, req.body, companyId);

  const io = getIO();
  io.emit(`company-${companyId}-queue`, {
    action: "update",
    queue
  });

  return res.status(201).json(queue);
};

export const remove = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { queueId } = req.params;
  const { companyId } = req.user;

  await DeleteQueueService(queueId, companyId);

  const io = getIO();
  io.emit(`company-${companyId}-queue`, {
    action: "delete",
    queueId: +queueId
  });

  return res.status(200).send();
};

export const mediaUpload = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { queueId } = req.params;
  const files = req.files as Express.Multer.File[];
  const file = head(files);

  try {
    const queue = await Queue.findByPk(queueId);
   
    queue.update({
      mediaPath: file.filename,
      mediaName: file.originalname
    });
   
    return res.send({ mensagem: "Arquivo Salvo" });
  } catch (err: any) {
    throw new AppError(err.message);
  }
};

export const deleteMedia = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { queueId } = req.params;

  try {
    const queue = await Queue.findByPk(queueId);
    const filePath = path.resolve("public", queue.mediaPath);
    const fileExists = fs.existsSync(filePath);
    if (fileExists) {
      fs.unlinkSync(filePath);
    }

    queue.mediaPath = null;
    queue.mediaName = null;
    await queue.save();
    return res.send({ mensagem: "Arquivo excluído" });
  } catch (err: any) {
    throw new AppError(err.message);
  }
};