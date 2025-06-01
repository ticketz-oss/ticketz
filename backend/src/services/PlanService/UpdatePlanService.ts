import AppError from "../../errors/AppError";
import Plan from "../../models/Plan";

interface PlanData {
  name: string;
  id?: number | string;
  users?: number;
  connections?: number;
  queues?: number;
  value?: number;
  isPublic?: boolean;
  downloadLimitMB?: number;
}

const UpdatePlanService = async (planData: PlanData): Promise<Plan> => {
  const { id, name, users, connections, queues, value, isPublic, downloadLimitMB } = planData;

  const plan = await Plan.findByPk(id);

  if (!plan) {
    throw new AppError("ERR_NO_PLAN_FOUND", 404);
  }

  await plan.update({
    name,
    users,
    connections,
    queues,
    value,
    isPublic,
    downloadLimitMB
  });

  return plan;
};

export default UpdatePlanService;
