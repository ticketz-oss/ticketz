import * as Sentry from "@sentry/node";
import { OmniServices } from "../OmniServices/OmniServices";
import ListWhatsAppsService from "../WhatsappService/ListWhatsAppsService";
import { StartWhatsAppSession } from "./StartWhatsAppSession";

export const StartAllWhatsAppsSessions = async (
  companyId: number
): Promise<void> => {
  try {
    const whatsapps = await ListWhatsAppsService({ companyId, });
    if (whatsapps.length > 0) {
      whatsapps.forEach(whatsapp => {
        if (whatsapp.channel === "whatsapp") {
          StartWhatsAppSession(whatsapp, companyId);
        } else {
          const omniService = OmniServices.getInstance();
          omniService.startService(whatsapp);
        }
      });
    }
  } catch (e) {
    Sentry.captureException(e);
  }
};
