import AppError from "../../errors/AppError";

export const cleanTaskBoardTitle = (
  title: unknown,
  maxLength: number
): string => {
  const value = typeof title === "string" ? title.trim() : "";
  if (!value || value.length > maxLength) {
    throw new AppError("ERR_TASK_BOARD_INVALID_TITLE");
  }
  return value;
};

export const cleanTaskBoardColor = (color: unknown): string | null => {
  if (color === null || color === undefined || color === "") return null;
  if (typeof color !== "string" || !/^#[0-9A-Fa-f]{6}$/.test(color)) {
    throw new AppError("ERR_TASK_BOARD_INVALID_COLOR");
  }
  return color.toUpperCase();
};

export const cleanTaskBoardDescription = (description: unknown): string => {
  if (description === undefined || description === null) return "";
  if (typeof description !== "string" || description.length > 10000) {
    throw new AppError("ERR_TASK_BOARD_INVALID_DESCRIPTION");
  }
  return description.trim();
};

export const parseTaskBoardTarget = (
  target: unknown
): "GLOBAL" | "USER" | "QUEUE" => {
  const value = String(target || "GLOBAL").toUpperCase();
  if (!["GLOBAL", "USER", "QUEUE"].includes(value)) {
    throw new AppError("ERR_TASK_BOARD_INVALID_TARGET");
  }
  return value as "GLOBAL" | "USER" | "QUEUE";
};

export const parseTaskBoardDate = (value?: string): Date | undefined => {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new AppError("ERR_TASK_BOARD_INVALID_DATE");
  }
  return date;
};

export const assertTaskBoardDateRange = (from?: Date, to?: Date): void => {
  if (from && to && from > to) {
    throw new AppError("ERR_TASK_BOARD_INVALID_DATE_RANGE");
  }
};

export const completedAtForDestination = (
  isDone: boolean,
  currentCompletedAt: Date | null,
  now = new Date()
): Date | null => (isDone ? currentCompletedAt || now : null);

export const clampTaskPosition = (position: number, length: number): number =>
  Math.max(0, Math.min(Number.isInteger(position) ? position : length, length));
