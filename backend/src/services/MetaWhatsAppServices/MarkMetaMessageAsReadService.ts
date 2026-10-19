import Whatsapp from "../../models/Whatsapp";
import { logger } from "../../utils/logger";
import { getMetaGraphApiClient, withAuth } from "./MetaGraphApiClient";

// Confirma a leitura pro contato (tique azul). A Cloud API marca uma mensagem
// por chamada e considera lidas todas as anteriores, entao basta a mais nova.
// Nunca lanca: falhar em confirmar leitura nao pode derrubar a abertura do
// ticket, que e de onde isso e chamado.
const MarkMetaMessageAsReadService = async (
  connection: Whatsapp,
  messageId: string
): Promise<void> => {
  if (!connection.metaPhoneNumberId || !connection.metaAccessToken) return;

  try {
    await getMetaGraphApiClient().post(
      `/${connection.metaPhoneNumberId}/messages`,
      {
        messaging_product: "whatsapp",
        status: "read",
        message_id: messageId
      },
      withAuth(connection.metaAccessToken)
    );
  } catch (error) {
    logger.warn(
      { error, whatsappId: connection.id, messageId },
      "Could not mark Meta message as read"
    );
  }
};

export default MarkMetaMessageAsReadService;
