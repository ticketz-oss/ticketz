import { Sequelize } from "sequelize";
import Partner from "../../models/Partner";
import AppError from "../../errors/AppError";
import {
  createPartnerAccessToken,
  createPartnerRefreshToken
} from "../../helpers/CreatePartnerTokens";
import {
  SerializePartner,
  SerializedPartner
} from "../../helpers/SerializePartner";

interface Request {
  email: string;
  password: string;
}

interface Response {
  partner: SerializedPartner;
  token: string;
  refreshToken: string;
}

const PartnerAuthService = async ({
  email,
  password
}: Request): Promise<Response> => {
  if (!email || !password) {
    throw new AppError("ERR_INVALID_CREDENTIALS", 401);
  }

  const partner = await Partner.findOne({
    where: Sequelize.where(
      Sequelize.fn("LOWER", Sequelize.col("email")),
      email.toLowerCase()
    )
  });

  if (!partner || !(await partner.checkPassword(password))) {
    throw new AppError("ERR_INVALID_CREDENTIALS", 401);
  }

  if (!partner.status) {
    throw new AppError("ERR_PARTNER_INACTIVE", 401);
  }

  return {
    partner: SerializePartner(partner),
    token: createPartnerAccessToken(partner),
    refreshToken: createPartnerRefreshToken(partner)
  };
};

export default PartnerAuthService;
