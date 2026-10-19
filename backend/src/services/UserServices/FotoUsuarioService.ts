import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import sharp from "sharp";
import User from "../../models/User";
import AppError from "../../errors/AppError";
import upload from "../../config/upload";

export const autorizarFotoUsuario = async (
  userId: string | number,
  requestUserId: string | number
): Promise<User> => {
  const [usuario, solicitante] = await Promise.all([
    User.findByPk(userId),
    User.findByPk(requestUserId)
  ]);
  if (!usuario) throw new AppError("ERR_NO_USER_FOUND", 404);
  if (
    !solicitante ||
    (!solicitante.super &&
      (usuario.companyId !== solicitante.companyId ||
        (usuario.id !== solicitante.id && solicitante.profile !== "admin")))
  ) {
    throw new AppError("ERR_FORBIDDEN", 403);
  }
  return usuario;
};

export const prepararFotoUsuario = async (buffer: Buffer): Promise<Buffer> => {
  try {
    const imagem = sharp(buffer, { limitInputPixels: 16000000 });
    const metadados = await imagem.metadata();
    if (!["jpeg", "png", "webp"].includes(metadados.format)) {
      throw new Error("invalid format");
    }
    return await imagem
      .rotate()
      .resize(256, 256, { fit: "cover" })
      .webp({ quality: 82 })
      .toBuffer();
  } catch {
    throw new AppError("ERR_INVALID_PROFILE_PHOTO", 400);
  }
};

const excluirArquivo = async (arquivo: string, companyId: number) => {
  if (
    !arquivo ||
    !new RegExp(`^avatars/${companyId}/[a-f0-9-]+\\.webp$`).test(arquivo)
  )
    return;
  await fs.unlink(path.join(upload.directory, arquivo)).catch(() => undefined);
};

export const salvarFotoUsuario = async (
  usuario: User,
  buffer: Buffer | null
): Promise<void> => {
  const imagem = buffer ? await prepararFotoUsuario(buffer) : null;
  const arquivo = imagem
    ? `avatars/${usuario.companyId}/${randomUUID()}.webp`
    : null;
  if (arquivo) {
    await fs.mkdir(path.dirname(path.join(upload.directory, arquivo)), {
      recursive: true
    });
    await fs.writeFile(
      path.join(upload.directory, arquivo),
      new Uint8Array(imagem)
    );
  }
  let anterior: string;
  try {
    await User.sequelize.transaction(async transaction => {
      const atual = await User.findByPk(usuario.id, {
        transaction,
        lock: transaction.LOCK.UPDATE
      });
      if (!atual) throw new AppError("ERR_NO_USER_FOUND", 404);
      anterior = atual.getDataValue("profilePicUrl");
      await atual.update({ profilePicUrl: arquivo }, { transaction });
    });
  } catch (erro) {
    await excluirArquivo(arquivo, usuario.companyId);
    throw erro;
  }
  await excluirArquivo(anterior, usuario.companyId);
};
