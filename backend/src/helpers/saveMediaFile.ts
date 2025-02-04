import { FileContents, FileStorage } from "@flystorage/file-storage";
import { LocalStorageAdapter } from "@flystorage/local-fs";
import Ticket from "../models/Ticket";
import { getPublicPath } from "./GetPublicPath";
import { logger } from "../utils/logger";
import { S3Storage } from "./S3Storage";
import { makeRandomId } from "./MakeRandomId";
import Contact from "../models/Contact";

export default async function saveMediaToFile(
  media: {
    data: FileContents;
    mimetype: string;
    filename: string;
  },
  ticket?: Ticket,
  contact?: Contact,
  companyId?: number
): Promise<string> {
  if (!ticket && !contact && !companyId) {
    throw new Error("saveMediaToFile: No ticket, contact or company provided");
  }

  const contactId = ticket?.contactId || contact?.id;
  companyId = companyId || ticket?.companyId || contact?.companyId;

  if (!media.filename) {
    const ext = media.mimetype.split("/")[1].split(";")[0];
    media.filename = `${new Date().getTime()}.${ext}`;
  }

  const randomId = makeRandomId(10);
  let relativePath = `media/${companyId}/`;
  if (contactId) {
    relativePath += `${contactId}/${randomId}`;
  } else if (ticket) {
    relativePath += `/${ticket.id}/${randomId}`;
  } else {
    relativePath += `/${randomId}`;
  }

  const fileStorage = S3Storage.getInstance();
  await fileStorage.prepare();

  const storage =
    fileStorage.storage ||
    new FileStorage(new LocalStorageAdapter(getPublicPath()));

  const mediaPath = `${relativePath}/${media.filename}`;

  try {
    await storage.write(mediaPath, media.data);
  } catch (error) {
    logger.error({ error }, "Error saving media file");
  }

  return fileStorage.storage?.publicUrl(mediaPath) || mediaPath;
}
