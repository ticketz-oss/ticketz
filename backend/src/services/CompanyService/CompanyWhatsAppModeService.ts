import AppError from "../../errors/AppError";

export type CompanyWhatsAppMode = "normal" | "meta";

export const assertCompanyWhatsAppMode = (
  value: unknown = "normal"
): CompanyWhatsAppMode => {
  if (value !== "normal" && value !== "meta") {
    throw new AppError("ERR_COMPANY_INVALID_WHATSAPP_MODE", 400);
  }
  return value;
};

export const assertCompanyWhatsAppModeUnchanged = (
  current: CompanyWhatsAppMode,
  requested: unknown
): void => {
  if (requested === undefined) return;
  const mode = assertCompanyWhatsAppMode(requested);
  if (mode !== current) {
    throw new AppError("ERR_COMPANY_WHATSAPP_MODE_IMMUTABLE", 409);
  }
};
