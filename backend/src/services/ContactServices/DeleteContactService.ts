import { join } from "path";
import fs from "fs";
import Contact from "../../models/Contact";
import AppError from "../../errors/AppError";
import { getPublicPath } from "../../helpers/GetPublicPath";

const DeleteContactService = async (id: string): Promise<void> => {
  const contact = await Contact.findOne({
    where: { id }
  });

  if (!contact) {
    throw new AppError("ERR_NO_CONTACT_FOUND", 404);
  }

  const contactMediaPath = join(
    getPublicPath(),
    "media",
    `${contact.companyId}/${contact.id}`
  );

  // recursively remove contact media folder
  fs.rmSync(contactMediaPath, { recursive: true, force: true });

  await contact.destroy();
};

export default DeleteContactService;
