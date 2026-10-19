import AppError from "../../errors/AppError";
import Invoices from "../../models/Invoices";

// A exclusão é lógica de propósito: o registro deixa de aparecer e de poder
// ser pago, mas continua servindo como tombstone do ciclo. Sem isso, a rotina
// automática enxerga a ausência e recria a mesma cobrança no minuto seguinte.
const DeleteBillingInvoiceService = async (
  id: string | number
): Promise<void> => {
  const invoice = await Invoices.findByPk(id);

  if (!invoice || invoice.status === "deleted") {
    throw new AppError("ERR_NO_INVOICE_FOUND", 404);
  }
  if (invoice.status === "paid") {
    throw new AppError("ERR_PAID_INVOICE_CANNOT_BE_DELETED", 409);
  }

  await invoice.update({ status: "deleted" });
};

export default DeleteBillingInvoiceService;
