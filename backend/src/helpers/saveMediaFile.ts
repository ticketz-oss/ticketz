import { FileContents, FileStorage } from "@flystorage/file-storage";
import { LocalStorageAdapter } from "@flystorage/local-fs";
import Ticket from "../models/Ticket";
import { getPublicPath } from "./GetPublicPath";
import { logger } from "../utils/logger";
import { S3Storage } from "./S3Storage";
import { makeRandomId } from "./MakeRandomId";

export default async function saveMediaToFile(
  media: {
    data: FileContents;
    mimetype: string;
    filename: string;
  },
  ticket: Ticket
): Promise<string> {
  if (!media.filename) {
    const ext = media.mimetype.split("/")[1].split(";")[0];
    media.filename = `${new Date().getTime()}.${ext}`;
  }

  const randomId = makeRandomId(10);
  const relativePath = `media/${ticket.companyId}/${ticket.contactId}/${randomId}`;

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
