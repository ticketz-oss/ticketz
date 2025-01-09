import { join } from "path";
import fs from "fs";
import Contact from "../../models/Contact";
import AppError from "../../errors/AppError";
import { getPublicPath } from "../../helpers/GetPublicPath";
import { S3Storage } from "../../helpers/S3Storage";

const fileStorage = S3Storage.getInstance();

const DeleteContactService = async (id: string): Promise<void> => {
  const contact = await Contact.findOne({
    where: { id }
  });

  if (!contact) {
    throw new AppError("ERR_NO_CONTACT_FOUND", 404);
  }

  const relativePath = `media/${contact.companyId}/${contact.id}`;

  const contactMediaPath = join(getPublicPath(), relativePath);

  // recursively remove contact media folder
  fs.rmSync(contactMediaPath, { recursive: true, force: true });

  await fileStorage.prepare();
  if (fileStorage.storage) {
    await fileStorage.storage.deleteDirectory(relativePath);
  }

  await contact.destroy();
};

export default DeleteContactService;
