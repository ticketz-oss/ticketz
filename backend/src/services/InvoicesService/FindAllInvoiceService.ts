import Invoices from "../../models/Invoices";
import { Op } from "sequelize";

const FindAllPlanService = async (companyId: number): Promise<Invoices[]> => {
  const invoice = await Invoices.findAll({
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
    ],
    where: {
      companyId,
      status: { [Op.ne]: "deleted" }
    },
    order: [["id", "ASC"]]
  });
  return invoice;
};

export default FindAllPlanService;
