import Contact from "../../models/Contact";

export type ContactNameSource = "manual" | "external";

export const contactNameLockOnCreate = (
  source: ContactNameSource,
  isGroup = false
): boolean => !isGroup && source === "manual";

export const protectContactNameUpdate = <
  T extends { name?: string; nameLocked?: boolean }
>(
  contact: Contact,
  data: T,
  source: ContactNameSource
): T => {
  if (contact.isGroup || data.name === undefined) return data;

  if (source === "manual") {
    return { ...data, nameLocked: true };
  }

  if (!contact.nameLocked) return data;

  const protectedData = { ...data };
  delete protectedData.name;
  return protectedData as T;
};

export const preserveLockedNameOnMerge = (
  winner: Contact,
  loser: Contact
): { name: string; nameLocked: boolean } | null => {
  if (winner.isGroup || winner.nameLocked || !loser.nameLocked) return null;
  return { name: loser.name, nameLocked: true };
};
