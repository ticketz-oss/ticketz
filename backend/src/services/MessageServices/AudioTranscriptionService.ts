import { GetCompanySetting } from "../../helpers/CheckSettings";
import { getPublicPath } from "../../helpers/GetPublicPath";
import { transcriber } from "../../helpers/transcriber";
import { getIO } from "../../libs/socket";
import Message from "../../models/Message";

export async function AudioTranscriptionService(message: Message) {
  if (
    (await GetCompanySetting(
      message.companyId,
      "audioTranscriptions",
      "disabled"
    )) === "enabled"
  ) {
    const apiKey = await GetCompanySetting(
      message.companyId,
      "openAiKey",
      null
    );
    const provider = await GetCompanySetting(
      message.companyId,
      "aiProvider",
      "openai"
    );

    if (!apiKey) {
      return;
    }

    const transcriptionText = await transcriber(
      message.mediaUrl.startsWith("http")
        ? message.mediaUrl
        : `${getPublicPath()}/${message.mediaUrl}`,
      { apiKey, provider },
      message.mediaUrl.split("/").pop()
    );

    if (!transcriptionText) {
      return;
    }

    await message.update({ body: transcriptionText });

    const io = getIO();
    io.to(message.ticketId.toString()).emit(
      `company-${message.companyId}-media`,
      {
        action: "update",
        ticketId: message.ticketId,
        messageId: message.id,
        mediaUrl: message.mediaUrl,
        body: transcriptionText || undefined,
        mediaType: message.mediaType
      }
    );
  }
}
