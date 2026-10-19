import { Op } from "sequelize";
import Partner from "../../models/Partner";
import AppError from "../../errors/AppError";

const MIN_PASSWORD_LENGTH = 6;

/**
 * Resolve o parceiro por um token de convite valido (existente e nao
 * expirado). Usado tanto pela tela publica de convite quanto pelo consumo.
 */
export const FindPartnerByInviteToken = async (
  token: string
): Promise<Partner> => {
  if (!token) {
    throw new AppError("ERR_INVALID_INVITE", 404);
  }

  const partner = await Partner.findOne({
    where: {
      inviteToken: token,
      inviteTokenExpiresAt: { [Op.gt]: new Date() }
    }
  });

  if (!partner) {
    throw new AppError("ERR_INVALID_INVITE", 404);
  }

  return partner;
};

/**
 * Consome o convite definindo a senha do parceiro. O token e' zerado no mesmo
 * update, tornando o link de uso unico.
 */
const AcceptPartnerInviteService = async (
  token: string,
  password: string
): Promise<Partner> => {
  const partner = await FindPartnerByInviteToken(token);

  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    throw new AppError("ERR_PASSWORD_TOO_SHORT", 400);
  }

  await partner.update({
    password,
    inviteToken: null,
    inviteTokenExpiresAt: null,
    status: true
  });

  return partner;
};

export default AcceptPartnerInviteService;
