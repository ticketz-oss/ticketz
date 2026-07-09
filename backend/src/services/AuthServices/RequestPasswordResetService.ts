import crypto from "crypto";
import { Sequelize } from "sequelize";
import * as Yup from "yup";

import AppError from "../../errors/AppError";
import { cacheLayer } from "../../libs/cache";
import User from "../../models/User";
import MailService from "./MailService";

interface Request {
  email: string;
}

const DEFAULT_TTL_SECONDS = 60 * 60;

const RequestPasswordResetService = async ({ email }: Request): Promise<void> => {
  const schema = Yup.object().shape({
    email: Yup.string().email().required()
  });

  try {
    await schema.validate({ email });
  } catch (err: unknown) {
    throw new AppError((err as Error).message);
  }

  const user = await User.findOne({
    where: Sequelize.where(
      Sequelize.fn("LOWER", Sequelize.col("email")),
      email.toLowerCase()
    )
  });

  if (!user) {
    return;
  }

  if (!process.env.FRONTEND_URL) {
    throw new AppError("ERR_FRONTEND_URL_NOT_CONFIGURED", 500);
  }

  const existingTokenHash = await cacheLayer.get(`password-reset-user:${user.id}`);

  if (existingTokenHash) {
    await cacheLayer.del(`password-reset:${existingTokenHash}`);
  }

  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  const ttlSeconds = Number(
    process.env.PASSWORD_RESET_TOKEN_TTL_SECONDS || DEFAULT_TTL_SECONDS
  );
  const resetUrl = `${process.env.FRONTEND_URL.replace(/\/$/, "")}/password-reset?token=${encodeURIComponent(rawToken)}`;

  await cacheLayer.set(
    `password-reset:${tokenHash}`,
    JSON.stringify({
      userId: user.id,
      email: user.email,
      passwordHash: user.passwordHash
    }),
    "EX",
    ttlSeconds
  );

  await cacheLayer.set(
    `password-reset-user:${user.id}`,
    tokenHash,
    "EX",
    ttlSeconds
  );

  const expiresInMinutes = Math.max(1, Math.round(ttlSeconds / 60));

  await MailService({
    to: user.email,
    subject: "Recuperacao de senha",
    text:
      `Recebemos uma solicitacao para redefinir sua senha.\n\n` +
      `Use o link abaixo para cadastrar uma nova senha:\n${resetUrl}\n\n` +
      `Se preferir, informe este token manualmente na tela de redefinicao:\n${rawToken}\n\n` +
      `Este link expira em ${expiresInMinutes} minuto(s).\n` +
      `Se voce nao solicitou essa alteracao, ignore este e-mail.`,
    html:
      `<p>Recebemos uma solicitacao para redefinir sua senha.</p>` +
      `<p><a href="${resetUrl}">Clique aqui para cadastrar uma nova senha</a></p>` +
      `<p>Se preferir, informe este token manualmente na tela de redefinicao:</p>` +
      `<p><strong>${rawToken}</strong></p>` +
      `<p>Este link expira em ${expiresInMinutes} minuto(s).</p>` +
      `<p>Se voce nao solicitou essa alteracao, ignore este e-mail.</p>`
  });
};

export default RequestPasswordResetService;