import Contact from "../../models/Contact";
import ContactCustomField from "../../models/ContactCustomField";

type RawExtraFieldName = {
  name: string;
};

const ListExtraFieldNamesService = async (
  companyId: number
): Promise<string[]> => {
  const records = (await ContactCustomField.findAll({
    attributes: ["name"],
    include: [
      {
        model: Contact,
        as: "contact",
        attributes: [],
        where: { companyId }
      }
    ],
    group: ["ContactCustomField.name"],
    raw: true
  })) as RawExtraFieldName[];

  return [
    ...new Set(records.map(record => record?.name?.trim()).filter(Boolean))
  ].sort((left, right) => left.localeCompare(right));
};

export default ListExtraFieldNamesService;
