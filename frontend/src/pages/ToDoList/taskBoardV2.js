export const DEADLINE_WARNING_RATIO = 0.75;

export const deadlineState = (task, now = new Date()) => {
  if (!task?.dueAt || task.completedAt) return "none";
  const created = new Date(task.createdAt).getTime();
  const due = new Date(task.dueAt).getTime();
  const current = now.getTime();
  if (!Number.isFinite(created) || !Number.isFinite(due) || due <= created) {
    return "overdue";
  }
  if (current > due) return "overdue";
  return (current - created) / (due - created) >= DEADLINE_WARNING_RATIO
    ? "warning"
    : "ok";
};

export const toTaskInputDate = value => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = number => String(number).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export const toTaskIsoDate = value => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};
