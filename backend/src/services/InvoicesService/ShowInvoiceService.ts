import Invoice from "../../models/Invoices";
import AppError from "../../errors/AppError";
import { Op } from "sequelize";

const ShowInvoceService = async (
  Invoiceid: string | number,
  companyId: number
): Promise<Invoice> => {
  const invoice = await Invoice.findOne({
    where: { id: Invoiceid, companyId, status: { [Op.ne]: "deleted" } },
    attributes: [
      "id",
      "detail",
      "value",
      "currency",
      "dueDate",
      "status",
      "billingType",
      "periodStart",
      "periodEnd",
      "createdAt",
      "updatedAt"
    ]
  });

  if (!invoice) {
    throw new AppError("ERR_NO_PLAN_FOUND", 404);
  }

  return invoice;
};

export default ShowInvoceService;
