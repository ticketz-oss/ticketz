import AppError from "../../errors/AppError";
import Tag from "../../models/Tag";
import ContactTag from "../../models/ContactTag";
import ShowContactService from "../ContactServices/ShowContactService";
import { websocketUpdateContact } from "../ContactServices/UpdateContactService";

export async function contactTagAdd(
  contactId: number,
  tagId: number,
  companyId?: number
) {
  const contact = await ShowContactService(contactId, companyId);
  if (!contact) {
    throw new AppError("ERR_NOT_FOUND", 404);
  }

  if (companyId && contact.companyId !== companyId) {
    throw new AppError("ERR_FORBIDDEN", 403);
  }

  const tag = await Tag.findByPk(tagId);
  if (!tag) {
    throw new AppError("ERR_NOT_FOUND", 404);
  }

  if (contact.companyId !== tag.companyId) {
    throw new AppError("ERR_NOT_FOUND", 404);
  }

  const contactTag = await ContactTag.create({
    contactId,
    tagId
  });

  if (!contactTag) {
    throw new AppError("ERR_UNKNOWN", 400);
  }

  await contact.reload();
  websocketUpdateContact(contact);

  return contactTag;
}

export async function contactTagRemove(
  contactId: number,
  tagId: number,
  companyId?: number
) {
  const contact = await ShowContactService(contactId, companyId);
  if (!contact) {
    throw new AppError("ERR_NOT_FOUND", 404);
  }

  if (companyId && contact.companyId !== companyId) {
    throw new AppError("ERR_FORBIDDEN", 403);
  }

  await ContactTag.destroy({
    where: {
      contactId,
      tagId
    }
  });

  await contact.reload();
  websocketUpdateContact(contact);
}

export async function contactTagRemoveAll(
  contactId: number,
  companyId?: number
) {
  const contact = await ShowContactService(contactId, companyId);
  if (!contact) {
    throw new AppError("ERR_NOT_FOUND", 404);
  }

  if (companyId && contact.companyId !== companyId) {
    throw new AppError("ERR_FORBIDDEN", 403);
  }

  await ContactTag.destroy({
    where: {
      contactId
    }
  });

  await contact.reload();
  websocketUpdateContact(contact);
}
