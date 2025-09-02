import Invoices from "../../models/Invoices";

const FindAllPlanService = async (companyId: number): Promise<Invoices[]> => {
  const invoice = await Invoices.findAll({
    attributes: [
      "id",
      "detail",
      "value",
      "currency",
      "dueDate",
      "status",
      "createdAt",
      "updatedAt"
    ],
    where: {
      companyId
    },
    order: [["id", "ASC"]]
  });
  return invoice;
};

export default FindAllPlanService;
