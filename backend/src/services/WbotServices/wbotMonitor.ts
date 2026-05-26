import { BinaryNode, Contact as BContact } from "libzapitu-rf";
import * as Sentry from "@sentry/node";

import { Mutex } from "async-mutex";
import Contact from "../../models/Contact";
import Setting from "../../models/Setting";
import Ticket from "../../models/Ticket";
import Whatsapp from "../../models/Whatsapp";
import { logger } from "../../utils/logger";
import createOrUpdateBaileysService from "../BaileysServices/CreateOrUpdateBaileysService";
import CreateMessageService from "../MessageServices/CreateMessageService";
import { _t } from "../TranslationServices/i18nService";
import { Session } from "../../libs/wbot";
import { cacheLayer } from "../../libs/cache";

const contactMutex = new Mutex();

const wbotMonitor = async (
  wbot: Session,
  whatsapp: Whatsapp,
  companyId: number
): Promise<void> => {
  try {
    wbot.ws.on("CB:call", async (node: BinaryNode) => {
      const content = node.content[0] as BinaryNode;

      if (content.tag === "terminate") {
        const sendMsgCall = await Setting.findOne({
          where: { key: "call", companyId }
        });

        if (sendMsgCall.value === "disabled") {
          const number = node.attrs.from.replace(/\D/g, "");

          const contact = await Contact.findOne({
            where: { companyId, number }
          });

          const translationSource = contact || whatsapp;
          const autoMessage = _t("*Automated message*", translationSource);
          const callDisabledMessage = _t(
            "Voice and video calls are disabled for this WhatsApp account, please send a text message. Thank you",
            translationSource
          );

          await wbot.sendMessage(node.attrs.from, {
            text: `${autoMessage}:\n\n${callDisabledMessage}`
          });

          if (!contact) return;

          const ticket = await Ticket.findOne({
            where: {
              contactId: contact.id,
              whatsappId: wbot.id,
              status: "open",
              companyId
            }
          });
          // se não existir o ticket não faz nada.
          if (!ticket) return;

          const body = _t("Missed voice/video call", translationSource);
          const messageData = {
            id: content.attrs["call-id"],
            ticketId: ticket.id,
            contactId: contact.id,
            body,
            fromMe: false,
            mediaType: "call_log",
            read: true,
            quotedMsgId: null,
            ack: 1
          };

          await ticket.update({
            lastMessage: body
          });

          if (ticket.status === "closed") {
            await ticket.update({
              status: "pending"
            });
          }

          CreateMessageService({ messageData, companyId });
        }
      }
    });

    wbot.ev.on("contacts.upsert", async (contacts: BContact[]) => {
      logger.debug({ contacts }, "contacts.upsert");
      contactMutex.runExclusive(async () => {
        await createOrUpdateBaileysService({
          whatsappId: whatsapp.id,
          contacts
        });
      });
    });

    wbot.ev.on("contacts.update", async (contacts: Partial<BContact[]>) => {
      logger.debug({ contacts }, "contacts.update");
      contactMutex.runExclusive(async () => {
        contacts.map(async (c: BContact) => {
          if (["changed", "removed"].includes(c.imgUrl)) {
            cacheLayer.del(`profilePicUrl:${c.id}`);
          }
        });
      });
    });
  } catch (err) {
    Sentry.captureException(err);
    logger.error(err);
  }
};

export default wbotMonitor;
