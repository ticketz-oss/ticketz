import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import { logger } from "../../utils/logger";
import Contact from "../../models/Contact";
import Whatsapp from "../../models/Whatsapp";
import CreateMessageService from "../MessageServices/CreateMessageService";
import FindOrCreateTicketService from "../TicketServices/FindOrCreateTicketService";
import UpdateTicketService from "../TicketServices/UpdateTicketService";

const activePollers: Map<number, ReturnType<typeof setInterval>> = new Map();

async function fetchNewEmails(whatsapp: Whatsapp): Promise<void> {
  const client = new ImapFlow({
    host: whatsapp.emailImapHost || whatsapp.emailSmtpHost,
    port: whatsapp.emailImapPort || 993,
    secure: true,
    logger: false,
    auth: {
      user: whatsapp.emailSmtpUser,
      pass: whatsapp.emailSmtpPass
    },
    tls: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    await client.mailboxOpen("INBOX");

    for await (const message of client.fetch({ seen: false }, { envelope: true, source: true })) {
      try {
        const parsed = await simpleParser(message.source as Buffer);

        const fromRaw = parsed.from?.text || "";
        const fromMatch = fromRaw.match(/<([^>]+)>/);
        const fromEmail = fromMatch ? fromMatch[1] : fromRaw.trim();
        const fromName = parsed.from?.value?.[0]?.name || fromEmail;
        const subject = parsed.subject || "(sem assunto)";
        const bodyText =
          parsed.text ||
          (parsed.html ? (parsed.html as string).replace(/<[^>]*>/g, " ") : "") ||
          "";
        const msgId = parsed.messageId || `email-${Date.now()}-${Math.random()}`;

        // Check duplicate
        const MessageModel = require("../../models/Message")
          .default as typeof import("../../models/Message").default;
        const existing = await MessageModel.findOne({ where: { id: msgId } });
        if (existing) continue;

        // Find or create contact
        let contact = await Contact.findOne({
          where: { email: fromEmail, companyId: whatsapp.companyId }
        });
        if (!contact) {
          contact = await Contact.findOne({
            where: { number: fromEmail, companyId: whatsapp.companyId }
          });
        }
        if (!contact) {
          contact = await Contact.create({
            name: fromName,
            number: fromEmail,
            email: fromEmail,
            companyId: whatsapp.companyId,
            channel: "email"
          });
        }

        const { ticket } = await FindOrCreateTicketService(
          contact,
          whatsapp.id,
          whatsapp.companyId,
          { incrementUnread: true }
        );

        const displayBody = `📧 Assunto: ${subject}\n\n${bodyText.trim()}`;

        const messageData = {
          id: msgId,
          ticketId: ticket.id,
          contactId: contact.id,
          body: displayBody.slice(0, 4096),
          fromMe: false,
          read: false,
          mediaUrl: null,
          mediaType: null,
          ack: 0,
          channel: "email"
        };

        await CreateMessageService({ messageData, companyId: whatsapp.companyId });
        await ticket.update({ lastMessage: displayBody.slice(0, 200) });

        if (ticket.status === "closed") {
          await UpdateTicketService({
            ticketData: { status: "pending" },
            ticketId: ticket.id,
            companyId: whatsapp.companyId
          });
        }

        // Mark as seen
        await client.messageFlagsAdd({ uid: message.uid }, ["\\Seen"]);
      } catch (msgErr) {
        logger.error({ msgErr }, "EmailPoller: error processing single email");
      }
    }
  } catch (imapErr) {
    logger.error({ imapErr }, `EmailPoller: IMAP error for connection ${whatsapp.id}`);
  } finally {
    try { await client.logout(); } catch (_) { /* ignore */ }
  }
}

export function startEmailPolling(whatsapp: Whatsapp, intervalMs = 30000): void {
  if (activePollers.has(whatsapp.id)) return;

  logger.info(`EmailPoller: starting for connection ${whatsapp.id} (${whatsapp.name})`);

  const run = async () => {
    try { await fetchNewEmails(whatsapp); }
    catch (err) { logger.error({ err }, `EmailPoller: unhandled error for ${whatsapp.id}`); }
  };

  run(); // immediate first check
  const interval = setInterval(run, intervalMs);
  activePollers.set(whatsapp.id, interval);
}

export function stopEmailPolling(whatsappId: number): void {
  const interval = activePollers.get(whatsappId);
  if (interval) {
    clearInterval(interval);
    activePollers.delete(whatsappId);
    logger.info(`EmailPoller: stopped for connection ${whatsappId}`);
  }
}
