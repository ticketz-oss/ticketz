import AppError from "../../errors/AppError";
import GetDefaultWhatsApp from "../../helpers/GetDefaultWhatsApp";
import { getWbot, Session } from "../../libs/wbot";
import Whatsapp from "../../models/Whatsapp";

interface IOnWhatsapp {
  jid: string;
  exists: boolean;
  lid: string;
}

const checker = async (number: string, wbot: Session) => {
  const jid = number.includes("@") ? number : `${number}@s.whatsapp.net`;
  const [validNumber] = await wbot.onWhatsApp(jid);
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
  const isNumberExit = await checker(number, wbot);

  if (!isNumberExit?.exists) {
    throw new AppError("ERR_CHECK_NUMBER", 404);
  }
  return isNumberExit;
};

export default CheckContactNumber;
