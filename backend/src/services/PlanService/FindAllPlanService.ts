import Plan from "../../models/Plan";

const FindAllPlanService = async (listPublic: boolean): Promise<Plan[]> => {
  let plan: Plan[];
  if (listPublic) 
  {
    plan = await Plan.findAll({
      where: {
        isPublic: true
      },
      order: [["name", "ASC"]]
    });
  } else {
    plan = await Plan.findAll({
      order: [["name", "ASC"]]
    });
  }
  return plan;
};

export default FindAllPlanService;
