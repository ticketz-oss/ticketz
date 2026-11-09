import api from "./api";

// Privacy and Restricted Access Service for ChatV2

const PRIVATE_WHATSAPPS_KEY = "chatv2_private_whatsapp_ids";
const USER_WHATSAPP_PERMS_KEY = "chatv2_user_whatsapp_perms";

export async function syncPrivacySettingsFromBackend(): Promise<void> {
  try {
    const { data: settings } = await api.get<any[]>("/settings");
    if (Array.isArray(settings)) {
      const privSetting = settings.find((s) => s.key === PRIVATE_WHATSAPPS_KEY);
      if (privSetting && privSetting.value) {
        localStorage.setItem(PRIVATE_WHATSAPPS_KEY, privSetting.value);
      }

      const permsSetting = settings.find((s) => s.key === USER_WHATSAPP_PERMS_KEY);
      if (permsSetting && permsSetting.value) {
        localStorage.setItem(USER_WHATSAPP_PERMS_KEY, permsSetting.value);
      }
    }
  } catch (err) {
    console.warn("Could not sync privacy settings from backend:", err);
  }
}

export function isPrivateName(name?: string): boolean {
  if (!name || typeof name !== "string") return false;
  const lower = name.toLowerCase();
  return (
    lower.includes("particular") ||
    lower.includes("privad") ||
    lower.includes("pessoal")
  );
}

export function getPrivateWhatsappIds(): number[] {
  try {
    const raw = localStorage.getItem(PRIVATE_WHATSAPPS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function setWhatsappPrivate(whatsappId: number, isPrivate: boolean): void {
  try {
    const ids = getPrivateWhatsappIds();
    const next = isPrivate
      ? Array.from(new Set([...ids, whatsappId]))
      : ids.filter((id) => id !== whatsappId);
    const jsonVal = JSON.stringify(next);
    localStorage.setItem(PRIVATE_WHATSAPPS_KEY, jsonVal);

    // Persist to backend database so all users and devices share the setting
    api.put(`/settings/${PRIVATE_WHATSAPPS_KEY}`, { value: jsonVal }).catch((err) => {
      console.warn("Error persisting private whatsapps setting to backend:", err);
    });
  } catch {}
}

export function isWhatsappPrivate(whatsappId?: number | null, name?: string): boolean {
  if (isPrivateName(name)) return true;
  if (!whatsappId) return false;
  const privateIds = getPrivateWhatsappIds();
  return privateIds.includes(whatsappId);
}

export function getUserAllowedWhatsappIds(userId?: number): number[] | null {
  if (!userId) return null;
  try {
    const raw = localStorage.getItem(USER_WHATSAPP_PERMS_KEY);
    const map = raw ? JSON.parse(raw) : {};
    return Array.isArray(map[userId]) ? map[userId] : null;
  } catch {
    return null;
  }
}

export function setUserAllowedWhatsappIds(userId: number, whatsappIds: number[]): void {
  try {
    const raw = localStorage.getItem(USER_WHATSAPP_PERMS_KEY);
    const map = raw ? JSON.parse(raw) : {};
    map[userId] = whatsappIds;
    const jsonVal = JSON.stringify(map);
    localStorage.setItem(USER_WHATSAPP_PERMS_KEY, jsonVal);

    // Persist to backend database so all users and devices share the perms
    api.put(`/settings/${USER_WHATSAPP_PERMS_KEY}`, { value: jsonVal }).catch((err) => {
      console.warn("Error persisting user whatsapp perms to backend:", err);
    });
  } catch {}
}

/**
 * Signature preference per WhatsApp connection.
 * Particular lines default to FALSE (no signature), Company lines default to TRUE.
 * Any user toggle is remembered in localStorage per whatsappId.
 */
export function getSignMessagePreference(whatsappId?: number | null, whatsappName?: string): boolean {
  if (!whatsappId) {
    const savedDefault = localStorage.getItem("chatv2_sign_default");
    return savedDefault !== null ? savedDefault === "true" : true;
  }

  const key = `chatv2_sign_${whatsappId}`;
  const saved = localStorage.getItem(key);
  if (saved !== null) {
    return saved === "true";
  }

  // If no explicit preference has been saved yet:
  // Particular/Private line -> default FALSE (no signature)
  if (whatsappId === 2 || isWhatsappPrivate(whatsappId, whatsappName)) {
    return false;
  }

  // Company line -> default TRUE
  return true;
}

export function setSignMessagePreference(whatsappId: number | null | undefined, enabled: boolean): void {
  const key = whatsappId ? `chatv2_sign_${whatsappId}` : "chatv2_sign_default";
  localStorage.setItem(key, String(enabled));
  localStorage.setItem("signMessage", String(enabled));
}

