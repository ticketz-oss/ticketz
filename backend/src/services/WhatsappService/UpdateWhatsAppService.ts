import * as Yup from "yup";
import { Op } from "sequelize";

import AppError from "../../errors/AppError";
import Whatsapp from "../../models/Whatsapp";
import ShowWhatsAppService from "./ShowWhatsAppService";
import AssociateWhatsappQueue from "./AssociateWhatsappQueue";
import { ProxyConfig } from "../../helpers/createProxyAgent";
import { getWbot } from "../../libs/wbot";

export interface WhatsappData {
  name?: string;
  status?: string;
  session?: string;
  isDefault?: boolean;
  greetingMessage?: string;
  complationMessage?: string;
  outOfHoursMessage?: string;
  ratingMessage?: string;
  transferMessage?: string;
  queueIds?: number[];
  companyId?: number;
  token?: string;
  restrictToQueues?: boolean;
  transferToNewTicket?: boolean;
  proxyConfig?: ProxyConfig;
}

interface Request {
  whatsappData: WhatsappData;
  whatsappId: string;
  companyId: number;
}

interface Response {
  whatsapp: Whatsapp;
  oldDefaultWhatsapp: Whatsapp | null;
}

const UpdateWhatsAppService = async ({
  whatsappData,
  whatsappId,
  companyId
}: Request): Promise<Response> => {
  const schema = Yup.object().shape({
    name: Yup.string().min(2),
    status: Yup.string(),
    isDefault: Yup.boolean()
  });

  const {
    name,
    status,
    isDefault,
    session,
    greetingMessage,
    complationMessage,
    outOfHoursMessage,
    ratingMessage,
    transferMessage,
    queueIds = [],
    token,
    restrictToQueues,
    transferToNewTicket,
    proxyConfig
  } = whatsappData;

  try {
    await schema.validate({ name, status, isDefault });
  } catch (err: unknown) {
    throw new AppError((err as Error).message);
  }

  if (queueIds.length > 1 && !greetingMessage) {
    throw new AppError("ERR_WAPP_GREETING_REQUIRED");
  }

  let oldDefaultWhatsapp: Whatsapp | null = null;

  if (isDefault) {
    oldDefaultWhatsapp = await Whatsapp.findOne({
      where: {
        isDefault: true,
        id: { [Op.not]: whatsappId },
        companyId
      }
    });
    if (oldDefaultWhatsapp) {
      await oldDefaultWhatsapp.update({ isDefault: false });
    }
  }

  const whatsapp = await ShowWhatsAppService(whatsappId, companyId);
  // console.log(transferMessage)
  console.log(whatsapp);

  const oldProxyConfig = whatsapp.proxyConfig;

  await whatsapp.update({
    name,
    status,
    session,
    greetingMessage,
    complationMessage,
    outOfHoursMessage,
    ratingMessage,
    isDefault,
    companyId,
    token,
    transferMessage,
    restrictToQueues,
    transferToNewTicket,
    proxyConfig
  });

  await AssociateWhatsappQueue(whatsapp, queueIds);

  if (
    whatsapp.channel === "whatsapp" &&
    whatsapp.status === "CONNECTED" &&
    JSON.stringify(oldProxyConfig) !== JSON.stringify(proxyConfig)
  ) {
    if (whatsapp.channel === "whatsapp") {
      const wbot = getWbot(whatsapp.id);
      if (wbot) {
        await wbot.ws.close();
      }
    }
  }

  return { whatsapp, oldDefaultWhatsapp };
};

export default UpdateWhatsAppService;
