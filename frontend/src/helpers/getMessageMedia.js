export const getUnpackedMessage = (msg) => {
  return (
    msg.message?.documentWithCaptionMessage?.message ||
    msg.message?.ephemeralMessage?.message ||
    msg.message?.viewOnceMessage?.message ||
    msg.message?.viewOnceMessageV2?.message ||
    msg.message?.ephemeralMessage?.message ||
    msg.message?.templateMessage?.hydratedTemplate ||
    msg.message?.templateMessage?.hydratedFourRowTemplate ||
    msg.message?.templateMessage?.fourRowTemplate ||
    msg.message?.interactiveMessage?.header ||
    msg.message?.highlyStructuredMessage?.hydratedHsm?.hydratedTemplate ||
    msg.message
  );
};

export const getMessageMedia = (msg) => {
  const unpackedMessage = getUnpackedMessage(msg);
  let mediaType = null;
  let messageMedia = null;

  if (unpackedMessage?.imageMessage) {
    mediaType = "Image";
    messageMedia = unpackedMessage.imageMessage;
  } else if (unpackedMessage?.audioMessage) {
    mediaType = "Audio";
    messageMedia = unpackedMessage.audioMessage;
  } else if (unpackedMessage?.videoMessage) {
    mediaType = "Video";
    messageMedia = unpackedMessage.videoMessage;
  } else if (unpackedMessage?.stickerMessage) {
    mediaType = "Sticker";
    messageMedia = unpackedMessage.stickerMessage;
  } else if (unpackedMessage?.documentMessage) {
    mediaType = "Document";
    messageMedia = unpackedMessage.documentMessage;
  }
  
  return ( { messageMedia, mediaType });
};
