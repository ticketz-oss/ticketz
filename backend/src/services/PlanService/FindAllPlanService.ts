import Plan from "../../models/Plan";

const FindAllPlanService = async (listPublic?: any): Promise<Plan[]> => {
  let plan
  if (listPublic === "false") 
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
