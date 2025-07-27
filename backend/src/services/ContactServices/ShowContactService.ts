import Contact from "../../models/Contact";
import AppError from "../../errors/AppError";
import Company from "../../models/Company";

const ShowContactService = async (
  id: string | number,
  companyId?: number
): Promise<Contact> => {
  const contact = await Contact.findByPk(id, {
    include: [
      "tags",
      "extraInfo",
      {
        model: Company,
        as: "company",
        attributes: ["id", "language"]
      }
    ]
  });

  if (companyId && contact?.companyId !== companyId) {
    throw new AppError("ERR_FORBIDDEN", 403);
  }

  if (!contact) {
    throw new AppError("ERR_NO_CONTACT_FOUND", 404);
  }

  return contact;
};

export default ShowContactService;
