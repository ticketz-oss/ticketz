import { Request, Response, NextFunction } from "express";
import AppError from "../errors/AppError";
import Setting from "../models/Setting"; // 1. IMPORTAÇÃO ADICIONADA
import User from "../models/User";
import { logger } from "../utils/logger";

const tokenAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    throw new AppError("ERR_UNAUTHORIZED", 401);
  }

  try {
    const [, token] = authHeader.split(" ");

    // 2. BUSCA DO TOKEN FEITA DIRETAMENTE, SEM HELPER
    const apiTokenSetting = await Setting.findOne({
      where: { key: "apiToken" }
    });

    if (!apiTokenSetting || token.trim() !== apiTokenSetting.value.trim()) {
      throw new AppError("Acesso não permitido", 401);
    }
    
    // Se o token for válido, continuamos com a lógica para anexar o usuário à requisição
    req.companyId = apiTokenSetting.companyId;
    const user = await User.findOne({
      where: {
        profile: "admin",
        companyId: req.companyId
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
    }

    console.log(`[SUCESSO] Token da API validado para a empresa: ${req.companyId}`);
    return next();

  } catch (err) {
    logger.error(err, "Falha na autenticação do token da API");
    throw new AppError("Acesso não permitido", 401);
  }
};

export default tokenAuth;