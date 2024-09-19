import { Request, Response, NextFunction } from "express";
import AppError from "../errors/AppError";
import { checkAndInitializeWhmcsCustomer, isWhmcsEnabled } from "../services/PaymentGatewayServices/WhmcsServices";

const preLogin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const whmcsEnabled = await isWhmcsEnabled();

    if (!whmcsEnabled) {
      return next();
    }

    const { email, password } = req.body;

    if (!email || !password) {
      throw new AppError("Email and password are required", 401);
    }

    await checkAndInitializeWhmcsCustomer(email, password);
  } catch (error) {
    throw new AppError("Error checking WHMCS", 500);
  }
  return next();
};

export default preLogin;
