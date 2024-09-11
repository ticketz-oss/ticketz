import Invoice from "../../models/Invoices";
import AppError from "../../errors/AppError";

const ShowInvoceService = async (Invoiceid: string | number): Promise<Invoice> => {
  const invoice = await Invoice.findByPk(Invoiceid, {
    attributes: ["id", "detail", "value", "dueDate", "status", "createdAt", "updatedAt"],
  });

  if (!invoice) {
    throw new AppError("ERR_NO_PLAN_FOUND", 404);
  }

  return invoice;
};

export default ShowInvoceService;
