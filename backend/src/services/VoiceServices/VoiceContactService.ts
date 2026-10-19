import { Op } from "sequelize";
import Contact from "../../models/Contact";
import WhatsappLidMap from "../../models/WhatsappLidMap";
import CreateOrUpdateContactService from "../ContactServices/CreateOrUpdateContactService";

const unique = (values: Array<string | null | undefined>): string[] =>
  Array.from(
    new Set(values.filter((value): value is string => Boolean(value)))
  );

export type VoicePeer = {
  peer: string;
  number: string;
  lid: string | null;
};

export const normalizeVoicePeer = (rawPeer: unknown): VoicePeer => {
  const peer = String(rawPeer || "").trim();
  const at = peer.indexOf("@");
  const local = at >= 0 ? peer.slice(0, at) : peer;
  const server = at >= 0 ? peer.slice(at + 1).toLowerCase() : "";
  const base = local.split(":")[0];
  const digits = base.replace(/\D/g, "");
  const lid = server === "lid" && digits ? `${digits}@lid` : null;
  return {
    peer,
    number: lid || digits || peer,
    lid
  };
};

export const resolveVoiceContact = async (
  companyId: number,
  rawPeer: unknown
): Promise<{ contact: Contact; peer: VoicePeer }> => {
  const peer = normalizeVoicePeer(rawPeer);
  const exactLidCandidates = unique([
    peer.lid,
    peer.peer.includes("@lid") ? peer.peer : null
  ]);

  if (exactLidCandidates.length) {
    const mapped = await WhatsappLidMap.findOne({
      where: { companyId, lid: { [Op.in]: exactLidCandidates } },
      include: [{ model: Contact, as: "contact" }]
    });
    if (mapped?.contact) return { contact: mapped.contact, peer };
  }

  const numberCandidates = unique([
    peer.number,
    peer.lid?.split("@")[0],
    peer.peer,
    peer.peer.split("@")[0],
    peer.peer.split(":")[0]
  ]);
  const existing = await Contact.findOne({
    where: { companyId, number: { [Op.in]: numberCandidates } },
    order: [["id", "ASC"]]
  });
  if (existing) return { contact: existing, peer };

  const contact = await CreateOrUpdateContactService({
    companyId,
    name: peer.number,
    number: peer.number,
    channel: "whatsapp",
    isGroup: false
  });
  if (peer.lid && contact) {
    await WhatsappLidMap.findOrCreate({
      where: { companyId, lid: peer.lid },
      defaults: { companyId, lid: peer.lid, contactId: contact.id }
    });
  }
  return { contact, peer };
};
