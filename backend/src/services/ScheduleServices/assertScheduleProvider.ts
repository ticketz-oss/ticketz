import AppError from "../../errors/AppError";
import Company from "../../models/Company";

// Scheduled sends currently use the Baileys transport. Check the permanent
// company choice without requiring an active connection for unofficial tenants.
export const assertScheduleProvider = async (
  companyId: number
): Promise<void> => {
  const company = await Company.findByPk(companyId, {
    attributes: ["id", "whatsappMode"]
  });
  if (company?.whatsappMode === "meta") {
    throw new AppError("ERR_WAPP_OFFICIAL_MODE_NOT_SUPPORTED", 400);
  }
};
