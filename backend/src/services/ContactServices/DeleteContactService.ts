import { join } from "path";
import fs from "fs";
import Contact from "../../models/Contact";
import AppError from "../../errors/AppError";
import { getPublicPath } from "../../helpers/GetPublicPath";
import { S3Storage } from "../../helpers/S3Storage";
import { logger } from "../../utils/logger";

const fileStorage = S3Storage.getInstance();

const DeleteContactService = async (id: string): Promise<void> => {
  const contact = await Contact.findOne({
    where: { id }
  });

  if (!contact) {
    throw new AppError("ERR_NO_CONTACT_FOUND", 404);
  }

  const relativePath = `media/${contact.companyId}/${contact.id}`;

  await contact.destroy();

  const contactMediaPath = join(getPublicPath(), relativePath);

  // recursively remove contact media folder
  (async () => {
    try {
      if (fs.existsSync(contactMediaPath)) {
        fs.rmSync(contactMediaPath, { recursive: true });
      }
    } catch (error) {
      logger.error(
        { path: contactMediaPath, error },
        `Error on remove contact media folder: ${error.message}`
      );
    }
  })();

  await fileStorage.prepare();
  if (fileStorage.storage) {
    fileStorage.storage.deleteDirectory(relativePath).catch(error => {
      logger.error(
        { path: relativePath, error },
        `S3 Error on delete contact media folder: ${error.message}`
      );
    });
  }
};

export default DeleteContactService;
