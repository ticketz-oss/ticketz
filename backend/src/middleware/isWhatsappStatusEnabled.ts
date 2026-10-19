import { Request, Response, NextFunction } from "express";
import AppError from "../errors/AppError";
import { isStatusEnabled } from "../services/WhatsappStatusServices/StatusFeatureService";

// Blocks every status route for tenants a super admin has not switched on.
const isWhatsappStatusEnabled = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  if (!(await isStatusEnabled(req.user.companyId))) {
    throw new AppError("ERR_STATUS_FEATURE_DISABLED", 403);
  }
  return next();
};

export default isWhatsappStatusEnabled;
