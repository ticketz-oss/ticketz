import { promisify } from "util";
import fs, { writeFile } from "fs";
import { join } from "path";
import Ticket from "../models/Ticket";
import { getPublicPath } from "./GetPublicPath";
import { logger } from "../utils/logger";
import { S3Storage } from "./S3Storage";

const writeFileAsync = promisify(writeFile);

export default async function saveMediaToFile(
  media: {
    data: Buffer;
    mimetype: string;
    filename: string;
  },
  ticket: Ticket
): Promise<string> {
  if (!media.filename) {
    const ext = media.mimetype.split("/")[1].split(";")[0];
    media.filename = `${new Date().getTime()}.${ext}`;
  }

  const relativePath = `media/${ticket.companyId}/${ticket.contactId}/${ticket.id}`;

  const fileStorage = S3Storage.getInstance();
  await fileStorage.prepare();

  if (fileStorage.storage) {
    try {
      await fileStorage.storage.write(
        `${relativePath}/${media.filename}`,
        media.data
      );

      return fileStorage.storage.publicUrl(`${relativePath}/${media.filename}`);
    } catch (error) {
      logger.error(
        { error },
        "Error saving media to file storage - falling back to local"
      );
    }
  }

  try {
    const filePath = getPublicPath();

    // create folders inside filepath if not exists
    await fs.promises.mkdir(join(filePath, relativePath), { recursive: true });

    await writeFileAsync(
      join(filePath, relativePath, media.filename),
      media.data,
      "base64"
    );
  } catch (err) {
    logger.error(err);
  }

  return `${relativePath}/${media.filename}`;
}
