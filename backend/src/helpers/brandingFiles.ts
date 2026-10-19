import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import uploadConfig from "../config/upload";
import { logger } from "../utils/logger";
import AppError from "../errors/AppError";

const PREFIX_BY_KEY: Record<string, string> = {
  appLogoLight: "logo_light",
  appLogoDark: "logo_dark",
  appLogoFavicon: "favicon",
  loginSidePanelImage: "login_side",
  loginBackgroundContent: "login_background",
  linkPreviewImage: "link_preview"
};

export const isBrandingKey = (key: string): boolean =>
  Object.prototype.hasOwnProperty.call(PREFIX_BY_KEY, key);

export const removerArquivoBranding = async (
  companyId: number,
  key: string,
  value?: string
): Promise<void> => {
  if (!value || !isBrandingKey(key)) return;
  const arquivo = value.split("?")[0];
  const prefixo = `branding/${companyId}/${PREFIX_BY_KEY[key]}-`;
  const proprio =
    arquivo.startsWith(prefixo) &&
    path.basename(arquivo) === arquivo.slice(`branding/${companyId}/`.length);
  const legado = /^\d{13,}\.[a-zA-Z0-9]+$/.test(arquivo);
  if (!proprio && !legado) return;
  await fs
    .unlink(path.join(uploadConfig.directory, arquivo))
    .catch((err: NodeJS.ErrnoException) => {
      if (err.code !== "ENOENT")
        logger.warn({ err }, "Falha ao excluir imagem substituída");
    });
};

export const storeBrandingFile = async (
  companyId: number,
  key: string,
  file: Express.Multer.File
): Promise<string> => {
  if (!isBrandingKey(key)) throw new AppError("ERR_INVALID_SETTING", 406);
  const diretorio = path.join(
    uploadConfig.directory,
    "branding",
    String(companyId)
  );
  const extensao =
    path.extname(file.originalname).toLowerCase() ||
    path.extname(file.filename);
  const arquivo = `${PREFIX_BY_KEY[key]}-${randomUUID()}${extensao}`;
  await fs.mkdir(diretorio, { recursive: true });
  await fs.rename(
    file.path || path.join(uploadConfig.directory, file.filename),
    path.join(diretorio, arquivo)
  );
  return `branding/${companyId}/${arquivo}`;
};

export default storeBrandingFile;
