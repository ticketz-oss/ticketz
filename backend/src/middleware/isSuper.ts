import { Request, Response, NextFunction } from "express";
import AppError from "../errors/AppError";
import User from "../models/User";

const isSuper = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const { super:isSuper } = await User.findByPk(req.user.id);
  if(!isSuper){
    throw new AppError(
      "Acesso não permitido",
      401
    );
  }

  return next();
}

export default isSuper;
