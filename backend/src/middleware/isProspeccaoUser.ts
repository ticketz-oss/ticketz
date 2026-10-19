import { Request, Response, NextFunction } from "express";
import AppError from "../errors/AppError";
import Company from "../models/Company";
import User from "../models/User";
import { canUseProspeccao, isProspeccaoCompany } from "../helpers/prospeccao";

const isProspeccaoUser = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  const user = await User.findByPk(req.user.id, {
    include: [{ model: Company, as: "company", attributes: ["id", "slug"] }]
  });

  if (!isProspeccaoCompany(user?.company) || !canUseProspeccao(user)) {
    throw new AppError("Acesso não permitido", 401);
  }

  return next();
};

export default isProspeccaoUser;
