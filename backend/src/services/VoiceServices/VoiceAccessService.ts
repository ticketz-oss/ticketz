import AppError from "../../errors/AppError";
import Company from "../../models/Company";
import Setting from "../../models/Setting";

const enabledValue = (value: unknown): boolean =>
  ["1", "true", "enabled", "yes"].includes(
    String(value || "")
      .trim()
      .toLowerCase()
  );

export const voiceGloballyEnabled = (): boolean =>
  enabledValue(process.env.WACALLS_ENABLED);

export const allowedVoiceCompanyIds = (): Set<number> =>
  new Set(
    String(process.env.WACALLS_ALLOWED_COMPANY_IDS || "")
      .split(",")
      .map(value => Number(value.trim()))
      .filter(value => Number.isInteger(value) && value > 0)
  );

export const assertVoiceCompanyAllowlisted = (companyId: number): void => {
  if (!allowedVoiceCompanyIds().has(companyId)) {
    throw new AppError("ERR_VOICE_NOT_ALLOWLISTED", 403);
  }
};

export const voiceEnabledForCompany = async (
  companyId: number
): Promise<boolean> => {
  if (!voiceGloballyEnabled() || !allowedVoiceCompanyIds().has(companyId)) {
    return false;
  }
  const [company, setting] = await Promise.all([
    Company.findByPk(companyId, {
      attributes: ["id", "status", "platformStatus"]
    }),
    Setting.findOne({
      where: { companyId, key: "voiceCallsEnabled" },
      attributes: ["value"]
    })
  ]);
  return Boolean(
    company?.status &&
    company.platformStatus !== "suspenso" &&
    company.platformStatus !== "cancelado" &&
    enabledValue(setting?.value)
  );
};

export const assertVoiceEnabled = async (companyId: number): Promise<void> => {
  if (!(await voiceEnabledForCompany(companyId))) {
    throw new AppError("ERR_VOICE_DISABLED", 403);
  }
};
