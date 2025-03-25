import { WAMessage, AnyMessageContent } from "@whiskeysockets/baileys";
import * as Sentry from "@sentry/node";
import fs from "fs";
import { exec } from "child_process";
import path from "path";
import ffmpegPath from "@ffmpeg-installer/ffmpeg";
import mime from "mime-types";
import iconv from "iconv-lite";
import { Readable } from "stream";
import AppError from "../../errors/AppError";
import GetTicketWbot from "../../helpers/GetTicketWbot";
import Ticket from "../../models/Ticket";
import { verifyMediaMessage } from "./wbotMessageListener";

interface Request {
  media: Express.Multer.File;
  ticket: Ticket;
  body?: string;
}

const publicFolder = __dirname.endsWith("/dist")
  ? path.resolve(__dirname, "..", "public")
  : path.resolve(__dirname, "..", "..", "..", "public");

const supportedImages = ["image/png", "image/jpg", "image/jpeg", "image/webp"];

const processRecordedAudio = async (audio: string): Promise<Readable> => {
  const outputAudio = `${publicFolder}/${new Date().getTime()}.ogg`;
  return new Promise((resolve, reject) => {
    exec(
      `${ffmpegPath.path} -i "${audio}" -vn -ar 16000 -ac 1 -c:a libopus -b:a 0 ${outputAudio}`,
      (error, _stdout, _stderr) => {
        if (error) reject(error);
        resolve(fs.createReadStream(outputAudio));
      }
    );
  });
};

export const getMessageOptions = async (
  fileName: string,
  pathMedia: string,
  mimetype?: string
): Promise<AnyMessageContent> => {
  mimetype = mimetype || mime.lookup(pathMedia) || "application/octet-stream";

  try {
    let options: AnyMessageContent;

    if (mimetype.startsWith("video/")) {
      options = {
        video: { stream: fs.createReadStream(pathMedia) }
      };
    } else if (mimetype === "audio/ogg") {
      options = {
        audio: { stream: fs.createReadStream(pathMedia) },
        mimetype: "audio/ogg; codecs=opus",
        ptt: true
      };
    } else if (mimetype.startsWith("audio/")) {
      const needConvert = fileName.includes("audio-record-site");
      options = {
        audio: {
          stream: needConvert
            ? await processRecordedAudio(pathMedia)
            : fs.createReadStream(pathMedia)
        },
        mimetype: needConvert ? "audio/ogg; codecs=opus" : mimetype,
        ptt: needConvert
      };
    } else if (supportedImages.includes(mimetype)) {
      options = {
        image: { stream: fs.createReadStream(pathMedia) }
      };
    } else {
      options = {
        document: { stream: fs.createReadStream(pathMedia) },
        mimetype
      };
    }

    return options;
  } catch (e) {
    Sentry.captureException(e);
    console.log(e);
    return null;
  }
};

const SendWhatsAppMedia = async ({
  media,
  ticket,
  body
}: Request): Promise<WAMessage> => {
  try {
    const wbot = await GetTicketWbot(ticket);

    const pathMedia = media.path;

    let fileName = "";
    try {
      fileName = iconv.decode(
        Buffer.from(media.originalname, "binary"),
        "utf8"
      );
    } catch (error) {
      console.error("Error converting filename to UTF-8:", error);
    }

    const options = await getMessageOptions(
      fileName,
      pathMedia,
      media.mimetype
    );

    const sentMessage = await wbot.sendMessage(
      `${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,
      {
        caption: body || undefined,
        fileName,
        ...options
      } as AnyMessageContent
    );

    wbot.cacheMessage(sentMessage);

    await verifyMediaMessage(sentMessage, ticket, ticket.contact);
    return sentMessage;
  } catch (err) {
    Sentry.captureException(err);
    console.log(err);
    throw new AppError("ERR_SENDING_WAPP_MSG");
  }
};

export default SendWhatsAppMedia;
