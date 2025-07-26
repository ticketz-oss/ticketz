import { Request, Response } from 'express'
import { CreateTaskService } from '../services/TasksService/CreateTaskService';
import { ListTaskService } from '../services/TasksService/ListTaskService';
import { UpdateTaskService } from '../services/TasksService/UpdateTaskService';
import Tasks from '../models/Tasks';


export const index = async (req: Request, res: Response): Promise<Response> => {

  const { companyId, id, profile } = req.user;

  const listTast = await ListTaskService({ userId: +id, companyId, profile });

  return res.status(200).json(listTast);

}

export const store = async (req: Request, res: Response): Promise<Response> => {


  const { title, description, isPrivate, userId, startedAt } = req.body;
  const { companyId } = req.user;

  const task = await CreateTaskService({
    title,
    description,
    isPrivate,
    userId,
    startedAt,
    companyId
  });

  return res.status(201).json(task);


}

export const show = async (req: Request, res: Response): Promise<Response> => {

  const { id } = req.params;
  return res.status(200).json({ message: 'sucess' });

}

export const update = async (req: Request, res: Response): Promise<Response> => {

  const { id } = req.params; //falta fazer a tipagem
  const data = req.body; //falta fazer a tipagem

  const task = await UpdateTaskService({ taskData: data, id });

  return res.status(200).json(task);

}

export const remove = async (req: Request, res: Response): Promise<Response> => {

  const { id } = req.params;

  await Tasks.destroy({
    where: { id }
  });

  return res.status(200).json({ message: 'deleted' });

}
