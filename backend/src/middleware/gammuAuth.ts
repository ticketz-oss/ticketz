import { Request, Response, NextFunction } from "express";

import AppError from "../errors/AppError";
import Whatsapp from "../models/Whatsapp";
import { GetCompanySetting } from "../helpers/CheckSettings";

async function formatWhatsappNumber(
  companyId: number,
  number
): Promise<string> {
  const countryCode = await GetCompanySetting(
    companyId,
    "countryCode",
    "55",
    true
  );

  return number.trim().startsWith("+")
    ? number
        .trim()
        .slice(1)
        .replace(/[^0-9]/g, "")
    : `${countryCode}${number.replace(/[^0-9]/g, "")}`;
}

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

    if (!user) {
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

    req.body = {
      number: await formatWhatsappNumber(whatsapp.companyId, number),
      body: req.query.text
    };

    return next();
  } catch (err) {
    throw new AppError("Access denied", 401);
  }
};

export default gammuAuth;
