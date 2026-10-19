import { Request, Response, NextFunction } from "express";
import multer from "multer";
import AppError from "../errors/AppError";
import {
  autorizarFotoUsuario,
  salvarFotoUsuario
} from "../services/UserServices/FotoUsuarioService";
import ShowUserService from "../services/UserServices/ShowUserService";
import { SerializeUser } from "../helpers/SerializeUser";
import { getIO } from "../libs/socket";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)) {
      callback(new Error("ERR_INVALID_PROFILE_PHOTO"));
      return;
    }
    callback(null, true);
  }
}).single("photo");

export const autorizar = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  res.locals.usuarioFoto = await autorizarFotoUsuario(
    req.params.userId,
    req.user.id
  );
  next();
};

export const receber = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  upload(req, res, error =>
    next(error ? new AppError("ERR_INVALID_PROFILE_PHOTO", 400) : undefined)
  );
};

export const salvar = async (
  req: Request,
  res: Response
): Promise<Response> => {
  if (req.method !== "DELETE" && !req.file)
    throw new AppError("ERR_INVALID_PROFILE_PHOTO", 400);
  const usuario = res.locals.usuarioFoto;
  await salvarFotoUsuario(usuario, req.file?.buffer || null);
  const user = await SerializeUser(
    await ShowUserService(usuario.id, req.user.id)
  );
  getIO()
    .to(`company-${usuario.companyId}-mainchannel`)
    .emit(`company-${usuario.companyId}-user`, { action: "update", user });
  return res.json(user);
};
