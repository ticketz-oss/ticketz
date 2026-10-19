export const tasksInColumn = (tasks, columnId) =>
  tasks
    .filter(task => Number(task.columnId) === Number(columnId))
    .sort((a, b) => a.position - b.position || a.id - b.id);

export const optimisticMove = (
  tasks,
  taskId,
  destinationColumn,
  destinationPosition
) => {
  const moving = tasks.find(task => Number(task.id) === Number(taskId));
  if (!moving) return tasks;

  const sourceColumnId = moving.columnId;
  const source = tasksInColumn(tasks, sourceColumnId).filter(
    task => task.id !== moving.id
  );
  const destination =
    Number(sourceColumnId) === Number(destinationColumn.id)
      ? source
      : tasksInColumn(tasks, destinationColumn.id);
  destination.splice(
    Math.max(0, Math.min(destinationPosition, destination.length)),
    0,
    {
      ...moving,
      version: Number(moving.version || 0) + 1,
      columnId: destinationColumn.id,
      completedAt: destinationColumn.isDone
        ? moving.completedAt || new Date().toISOString()
        : null
    }
  );

  const changedIds = new Set([...source, ...destination].map(task => task.id));
  const untouched = tasks.filter(task => !changedIds.has(task.id));
  const normalizedSource =
    Number(sourceColumnId) === Number(destinationColumn.id)
      ? []
      : source.map((task, position) => ({ ...task, position }));
  const normalizedDestination = destination.map((task, position) => ({
    ...task,
    position
  }));
  return [...untouched, ...normalizedSource, ...normalizedDestination];
};
