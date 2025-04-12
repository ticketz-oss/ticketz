import { Request, Response, NextFunction } from "express";
import AppError from "../errors/AppError";
import User from "../models/User";

const isAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  const { profile } = await User.findByPk(req.user.id);
  if (profile !== "admin") {
    throw new AppError("Acesso não permitido", 403);
  }

  return next();
};

export default isAdmin;
