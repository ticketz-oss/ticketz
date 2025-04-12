import { Request, Response } from "express";
import {
  ticketTagAdd,
  ticketTagRemove,
  ticketTagRemoveAll
} from "../services/TicketTagServices/TicketTagServices";

export const store = async (req: Request, res: Response): Promise<Response> => {
  const ticketId = Number(req.params.ticketId);
  const tagId = Number(req.params.tagId);

  if (!ticketId || !tagId) {
    return res.status(400).json({ error: "Invalid ticketId or tagId." });
  }

  const ticketTag = await ticketTagAdd(ticketId, tagId, req.companyId);
  return res.status(201).json(ticketTag);
};

export const removeAll = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const ticketId = Number(req.params.ticketId);

  await ticketTagRemoveAll(ticketId, req.companyId);
  return res.status(200).json({ message: "Ticket tags removed successfully." });
};

export const remove = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const ticketId = Number(req.params.ticketId);
  const tagId = Number(req.params.tagId);

  if (!ticketId || !tagId) {
    return res.status(400).json({ error: "Invalid ticketId or tagId." });
  }

  await ticketTagRemove(ticketId, tagId, req.companyId);

  return res.status(200).json({ message: "Ticket tag removed successfully." });
};
