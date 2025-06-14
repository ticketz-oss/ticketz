import { Request, Response, NextFunction } from "express";

import { WhereOptions } from "sequelize";
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

    const where: WhereOptions<User> = {};

    if (Number(setting.companyId) === 1) {
      if (req.headers["x-user-id"]) {
        where.id = Number(req.headers["x-user-id"]);
      } else {
        where.profile = "admin";
        if (req.headers["x-company-id"]) {
          where.companyId = Number(req.headers["x-company-id"]);
        } else {
          where.companyId = Number(setting.companyId);
          where.super = true;
        }
      }
    } else {
      where.profile = "admin";
      where.companyId = Number(setting.companyId);
    }

    const user = await User.findOne({
      where,
      order: [["id", "ASC"]]
    });

    if (user) {
      req.user = {
        id: `${user.id}`,
        profile: user.profile,
        isSuper: user.super,
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
