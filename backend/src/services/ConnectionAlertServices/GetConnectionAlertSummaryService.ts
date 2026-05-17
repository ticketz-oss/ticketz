import ConnectionAlert from "../../models/ConnectionAlert";

interface Request {
  companyId?: number;
  isSuper?: boolean;
}

type Response = {
  total: number;
  unviewed: number;
  disconnected: number;
  deleted: number;
};

const GetConnectionAlertSummaryService = async ({
  companyId,
  isSuper
}: Request): Promise<Response> => {
  const where = !isSuper && companyId ? { companyId } : companyId ? { companyId } : {};

  const [total, unviewed, disconnected, deleted] = await Promise.all([
    ConnectionAlert.count({ where }),
    ConnectionAlert.count({ where: { ...where, viewed: false } }),
    ConnectionAlert.count({ where: { ...where, eventType: "disconnected" } }),
    ConnectionAlert.count({ where: { ...where, eventType: "deleted" } })
  ]);

  return {
    total,
    unviewed,
    disconnected,
    deleted
  };
};

export default GetConnectionAlertSummaryService;