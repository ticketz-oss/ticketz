import { WAMessage, AnyMediaMessageContent, AnyMessageContent } from "baileys";
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
import { verifyMediaMessage, verifyMessage } from "./wbotMessageListener";
import CheckSettings from "../../helpers/CheckSettings";
import saveMediaToFile from "../../helpers/saveMediaFile";
import { getJidOf } from "./getJidOf";

interface Request {
  media: Express.Multer.File;
  ticket: Ticket;
  caption?: string;
  ptt?: boolean;
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

export const getMessageFileOptions = async (
  fileName: string,
  pathMedia: string,
  mimetype?: string,
  ptt?: boolean
): Promise<AnyMediaMessageContent> => {
  mimetype = mimetype || mime.lookup(pathMedia) || "application/octet-stream";

  try {
    let options: AnyMediaMessageContent;

    if (mimetype.startsWith("video/")) {
      options = {
        fileName,
        video: { stream: fs.createReadStream(pathMedia) }
      };
    } else if (mimetype === "audio/ogg") {
      options = {
        fileName,
        audio: { stream: fs.createReadStream(pathMedia) },
        mimetype: "audio/ogg; codecs=opus",
        ptt: true
      };
    } else if (mimetype.startsWith("audio/")) {
      const needConvert = fileName.includes("audio-record-site");
      options = {
        fileName,
        audio: {
          stream: needConvert
            ? await processRecordedAudio(pathMedia)
            : fs.createReadStream(pathMedia)
        },
        mimetype: needConvert ? "audio/ogg; codecs=opus" : mimetype,
        ptt: needConvert || !!ptt
      };
    } else if (supportedImages.includes(mimetype)) {
      options = {
        fileName,
        image: { stream: fs.createReadStream(pathMedia) }
      };
    } else {
      options = {
        fileName,
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

export const sendWhatsappFile = async (
  ticket: Ticket,
  options: AnyMediaMessageContent
): Promise<WAMessage> => {
  try {
    const wbot = await GetTicketWbot(ticket);

    const sentMessage = await wbot.sendMessage(getJidOf(ticket), options);

    await verifyMediaMessage(sentMessage, ticket, ticket.contact);

    return sentMessage;
  } catch (err) {
    Sentry.captureException(err);
    console.log(err);
    throw new AppError("ERR_SENDING_WAPP_MSG");
  }
};

export const SendWhatsAppMessage = async (
  ticket: Ticket,
  options: AnyMessageContent
): Promise<WAMessage> => {
  try {
    const wbot = await GetTicketWbot(ticket);

    const sentMessage = await wbot.sendMessage(getJidOf(ticket), options);

    wbot.cacheMessage(sentMessage);

    await verifyMessage(sentMessage, ticket, ticket.contact);

    return sentMessage;
  } catch (err) {
    Sentry.captureException(err);
    console.log(err);
    throw new AppError("ERR_SENDING_WAPP_MSG");
  }
};

export const SendWhatsAppMedia = async ({
  media,
  ticket,
  caption,
  ptt
}: Request): Promise<WAMessage> => {
  try {
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

    const fileLimit = parseInt(await CheckSettings("uploadLimit", "15"), 10);

    if (media.size > fileLimit * 1024 * 1024) {
      // convert multer file to Readable
      const readableFile = fs.createReadStream(pathMedia);
      let fileUrl = encodeURI(
        await saveMediaToFile(
          {
            data: readableFile,
            mimetype: media.mimetype,
            filename: media.originalname
          },
          ticket.companyId,
          ticket.id
        )
      );
      if (!fileUrl.startsWith("http")) {
        fileUrl = `${process.env.BACKEND_URL}/public/${fileUrl}`;
      }
      readableFile.close();
      return SendWhatsAppMessage(ticket, {
        text: `📎 *${fileName}*\n\n🔗 ${fileUrl}`
      });
    }

    const options = await getMessageFileOptions(
      fileName,
      pathMedia,
      media.mimetype,
      ptt
    );
    return sendWhatsappFile(ticket, {
      caption: caption || undefined,
      fileName,
      ...options
    } as AnyMediaMessageContent);
  } catch (err) {
    Sentry.captureException(err);
    console.log(err);
    throw new AppError("ERR_SENDING_WAPP_MSG");
  }
};

export default SendWhatsAppMedia;
