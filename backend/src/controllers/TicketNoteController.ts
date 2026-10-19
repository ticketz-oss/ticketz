import * as Yup from "yup";
import { Request, Response } from "express";
import AppError from "../errors/AppError";
import TicketNote from "../models/TicketNote";

import ListTicketNotesService from "../services/TicketNoteService/ListTicketNotesService";
import CreateTicketNoteService from "../services/TicketNoteService/CreateTicketNoteService";
import UpdateTicketNoteService from "../services/TicketNoteService/UpdateTicketNoteService";
import ShowTicketNoteService from "../services/TicketNoteService/ShowTicketNoteService";
import FindAllTicketNotesService from "../services/TicketNoteService/FindAllTicketNotesService";
import DeleteTicketNoteService from "../services/TicketNoteService/DeleteTicketNoteService";
import FindNotesByContactIdAndTicketId from "../services/TicketNoteService/FindNotesByContactIdAndTicketId";
import ShowTicketService from "../services/TicketServices/ShowTicketService";

type IndexQuery = {
  searchParam: string;
  pageNumber: string;
};

type StoreTicketNoteData = {
  note: string;
  ticketId: number;
};

type UpdateTicketNoteData = {
  note: string;
  id?: number | string;
  userId?: number | 0;
  contactId?: number | 0;
  ticketId?: number | 0;
};

type QueryFilteredNotes = {
  ticketId: number | string;
  scope?: string;
};

const authorizedNote = async (
  id: string,
  companyId: number
): Promise<TicketNote> => {
  const note = await ShowTicketNoteService(id);
  await ShowTicketService(note.ticketId, companyId);
  return note;
};

export const index = async (req: Request, res: Response): Promise<Response> => {
  if (req.user.profile !== "admin") {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }
  const { searchParam, pageNumber } = req.query as IndexQuery;

  const { ticketNotes, count, hasMore } = await ListTicketNotesService({
    searchParam,
    pageNumber,
    companyId: req.user.companyId
  });

  return res.json({ ticketNotes, count, hasMore });
};

export const list = async (req: Request, res: Response): Promise<Response> => {
  const ticketNotes: TicketNote[] = await FindAllTicketNotesService();

  return res.status(200).json(ticketNotes);
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  const newTicketNote: StoreTicketNoteData = req.body;
  const { id: userId, companyId } = req.user;

  const schema = Yup.object().shape({
    note: Yup.string().required(),
    ticketId: Yup.number().integer().positive().required()
  });

  try {
    await schema.validate(newTicketNote);
  } catch (err) {
    throw new AppError(err.message);
  }

  const ticket = await ShowTicketService(newTicketNote.ticketId, companyId);
  const ticketNote = await CreateTicketNoteService({
    note: newTicketNote.note,
    ticketId: ticket.id,
    contactId: ticket.contactId,
    userId: Number.parseInt(userId, 10)
  });

  return res.status(200).json(ticketNote);
};

export const show = async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;

  const ticketNote = await authorizedNote(id, req.user.companyId);

  return res.status(200).json(ticketNote);
};

export const update = async (
  req: Request,
  res: Response
): Promise<Response> => {
  if (req.user.profile !== "admin") {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }
  const ticketNote: UpdateTicketNoteData = req.body;
  const { id } = req.params;
  await authorizedNote(id, req.user.companyId);

  const schema = Yup.object().shape({
    note: Yup.string()
  });

  try {
    await schema.validate(ticketNote);
  } catch (err) {
    throw new AppError(err.message);
  }

  const recordUpdated = await UpdateTicketNoteService({
    id,
    note: ticketNote.note
  });

  return res.status(200).json(recordUpdated);
};

export const remove = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { id } = req.params;

  if (req.user.profile !== "admin") {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }

  await authorizedNote(id, req.user.companyId);
  await DeleteTicketNoteService(id);

  return res.status(200).json({ message: "Observação removida" });
};

export const findFilteredList = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { ticketId, scope } = req.query as QueryFilteredNotes;
  if (!ticketId) throw new AppError("ERR_NO_TICKET_FOUND", 400);

  const ticket = await ShowTicketService(ticketId, req.user.companyId);
  const notes: TicketNote[] = await FindNotesByContactIdAndTicketId({
    contactId: ticket.contactId,
    companyId: req.user.companyId,
    ticketId: scope === "contact" ? undefined : ticket.id
  });

  return res.status(200).json(notes);
};
