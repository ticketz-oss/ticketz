import Tasks from "../../models/Tasks";

interface TaskData {
  title: string,
  description: string,
  isPrivate: boolean,
  userId: number,
  startedAt: Date,
  status?: string

}

interface Request {
  taskData: TaskData;
  id: string | number;
}


export const UpdateTaskService = async ({ taskData, id }: Request): Promise<Tasks> => {

  const task = await Tasks.findOne({
    where: { id },
    include: ['user']
  });

  if (!task) {
    throw new Error('Task not found');
  }

  const { title, description, isPrivate, userId, startedAt, status } = taskData;

  await task.update({
    title,
    description,
    isPrivate,
    userId,
    startedAt,
    status
  });

  await task.reload();

  return task;



}
