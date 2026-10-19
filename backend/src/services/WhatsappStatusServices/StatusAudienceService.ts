// Stub created by the shared scaffold; Task 5 implements it.
import { StatusAudienceMode } from "../../models/WhatsappStatusPost";

export type AudienceInput = {
  companyId: number;
  whatsappId: number;
  audienceMode: StatusAudienceMode;
  contactListId?: number | null;
};

export const resolveAudienceJids = async (
  _input: AudienceInput
): Promise<string[]> => {
  throw new Error("not implemented");
};

export const previewAudience = async (
  _input: AudienceInput
): Promise<{ count: number; sample: string[] }> => {
  throw new Error("not implemented");
};
