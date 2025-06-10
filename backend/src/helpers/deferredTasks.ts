const tasks: Map<string, Promise<boolean>> = new Map();

export function deferredTasks() {
  return tasks;
}
