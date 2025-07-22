import { FileContents, FileStorage } from "@flystorage/file-storage";
import { LocalStorageAdapter } from "@flystorage/local-fs";
import { getPublicPath } from "./GetPublicPath";
import { logger } from "../utils/logger";
import { makeRandomId } from "./MakeRandomId";

export default async function saveMediaToFile(
  media: {
    data: FileContents;
    mimetype: string;
    filename: string;
  },
  companyId: number,
  ticketId?: number,
  contactId?: number
): Promise<string> {
  if (!media.filename) {
    const ext = media.mimetype.split("/")[1].split(";")[0];
    media.filename = `${new Date().getTime()}.${ext}`;
  }

  const randomId = makeRandomId(10);
  let relativePath = `media/${companyId}/`;
  if (contactId) {
    relativePath += `${contactId}/`;
  }

  if (ticketId) {
    relativePath += `${ticketId}/`;
  }

  relativePath += `${randomId}`;

  const storage = new FileStorage(new LocalStorageAdapter(getPublicPath()));

  const mediaPath = `${relativePath}/${media.filename}`;

  try {
    await storage.write(mediaPath, media.data);
  } catch (error) {
    logger.error({ message: error.message }, "Error saving media file");
    throw new Error("Failed to save media file");
  }

  return mediaPath;
}
