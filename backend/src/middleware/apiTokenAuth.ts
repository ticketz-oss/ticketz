import { Request, Response, NextFunction } from "express";

import User from "../models/User";
import Setting from "../models/Setting";
import { logger } from "../utils/logger";

const apiTokenAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return next();
    }

    const setting = await Setting.findOne({
      where: {
        key: "apiToken",
        value: token
      }
    });

    if (!setting) {
      return next();
    }

    const user = await User.findOne({
      where: {
        profile: "admin",
        companyId: setting.companyId
      },
      order: [["id", "ASC"]]
    });

    if (user) {
      req.user = {
        id: `${user.id}`,
        profile: user.profile,
        isSuper: false,
        companyId: user.companyId
      };
      req.companyId = user.companyId;
    }
  } catch (e) {
    logger.error({ message: e.message }, "apiTokenAuth: Error checking Token");
  }
  return next();
};

export default apiTokenAuth;
