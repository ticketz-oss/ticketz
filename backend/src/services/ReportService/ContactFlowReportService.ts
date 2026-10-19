import { QueryTypes } from "sequelize";
import sequelize from "../../database";
import AppError from "../../errors/AppError";

export type ReportColumn = "contactedAt" | "name" | "number" | "notes";

export const reportColumns: Record<ReportColumn, string> = {
  contactedAt: "Data do contato",
  name: "Nome",
  number: "Número",
  notes: "Notas internas"
};

type TicketRow = {
  ticketId: number;
  contactId: number;
  contactedAt: Date;
  name: string;
  number: string;
};

type FieldRow = {
  fieldId: number;
  contactId: number;
  name: string;
  value: string;
  action: string;
  addedAt: Date;
  changedAt: Date;
};

type NoteRow = {
  noteId: number;
  contactId: number;
  note: string;
  action: string;
  addedAt: Date;
  changedAt: Date;
};

const parseDay = (value: unknown): Date => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new AppError("ERR_INVALID_REPORT_DATE", 400);
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
  ) {
    throw new AppError("ERR_INVALID_REPORT_DATE", 400);
  }
  return date;
};

export const reportRange = (from: unknown, to: unknown, tz: unknown) => {
  const start = parseDay(from);
  const finish = parseDay(to);
  if (finish < start) throw new AppError("ERR_INVALID_REPORT_DATE", 400);
  const offset = Number(tz || 0);
  if (!Number.isInteger(offset) || offset < -840 || offset > 840) {
    throw new AppError("ERR_INVALID_REPORT_TIMEZONE", 400);
  }
  const shift = offset * 60_000;
  return {
    start: new Date(start.getTime() + shift),
    end: new Date(finish.getTime() + 86_400_000 + shift),
    offsetMinutes: offset
  };
};

const localDateTime = (date: Date, offsetMinutes: number): string =>
  new Date(new Date(date).getTime() - offsetMinutes * 60_000)
    .toISOString()
    .slice(0, 16)
    .replace("T", " ");

export const listContactFlowFields = async (
  companyId: number,
  end: Date
): Promise<string[]> => {
  const rows = await sequelize.query<{ name: string }>(
    `SELECT DISTINCT name FROM "ContactFieldHistories"
     WHERE "companyId" = :companyId AND "changedAt" < :end
     ORDER BY name`,
    { replacements: { companyId, end }, type: QueryTypes.SELECT }
  );
  return rows.map(row => row.name);
};

export const buildContactFlowReport = async ({
  companyId,
  start,
  end,
  offsetMinutes,
  columns,
  fields
}: {
  companyId: number;
  start: Date;
  end: Date;
  offsetMinutes: number;
  columns: ReportColumn[];
  fields: string[];
}): Promise<{ headers: string[]; rows: string[][] }> => {
  const tickets = await sequelize.query<TicketRow>(
    `SELECT t.id AS "ticketId", t."contactId", COALESCE(inbound."firstInbound", t."createdAt") AS "contactedAt",
            c.name, c.number
     FROM "Tickets" t JOIN "Contacts" c ON c.id = t."contactId"
     LEFT JOIN LATERAL (
       SELECT MIN(m."createdAt") AS "firstInbound"
       FROM "Messages" m
       WHERE m."ticketId" = t.id AND m."fromMe" = false
         AND m."createdAt" >= :start AND m."createdAt" < :end
     ) inbound ON true
     WHERE t."companyId" = :companyId
       AND (inbound."firstInbound" IS NOT NULL OR (
         t."createdAt" >= :start AND t."createdAt" < :end
         AND NOT EXISTS (SELECT 1 FROM "Messages" empty_check WHERE empty_check."ticketId" = t.id)
       ))
       AND COALESCE(t."isGroup", false) = false
     ORDER BY "contactedAt", t.id`,
    { replacements: { companyId, start, end }, type: QueryTypes.SELECT }
  );
  const headers = [
    ...columns.map(column => reportColumns[column]),
    ...fields.flatMap(field => [
      field,
      `${field} — Adicionado em`,
      `${field} — Atualizado em`
    ])
  ];
  if (!tickets.length) return { headers, rows: [] };
  const contactIds = [...new Set(tickets.map(ticket => ticket.contactId))];
  const [fieldRows, noteRows] = await Promise.all([
    sequelize.query<FieldRow>(
      `SELECT DISTINCT ON ("fieldId") "fieldId", "contactId", name, value, action, "addedAt", "changedAt"
       FROM "ContactFieldHistories"
       WHERE "companyId" = :companyId AND "contactId" IN (:contactIds)
         AND "changedAt" < :end
       ORDER BY "fieldId", "changedAt" DESC, id DESC`,
      { replacements: { companyId, contactIds, end }, type: QueryTypes.SELECT }
    ),
    sequelize.query<NoteRow>(
      `SELECT DISTINCT ON ("noteId") "noteId", "contactId", note, action, "addedAt", "changedAt"
       FROM "TicketNoteHistories"
       WHERE "companyId" = :companyId AND "contactId" IN (:contactIds)
         AND "changedAt" < :end
       ORDER BY "noteId", "changedAt" DESC, id DESC`,
      { replacements: { companyId, contactIds, end }, type: QueryTypes.SELECT }
    )
  ]);
  const fieldValues = new Map<number, Map<string, FieldRow>>();
  fieldRows.forEach(field => {
    if (field.action === "delete") return;
    if (!fieldValues.has(field.contactId))
      fieldValues.set(field.contactId, new Map());
    fieldValues.get(field.contactId).set(field.name, field);
  });
  const notes = new Map<number, string[]>();
  noteRows.forEach(note => {
    if (note.action === "delete") return;
    if (!notes.has(note.contactId)) notes.set(note.contactId, []);
    notes
      .get(note.contactId)
      .push(
        `${localDateTime(note.addedAt, offsetMinutes)} — ${note.note}${new Date(note.changedAt).getTime() - new Date(note.addedAt).getTime() > 1000 ? ` (editada em ${localDateTime(note.changedAt, offsetMinutes)})` : ""}`
      );
  });
  const rows = tickets.map(ticket => {
    const standard: Record<ReportColumn, string> = {
      contactedAt: localDateTime(ticket.contactedAt, offsetMinutes),
      name: ticket.name || "",
      number: ticket.number || "",
      notes: (notes.get(ticket.contactId) || []).join(" | ")
    };
    return [
      ...columns.map(column => standard[column]),
      ...fields.flatMap(field => {
        const value = fieldValues.get(ticket.contactId)?.get(field);
        return value
          ? [
              value.value || "",
              localDateTime(value.addedAt, offsetMinutes),
              localDateTime(value.changedAt, offsetMinutes)
            ]
          : ["", "", ""];
      })
    ];
  });
  return { headers, rows };
};
