import { Request, Response, NextFunction } from "express";

import AppError from "../errors/AppError";
import Whatsapp from "../models/Whatsapp";

const gammuAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (req.params.whatsappId) {
      return next();
    }

    const { user, pw: token, dest: number, text: body } = req.query;

    if (user !== "token") {
      throw new AppError("Access denied", 401);
    }

    // check if all parameters are not null
    if (!token || !number || !body) {
      throw new AppError("Access denied", 401);
    }

    // Ensure all parameters are string
    if (typeof token !== "string") {
      throw new AppError("Access denied", 401);
    }
    if (typeof number !== "string") {
      throw new AppError("Invalid number", 401);
    }
    if (typeof body !== "string") {
      throw new AppError("Invalid body", 401);
    }

    const whatsapp = await Whatsapp.findOne({ where: { token } });
    if (whatsapp) {
      req.params = {
        whatsappId: whatsapp.id.toString()
      };
      req.companyId = whatsapp.companyId;
    } else {
      throw new Error();
    }
  } catch (err) {
    throw new AppError("Access denied", 401);
  }

  req.body = {
    number: req.query.dest,
    body: req.query.text
  };

  return next();
};

export default gammuAuth;
