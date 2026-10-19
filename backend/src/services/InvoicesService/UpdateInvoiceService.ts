import AppError from "../../errors/AppError";
import Invoice from "../../models/Invoices";
import { processInvoicePaid } from "../PaymentGatewayServices/PaymentGatewayServices";

interface InvoiceData {
  status: string;
  id?: number | string;
}

const UpdateInvoiceService = async (
  invoiceData: InvoiceData
): Promise<Invoice> => {
  const { id, status } = invoiceData;

  const invoice = await Invoice.findByPk(id);

  if (!invoice) {
    throw new AppError("ERR_NO_PLAN_FOUND", 404);
  }

  if (invoice.status !== "open") {
    if (invoice.status === status) return invoice;
    throw new AppError("ERR_INVALID_INVOICE_TRANSITION", 409);
  }

  if (status === "paid") {
    await processInvoicePaid(invoice);
    await invoice.reload();
  } else if (status === "cancelled") {
    await invoice.update({ status });
  } else {
    throw new AppError("ERR_INVALID_INVOICE_TRANSITION", 409);
  }

  return invoice;
};

export default UpdateInvoiceService;
