import { randomBytes } from "crypto";
import Partner from "../../models/Partner";
import AppError from "../../errors/AppError";

const INVITE_TTL_DAYS = 7;

interface Response {
  inviteToken: string;
  inviteTokenExpiresAt: Date;
}

/**
 * Gera (ou regenera) o token de convite do parceiro. O super admin copia o
 * link resultante e envia por WhatsApp/e-mail manualmente — nao ha transporte
 * de e-mail no projeto.
 *
 * Regenerar invalida o link anterior.
 */
const GeneratePartnerInviteService = async (
  partnerId: number | string
): Promise<Response> => {
  const partner = await Partner.findByPk(partnerId);

  if (!partner) {
    throw new AppError("ERR_NO_PARTNER_FOUND", 404);
  }

  const inviteToken = randomBytes(32).toString("hex");
  const inviteTokenExpiresAt = new Date(
    Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000
  );

  await partner.update({ inviteToken, inviteTokenExpiresAt });

  return { inviteToken, inviteTokenExpiresAt };
};

export default GeneratePartnerInviteService;
