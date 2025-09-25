import AppError from "../../errors/AppError";
import GetDefaultWhatsApp from "../../helpers/GetDefaultWhatsApp";
import { getWbot, Session } from "../../libs/wbot";
import Contact from "../../models/Contact";
import Whatsapp from "../../models/Whatsapp";
import { logger } from "../../utils/logger";
import { verifyContact } from "./verifyContact";

export interface IOnWhatsapp {
  jid: string;
  exists: boolean;
  lid: string;
}

const checker = async (number: string, wbot: Session) => {
  const jid = number.includes("@") ? number : `${number}@s.whatsapp.net`;
  const [validNumber] = await wbot.onWhatsApp(jid);

  if (!validNumber) {
    logger.error({ number }, "Failed to check number on whatsapp");
    throw new AppError("ERR_CHECK_NUMBER", 400);
  }

  return {
    jid: validNumber.jid,
    exists: !!validNumber.exists,
    lid: (validNumber.lid as string) || null
  };
};

const CheckContactNumber = async (
  number: string,
  companyId: number,
  whatsapp: Whatsapp = null
): Promise<IOnWhatsapp> => {
  const defaultWhatsapp = whatsapp || (await GetDefaultWhatsApp(companyId));

  const wbot = getWbot(defaultWhatsapp.id);
  const checked = await checker(number, wbot);

  if (!checked?.exists) {
    throw new AppError("ERR_CHECK_NUMBER", 404);
  }
  return checked;
};

export const CheckNumberAndCreateContact = async (
  number: string,
  name: string,
  companyId: number,
  whatsapp: Whatsapp = null
): Promise<Contact> => {
  const defaultWhatsapp = whatsapp || (await GetDefaultWhatsApp(companyId));

  const wbot = getWbot(defaultWhatsapp.id);

  if (!wbot) return null;

  const checked = await checker(number, wbot);

  if (!checked?.exists) {
    throw new AppError("ERR_CHECK_NUMBER", 404);
  }

  return verifyContact(
    { id: checked.jid, lid: checked.lid, name },
    wbot,
    companyId
  );
};

export default CheckContactNumber;
