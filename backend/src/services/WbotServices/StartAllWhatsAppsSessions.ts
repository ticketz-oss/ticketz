import Whatsapp from "../../models/Whatsapp";
import { runtimeOwnsCompany } from "../../helpers/tenantRuntime";
import { logger } from "../../utils/logger";
import { StartWhatsAppSession } from "./StartWhatsAppSession";

export const StartAllWhatsAppsSessions = async (
  companyId: number
): Promise<void> => {
  if (!runtimeOwnsCompany(companyId)) return;
  if (process.env.WHATSAPP_AUTOSTART_ENABLED?.toLowerCase() === "false") {
    logger.info(
      { companyId },
      "Automatic WhatsApp session startup is disabled"
    );
    return;
  }

  try {
    const whatsapps = await Whatsapp.findAll({ where: { companyId } });
    if (whatsapps.length > 0) {
      whatsapps.forEach(whatsapp => {
        if (
          whatsapp.channel === "whatsapp" &&
          whatsapp.apiMode !== "official" &&
          (process.env.WHATSAPP_AUTOSTART_EXISTING_ONLY !== "true" ||
            !!whatsapp.session)
        ) {
          StartWhatsAppSession(whatsapp, companyId);
        }
      });
    }
  } catch (e) {
    logger.error(
      { message: e.message, stack: e.stack },
      "Error starting WhatsApp sessions"
    );
  }
};
