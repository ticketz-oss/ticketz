import { Request, Response, NextFunction } from "express";
import AppError from "../errors/AppError";
import Company from "../models/Company";
import User from "../models/User";
import {
  canUseBillingConsole,
  isBillingConsoleCompany
} from "../helpers/billingConsole";

const isBillingAdmin = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  const user = await User.findByPk(req.user.id, {
    include: [{ model: Company, as: "company", attributes: ["id", "slug"] }]
  });

  if (!isBillingConsoleCompany(user?.company) || !canUseBillingConsole(user)) {
    throw new AppError("Acesso não permitido", 401);
  }

  return next();
};

export default isBillingAdmin;
