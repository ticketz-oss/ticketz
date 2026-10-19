import AppError from "../../errors/AppError";
import Whatsapp from "../../models/Whatsapp";
import { Op } from "sequelize";
import Contact from "../../models/Contact";
import WhatsappLidMap from "../../models/WhatsappLidMap";
import GetTicketWbot from "../../helpers/GetTicketWbot";
import normalizePhone from "../../helpers/NormalizePhone";
import { getJidOf } from "../WbotServices/getJidOf";
import { assertGroupAccess } from "./GroupAccessService";

interface UserData {
  id: string | number;
  companyId: number;
  profile: string;
}

const normalizeJid = (jid?: string): string =>
  (jid || "").replace(/:\d+(?=@)/, "");

const jidLocalPart = (jid?: string): string => normalizeJid(jid).split("@")[0];

const participantKeys = (participant: {
  id?: string;
  jid?: string;
  lid?: string;
}): string[] => {
  const jids = [participant.id, participant.jid, participant.lid]
    .filter(Boolean)
    .map(normalizeJid);
  const localParts = jids.map(jidLocalPart).filter(Boolean);
  const phoneParts = jids
    .filter(jid => jid.endsWith("@s.whatsapp.net"))
    .flatMap(jid => {
      const normalized = normalizePhone(jidLocalPart(jid));
      return [normalized.phone, normalized.wphone];
    });

  return [...new Set([...jids, ...localParts, ...phoneParts])];
};

const contactKeys = (contact: Contact): string[] => {
  const keys = [contact.number];
  if (/^\d+$/.test(contact.number || "")) {
    const normalized = normalizePhone(contact.number);
    keys.push(normalized.phone, normalized.wphone);
  }
  if (contact.whatsappLidMap?.lid) {
    keys.push(
      normalizeJid(contact.whatsappLidMap.lid),
      jidLocalPart(contact.whatsappLidMap.lid)
    );
  }
  return [...new Set(keys.filter(Boolean))];
};

const ListGroupParticipantsService = async (
  ticketId: number,
  user: UserData
) => {
  const ticket = await assertGroupAccess(ticketId, user);
  const connection = await Whatsapp.findByPk(ticket.whatsappId, {
    attributes: ["apiMode"]
  });
  if (connection?.apiMode === "official")
    throw new AppError("ERR_WAPP_OFFICIAL_MODE_NOT_SUPPORTED", 400);
  const wbot = await GetTicketWbot(ticket);
  const metadata = await wbot.groupMetadata(getJidOf(ticket));
  const participants = metadata.participants || [];
  const allKeys = [
    ...new Set(
      participants.flatMap(participant => participantKeys(participant))
    )
  ];

  const contacts = await Contact.findAll({
    where: {
      companyId: user.companyId,
      isGroup: false,
      number: { [Op.in]: allKeys }
    },
    include: ["whatsappLidMap"]
  });
  const lidJids = allKeys.filter(key => key.endsWith("@lid"));
  const lidMaps = lidJids.length
    ? await WhatsappLidMap.findAll({
        where: { companyId: user.companyId, lid: { [Op.in]: lidJids } },
        include: [{ model: Contact, as: "contact" }]
      })
    : [];
  const knownContacts = [
    ...contacts,
    ...lidMaps.map(lidMap => lidMap.contact).filter(Boolean)
  ];
  const contactByKey = new Map<string, Contact>();
  knownContacts.forEach(contact => {
    contactKeys(contact).forEach(key => contactByKey.set(key, contact));
  });
  lidMaps.forEach(lidMap => {
    if (!lidMap.contact) return;
    contactByKey.set(normalizeJid(lidMap.lid), lidMap.contact);
    contactByKey.set(jidLocalPart(lidMap.lid), lidMap.contact);
  });

  const meKeys = new Set(
    [wbot.user?.id, wbot.myJid, wbot.myLid].filter(Boolean).map(normalizeJid)
  );
  const result = participants.map(participant => {
    const keys = participantKeys(participant);
    const contact = keys.map(key => contactByKey.get(key)).find(Boolean);
    const phoneJid = normalizeJid(participant.jid || participant.id);
    const number = phoneJid.endsWith("@s.whatsapp.net")
      ? normalizePhone(jidLocalPart(phoneJid)).phone
      : jidLocalPart(participant.lid || participant.id);
    const fallbackName =
      participant.name ||
      participant.notify ||
      participant.verifiedName ||
      number;

    return {
      id: normalizeJid(participant.id),
      contactId: contact?.id || null,
      name: contact?.name || fallbackName,
      number: contact?.number || number,
      profilePicUrl: contact?.profilePicUrl || "",
      admin: participant.admin || null,
      isMe: keys.some(key => meKeys.has(normalizeJid(key)))
    };
  });

  result.sort((left, right) => {
    if (!!left.admin !== !!right.admin) return left.admin ? -1 : 1;
    return (left.name || left.number).localeCompare(right.name || right.number);
  });

  return {
    subject: metadata.subject || ticket.contact.name,
    description: metadata.desc || "",
    count: result.length,
    participants: result
  };
};

export default ListGroupParticipantsService;
