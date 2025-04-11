import { Request, Response, NextFunction } from "express";
import AppError from "../errors/AppError";
import { checkCompanyCompliant } from "../helpers/CheckCompanyCompliant";

const isCompliant = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  if (!req.companyId) {
    throw new AppError("ERR_UNAUTHORIZED", 401);
  }
  if (!(await checkCompanyCompliant(req.companyId))) {
    throw new AppError("ERR_SUBSCRIPTION_EXPIRED", 402);
  }

  return next();
};

export default isCompliant;
