import { Semaphore, withTimeout } from "async-mutex";
import Contact from "../../models/Contact";
import AppError from "../../errors/AppError";
import GetDefaultWhatsApp from "../../helpers/GetDefaultWhatsApp";
import { getWbot } from "../../libs/wbot";
import { cacheLayer } from "../../libs/cache";
import GetProfilePicUrl, {
  invalidateProfilePicture
} from "../WbotServices/GetProfilePicUrl";

const slots = new Semaphore(4);
const pending = new Map<string, Promise<unknown>>();

const RefreshContactPictureService = async (id: string, companyId: number) => {
  // Never accept a client-supplied number, URL, company or WhatsApp session.
  if (!/^\d+$/.test(id)) throw new AppError("ERR_NO_CONTACT_FOUND", 404);
  const contact = await Contact.findOne({ where: { id, companyId } });
  if (!contact) throw new AppError("ERR_NO_CONTACT_FOUND", 404);
  const pictures = () => ({
    profilePicUrl: contact.profilePicUrl,
    profileHiresPictureUrl: contact.profileHiresPictureUrl
  });
  if (contact.channel !== "whatsapp") return pictures();
  const key = `contact-picture-refresh:${companyId}:${id}`;
  if (pending.has(key)) return pending.get(key);
  const work = (async () => {
    if (await cacheLayer.get(key)) return pictures();
    try {
      return await withTimeout(slots, 15000).runExclusive(async () => {
        // Negative caching prevents repeated requests for private/missing photos.
        await cacheLayer.set(key, "1", "EX", 300);
        const whatsapp = await GetDefaultWhatsApp(companyId);
        if (whatsapp.apiMode === "official") return pictures();
        const wbot = getWbot(whatsapp.id);
        const jid = contact.number.includes("@")
          ? contact.number
          : `${contact.number}@${contact.isGroup ? "g.us" : "s.whatsapp.net"}`;
        await invalidateProfilePicture(jid, wbot);
        const values: Record<string, string> = {};
        await Promise.all(
          (
            [
              ["preview", "profilePicUrl"],
              ["image", "profileHiresPictureUrl"]
            ] as const
          ).map(async ([type, field]) => {
            try {
              const url = await GetProfilePicUrl(jid, type, wbot);
              if (url) values[field] = url;
            } catch {
              // A temporary error or privacy restriction must not erase a good URL.
            }
          })
        );
        if (Object.keys(values).length) await contact.update(values);
        return pictures();
      });
    } catch {
      // Disconnected/busy sessions are expected; never start one for a photo.
      return pictures();
    }
  })();
  pending.set(key, work);
  try {
    return await work;
  } finally {
    pending.delete(key);
  }
};

export default RefreshContactPictureService;
