import ConnectionAlert from "../../models/ConnectionAlert";

interface Request {
  companyId?: number;
  alertId?: string;
  isSuper?: boolean;
}

const MarkConnectionAlertsViewedService = async ({
  companyId,
  alertId,
  isSuper
}: Request): Promise<void> => {
  const where: any = {
    viewed: false
  };

  if (alertId) {
    where.id = alertId;
  }

  if (!isSuper && companyId) {
    where.companyId = companyId;
  } else if (companyId) {
    where.companyId = companyId;
  }

  await ConnectionAlert.update(
    {
      viewed: true,
      viewedAt: new Date()
    },
    { where }
  );
};

export default MarkConnectionAlertsViewedService;