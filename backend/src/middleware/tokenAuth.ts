import { Request, Response, NextFunction } from "express";

import AppError from "../errors/AppError";
import Whatsapp from "../models/Whatsapp";

const tokenAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.headers.authorization) {
      throw new AppError("ERR_UNAUTHORIZED", 401);
    }
    const token = req.headers.authorization.replace("Bearer ", "");
    if (!token) {
      throw new AppError("ERR_UNAUTHORIZED", 401);
    }
    const whatsapp = await Whatsapp.findOne({ where: { token } });
    if (whatsapp) {
      req.params = {
        whatsappId: whatsapp.id.toString()
      };
      req.companyId = whatsapp.companyId;
    } else {
      throw new AppError("ERR_UNAUTHORIZED", 401);
    }
  } catch (err) {
    if (err instanceof AppError) {
      throw err;
    }
    throw new AppError("ERR_INTERNAL_SERVER_ERROR", 500);
  }

  return next();
};

export default tokenAuth;
