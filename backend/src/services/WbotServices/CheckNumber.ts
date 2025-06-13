import AppError from "../../errors/AppError";
import GetDefaultWhatsApp from "../../helpers/GetDefaultWhatsApp";
import { getWbot } from "../../libs/wbot";
import Whatsapp from "../../models/Whatsapp";

interface IOnWhatsapp {
  jid: string;
  exists: boolean;
  lid: string;
}

const checker = async (number: string, wbot: any) => {
  const jid = number.includes("@") ? number : `${number}@s.whatsapp.net`;
  const [validNumber] = await wbot.onWhatsapp(jid);
  return validNumber;
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
