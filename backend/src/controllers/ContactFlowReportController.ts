import { Request, Response } from "express";
import * as XLSX from "xlsx";
import PDFDocument from "pdfkit";
import AppError from "../errors/AppError";
import {
  buildContactFlowReport,
  listContactFlowFields,
  reportColumns,
  reportRange,
  ReportColumn
} from "../services/ReportService/ContactFlowReportService";

const parseList = (value: unknown): string[] => {
  let items: unknown = value;
  if (typeof value === "string") {
    if (!value) return [];
    try {
      items = JSON.parse(value);
    } catch {
      items = value.split(",");
    }
  }
  if (!Array.isArray(items) || items.some(item => typeof item !== "string")) {
    throw new AppError("ERR_INVALID_REPORT_FIELDS", 400);
  }
  return [...new Set(items.map(item => item.trim()).filter(Boolean))];
};

export const fields = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { end } = reportRange(req.query.from, req.query.to, req.query.tz);
  const names = await listContactFlowFields(req.user.companyId, end);
  return res.json({ fields: names, columns: reportColumns });
};

export const exportReport = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { start, end, offsetMinutes } = reportRange(
    req.query.from,
    req.query.to,
    req.query.tz
  );
  const format = req.query.format;
  if (format !== "xlsx" && format !== "pdf") {
    throw new AppError("ERR_INVALID_REPORT_FORMAT", 400);
  }
  const columns = parseList(req.query.columns) as ReportColumn[];
  if (!columns.length || columns.some(column => !reportColumns[column])) {
    throw new AppError("ERR_INVALID_REPORT_COLUMN", 400);
  }
  const requestedFields = parseList(req.query.fields);
  const availableFields = await listContactFlowFields(req.user.companyId, end);
  if (requestedFields.some(field => !availableFields.includes(field))) {
    throw new AppError("ERR_INVALID_REPORT_FIELD", 400);
  }
  const report = await buildContactFlowReport({
    companyId: req.user.companyId,
    start,
    end,
    offsetMinutes,
    columns,
    fields: requestedFields
  });
  const filename = `fluxo-contatos-${req.query.from}-a-${req.query.to}`;
  if (format === "xlsx") {
    const safeCell = (value: string) =>
      /^[\s]*[=+\-@]/.test(value) ? `'${value}` : value;
    const worksheet = XLSX.utils.aoa_to_sheet([
      report.headers.map(safeCell),
      ...report.rows.map(row => row.map(safeCell))
    ]);
    worksheet["!cols"] = report.headers.map((header, index) => ({
      wch: Math.min(
        55,
        Math.max(
          16,
          header.length + 2,
          ...report.rows.slice(0, 100).map(row => (row[index] || "").length + 2)
        )
      )
    }));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Contatos");
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${filename}.xlsx"`
    );
    res.send(buffer);
    return;
  }

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${filename}.pdf"`
  );
  const doc = new PDFDocument({ margin: 40, size: "A4" });
  doc.pipe(res);
  doc.fontSize(16).text("Relatório de contatos");
  doc.fontSize(9).text(`${req.query.from} a ${req.query.to}`);
  doc.moveDown();
  if (!report.rows.length) doc.fontSize(10).text("Nenhum contato no período.");
  report.rows.forEach((row, index) => {
    if (doc.y > 730) doc.addPage();
    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .text(`Atendimento ${index + 1}`);
    doc.font("Helvetica").fontSize(9);
    report.headers.forEach((header, column) => {
      if (doc.y > 755) doc.addPage();
      doc.text(`${header}: ${row[column] || "—"}`, { width: 510 });
    });
    doc.moveDown(0.7);
  });
  doc.end();
};
