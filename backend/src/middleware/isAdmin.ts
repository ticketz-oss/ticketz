import { Request, Response, NextFunction } from "express";
import AppError from "../errors/AppError";
import User from "../models/User";
import { canAccessScreen, ScreenId } from "../helpers/screenAccess";

const routeScreen = (path: string): ScreenId | null => {
  if (path.startsWith("/dashboard")) return "dashboard";
  if (path.startsWith("/users")) return "users";
  if (path.startsWith("/announcements")) return "announcements";
  if (path.startsWith("/settings")) return "settings";
  if (path.startsWith("/invoices")) return "financeiro";
  if (/^\/queue\/\d+\/flow(?:\/|$)/.test(path)) return "fluxos";
  if (path.startsWith("/queue")) return "queues";
  if (path.startsWith("/contact-lists")) return "contact-lists";
  if (path.startsWith("/contact-list-items")) return "contact-lists";
  if (path.startsWith("/helps") || path.startsWith("/help-groups"))
    return "helps";
  if (path.startsWith("/chatgpt")) return "chatgpt";
  if (
    path.startsWith("/whatsapp") ||
    path.startsWith("/meta-whatsapp") ||
    path.startsWith("/wavoip") ||
    path.startsWith("/voice")
  )
    return "connections";
  if (
    path.startsWith("/contacts/import") ||
    path.startsWith("/contacts/export")
  )
    return "contacts";
  return null;
};

const isAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  const user = await User.findByPk(req.user.id);
  const screen = routeScreen(req.path);
  if (
    !user ||
    (user.profile !== "admin" &&
      (req.method !== "GET" || !screen || !canAccessScreen(user, screen)))
  ) {
    throw new AppError("Acesso não permitido", 403);
  }

  return next();
};

export default isAdmin;
