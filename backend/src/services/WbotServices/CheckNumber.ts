import GetDefaultWhatsApp from "../../helpers/GetDefaultWhatsApp";
import { getWbot } from "../../libs/wbot";
import Whatsapp from "../../models/Whatsapp";

interface IOnWhatsapp {
  jid: string;
  exists: boolean;
}

const checker = async (number: string, wbot: any) => {
  const [validNumber] = await wbot.onWhatsApp(`${number}@s.whatsapp.net`);
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
    throw new Error("ERR_CHECK_NUMBER");
  }
  return isNumberExit;
};

export default CheckContactNumber;
