import * as Yup from "yup";
import { Request, Response } from "express";
// import { getIO } from "../libs/socket";
import AppError from "../errors/AppError";
import Invoices from "../models/Invoices";

import FindAllInvoiceService from "../services/InvoicesService/FindAllInvoiceService";
import ListInvoicesServices from "../services/InvoicesService/ListInvoicesServices";
import ShowInvoceService from "../services/InvoicesService/ShowInvoiceService";
import UpdateInvoiceService from "../services/InvoicesService/UpdateInvoiceService";
import SubscriptionNoticeService from "../services/InvoicesService/SubscriptionNoticeService";

type IndexQuery = {
  searchParam: string;
  pageNumber: string;
};

type UpdateInvoiceData = {
  status: string;
};

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { searchParam, pageNumber } = req.query as IndexQuery;

  const { invoices, count, hasMore } = await ListInvoicesServices({
    searchParam,
    pageNumber
  });

  return res.json({ invoices, count, hasMore });
};

export const show = async (req: Request, res: Response): Promise<Response> => {
  const { Invoiceid } = req.params;

  const invoice = await ShowInvoceService(Invoiceid, req.user.companyId);

  return res.status(200).json(invoice);
};

export const list = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;
  const invoice: Invoices[] = await FindAllInvoiceService(companyId);

  return res.status(200).json(invoice);
};

export const update = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const InvoiceData: UpdateInvoiceData = req.body;

  const schema = Yup.object()
    .shape({ status: Yup.string().oneOf(["paid", "cancelled"]).required() })
    .noUnknown(true)
    .strict(true);

  try {
    await schema.validate(InvoiceData);
  } catch (err) {
    throw new AppError(err.message);
  }

  const { id } = req.params;
  const { status } = InvoiceData;

  const plan = await UpdateInvoiceService({
    id,
    status
  });

  // const io = getIO();
  // io.emit("plan", {
  //   action: "update",
  //   plan
  // });

  return res.status(200).json(plan);
};
/* export const store = async (req: Request, res: Response): Promise<Response> => {
  const newPlan: StorePlanData = req.body;

  const schema = Yup.object().shape({
    name: Yup.string().required()
  });

  try {
    await schema.validate(newPlan);
  } catch (err) {
    throw new AppError(err.message);
  }

  const plan = await CreatePlanService(newPlan);

  // const io = getIO();
  // io.emit("plan", {
  //   action: "create",
  //   plan
  // });

  return res.status(200).json(plan);
};

export const show = async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;

  const plan = await ShowPlanService(id);

  return res.status(200).json(plan);
};

export const update = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const planData: UpdateInvoiceData = req.body;

  const schema = Yup.object().shape({
    name: Yup.string()
  });

  try {
    await schema.validate(planData);
  } catch (err) {
    throw new AppError(err.message);
  }

  const { id, name, users, connections, queues, value } = planData;

  const plan = await UpdatePlanService({
    id,
    name,
    users,
    connections,
    queues,
    value
  });

  // const io = getIO();
  // io.emit("plan", {
  //   action: "update",
  //   plan
  // });

  return res.status(200).json(plan);
};

export const remove = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { id } = req.params;

  const plan = await DeletePlanService(id);

  return res.status(200).json(plan);
}; */
export const subscriptionNotice = async (
  req: Request,
  res: Response
): Promise<Response> => {
  return res.json(await SubscriptionNoticeService(req.user.companyId));
};
