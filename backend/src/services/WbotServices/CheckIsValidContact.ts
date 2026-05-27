import AppError from "../../errors/AppError";
import GetDefaultWhatsApp from "../../helpers/GetDefaultWhatsApp";
import { getWbot } from "../../libs/wbot";
import { getJidOf } from "./getJidOf";

const CheckIsValidContact = async (
  number: string,
  companyId: number
): Promise<void> => {
  const defaultWhatsapp = await GetDefaultWhatsApp(companyId);

  const wbot = getWbot(defaultWhatsapp.id);

  try {
    const address = number.includes("@") ? number : number.replace(/\D/g, "");
    const jid = getJidOf(address);
    const isValidNumber = await wbot.onWhatsApp(jid);
    if (!isValidNumber) {
      throw new AppError("invalidNumber");
    }
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "";

    if (
      errorMessage === "invalidNumber" ||
      errorMessage === "Invalid contact number"
    ) {
      throw new AppError("ERR_WAPP_INVALID_CONTACT");
    }
    throw new AppError("ERR_WAPP_CHECK_CONTACT");
  }
};

export default CheckIsValidContact;
