import User from "../models/User";
import AppError from "../errors/AppError";

export const screenIds = [
  "dashboard",
  "tickets",
  "chats",
  "todolist",
  "contacts",
  "tags",
  "schedules",
  "quick-messages",
  "connections",
  "queues",
  "fluxos",
  "users",
  "announcements",
  "financeiro",
  "settings",
  "helps",
  "chatgpt",
  "campaigns",
  "contact-lists",
  "campaigns-config",
  "subscription"
] as const;

export type ScreenId = (typeof screenIds)[number];

export const defaultUserScreens: ScreenId[] = [
  "tickets",
  "chats",
  "todolist",
  "contacts",
  "tags",
  "schedules",
  "quick-messages",
  "helps",
  "subscription"
];

export const canAccessScreen = (
  user: Pick<User, "profile" | "visibleScreens">,
  screen: ScreenId
): boolean => {
  if (Array.isArray(user.visibleScreens)) {
    return user.visibleScreens.includes(screen);
  }
  return user.profile === "admin" || defaultUserScreens.includes(screen);
};

export const validateVisibleScreens = (screens: unknown): string[] | null => {
  if (screens === null || screens === undefined) return null;
  if (
    !Array.isArray(screens) ||
    screens.some(
      screen =>
        typeof screen !== "string" || !screenIds.includes(screen as ScreenId)
    )
  ) {
    throw new AppError("ERR_INVALID_VISIBLE_SCREENS", 400);
  }
  return [...new Set(screens)];
};
