import { runtimeOwnsCompany } from "../../helpers/tenantRuntime";
import Whatsapp from "../../models/Whatsapp";
import Message from "../../models/Message";
import { logger } from "../../utils/logger";
import { getIO } from "../../libs/socket";
import HandleMetaInboundMessageService from "./HandleMetaInboundMessageService";

// Mesma escala que MessagesList usa pra renderizar os checks (1=pendente,
// 2=enviado, 3=entregue, 4=lido/azul) - precisa bater com o que o Baileys
// grava em wbotMessageListener, nao com o enum bruto da Graph API.
const STATUS_TO_ACK: Record<string, number> = {
  sent: 2,
  delivered: 3,
  read: 4,
  failed: -1
};

// Entrada unica pro POST do webhook, ja com a assinatura validada pelo
// controller. Roda fora do ciclo request/response (fire-and-forget a partir
// do controller) pra nao segurar a resposta 200 que a Meta exige rapido.
const ProcessMetaWebhookEventService = async (payload: any): Promise<void> => {
  const entries = payload?.entry || [];

  for (const entry of entries) {
    for (const change of entry.changes || []) {
      const value = change.value;
      const phoneNumberId = value?.metadata?.phone_number_id;

      if (!phoneNumberId) continue;

      const whatsapp = await Whatsapp.findOne({
        where: { metaPhoneNumberId: phoneNumberId, apiMode: "official" }
      });

      if (!whatsapp || !runtimeOwnsCompany(whatsapp.companyId)) {
        logger.warn(
          { phoneNumberId },
          "Meta webhook event for unknown phoneNumberId, ignoring"
        );
        continue;
      }

      // Desconectar era so cosmetico: a conexao seguia criando ticket e
      // reabrindo conversa. So DISCONNECTED barra - qualquer outro status
      // segue processando, pra nunca perder mensagem por um estado inesperado.
      if (whatsapp.status === "DISCONNECTED") {
        logger.warn(
          { whatsappId: whatsapp.id, phoneNumberId },
          "Meta webhook event for a disconnected connection, ignoring"
        );
        continue;
      }

      const contacts = value?.contacts || [];

      for (const message of value?.messages || []) {
        const metaContact = contacts.find((c: any) => c.wa_id === message.from);
        try {
          await HandleMetaInboundMessageService(whatsapp, metaContact, message);
        } catch (err) {
          logger.error(
            { err, whatsappId: whatsapp.id, messageId: message.id },
            "Failed to process Meta inbound message"
          );
        }
      }

      for (const status of value?.statuses || []) {
        const ack = STATUS_TO_ACK[status.status];

        // A Meta so conta o motivo real da falha aqui (131047 = fora da
        // janela de 24h, 132xxx = problema no template). Descartar
        // `status.errors` deixava o atendente sem nenhuma pista de por que a
        // mensagem nao chegou.
        if (status.errors?.length) {
          logger.warn(
            {
              wamid: status.id,
              recipient: status.recipient_id,
              whatsappId: whatsapp.id,
              graphErrors: status.errors.map((error: any) => ({
                code: error.code,
                title: error.title,
                details: error.error_data?.details
              }))
            },
            "Meta reported a delivery failure"
          );
        }

        if (ack === undefined) continue;
        try {
          // Escopado pela empresa da conexao: a busca so pelo wamid alcancava
          // mensagem de qualquer outro tenant.
          const messageToUpdate = await Message.findOne({
            where: { id: status.id, companyId: whatsapp.companyId }
          });
          // Falha (ack -1) sempre se aplica; so a regressao de um ack
          // positivo (ex: "delivered" chegando depois de "read") e ignorada.
          if (!messageToUpdate || (ack > 0 && ack <= messageToUpdate.ack)) {
            continue;
          }

          await messageToUpdate.update({ ack });

          // Sem isso o front so pega o ack novo num refresh manual - o
          // Baileys (handleMsgAck) sempre emite esse mesmo evento.
          getIO()
            .to(messageToUpdate.ticketId.toString())
            .emit(`company-${messageToUpdate.companyId}-appMessage`, {
              action: "update",
              message: messageToUpdate
            });
        } catch (err) {
          logger.error(
            { err, wamid: status.id },
            "Failed to update Meta message delivery status"
          );
        }
      }
    }
  }
};

export default ProcessMetaWebhookEventService;
