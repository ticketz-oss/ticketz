import { FileContents, FileStorage } from "@flystorage/file-storage";
import { LocalStorageAdapter } from "@flystorage/local-fs";
import mime from "mime-types";
import { getPublicPath } from "./GetPublicPath";
import { logger } from "../utils/logger";
import { makeRandomId } from "./MakeRandomId";
import Ticket from "../models/Ticket";

export default async function saveMediaToFile(
  media: {
    data: FileContents;
    mimetype: string;
    filename: string;
  },
  destination: Ticket | number
): Promise<string> {
  if (!media || !media.data || !media.mimetype || !destination) {
    logger.error("saveMediaToFile: Invalid media or destination provided");
    throw new Error("Invalid media or destination provided");
  }

  if (!media.filename) {
    const rawMimetype = media.mimetype.split(";")[0];
    const ext = mime.extension(rawMimetype) || "bin";
    media.filename = `${new Date().getTime()}.${ext}`;
  }

  const randomId = makeRandomId(10);

  const companyId =
    typeof destination === "number" ? destination : destination.companyId;
  const contactId =
    typeof destination === "number" ? undefined : destination.contactId;
  const ticketId = typeof destination === "number" ? undefined : destination.id;

  let relativePath = `media/${companyId}/`;

  if (contactId && ticketId) {
    relativePath += `${contactId}/${ticketId}/`;
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
