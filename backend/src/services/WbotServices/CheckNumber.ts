import AppError from "../../errors/AppError";
import GetDefaultWhatsApp from "../../helpers/GetDefaultWhatsApp";
import { getWbot, Session } from "../../libs/wbot";
import Contact from "../../models/Contact";
import Whatsapp from "../../models/Whatsapp";
import { logger } from "../../utils/logger";
import { getJidOf } from "./getJidOf";
import { verifyContact } from "./verifyContact";
import CreateOrUpdateContactService from "../ContactServices/CreateOrUpdateContactService";

export interface IOnWhatsapp {
  jid: string;
  exists: boolean;
  lid: string;
}

const checker = async (number: string, wbot: Session) => {
  const address = number.includes("@") ? number : number.replace(/\D/g, "");
  const jid = getJidOf(address);
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

// A Cloud API nao tem equivalente ao onWhatsApp do Baileys - nao existe como
// perguntar se um numero esta no WhatsApp. Devolver null significa "nao deu pra
// verificar": recusar o cadastro por isso deixava o atendente sem conseguir
// criar contato, e o numero errado apareceria no primeiro envio de qualquer
// forma.
const CheckContactNumber = async (
  number: string,
  companyId: number,
  whatsapp: Whatsapp = null
): Promise<IOnWhatsapp | null> => {
  const defaultWhatsapp = whatsapp || (await GetDefaultWhatsApp(companyId));

  if (defaultWhatsapp.apiMode === "official") {
    return null;
  }

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

  // Sem verificacao possivel na Cloud API, cadastra direto: o contato existe
  // no painel e a validade real aparece no envio.
  if (defaultWhatsapp.apiMode === "official") {
    return CreateOrUpdateContactService({
      name,
      number: number.replace(/\D/g, ""),
      companyId,
      channel: "whatsapp",
      nameSource: "manual"
    });
  }

  const wbot = getWbot(defaultWhatsapp.id);

  if (!wbot) return null;

  const checked = await checker(number, wbot);

  if (!checked?.exists) {
    throw new AppError("ERR_CHECK_NUMBER", 404);
  }

  return verifyContact(
    { id: checked.jid, lid: checked.lid, name },
    wbot,
    companyId,
    "manual"
  );
};

export default CheckContactNumber;
