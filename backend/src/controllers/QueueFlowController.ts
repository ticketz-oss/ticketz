import { Request, Response } from "express";
import carregarFluxo from "../services/QueueFlowService/carregarFluxo";
import publicarFluxo from "../services/QueueFlowService/publicarFluxo";

export const show = async (req: Request, res: Response): Promise<Response> =>
  res.json(
    await carregarFluxo(Number(req.params.queueId), Number(req.user.companyId))
  );

export const update = async (req: Request, res: Response): Promise<Response> =>
  res.json(
    await publicarFluxo(
      Number(req.params.queueId),
      Number(req.user.companyId),
      req.body
    )
  );
