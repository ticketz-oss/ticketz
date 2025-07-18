import Tasks from "../../models/Tasks";

export const ShowTaskService = async (id: number): Promise<Tasks> => {

  const task = await Tasks.findOne({
    include: ['user'],
    where: { id }
  });

  return task;

}
