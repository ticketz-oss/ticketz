import Tasks from "../../models/Tasks";

interface Request {
  title: string,
  description: string,
  isPrivate: boolean,
  userId: number,
  startedAt: Date,
  companyId: number;
}


export const CreateTaskService = async ({
  title,
  description,
  isPrivate,
  userId,
  startedAt,
  companyId
}: Request): Promise<Tasks> => {

  const task = await Tasks.create({

    title,
    description,
    isPrivate,
    userId,
    startedAt,
    companyId,


  });


  return task;


}
