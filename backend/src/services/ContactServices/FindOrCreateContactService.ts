import Contact from "../../models/Contact";
import ContactCustomField from "../../models/ContactCustomField";
import CreateContactService from "./CreateContactService";

interface ExtraInfo extends ContactCustomField {
  name: string;
  value: string;
}

interface Request {
  name: string;
  number: string;
  companyId: number;
  email?: string;
  profilePicUrl?: string;
  extraInfo?: ExtraInfo[];
}

const FindOrCreateContactService = async ({
  name,
  number,
  companyId
}: Request): Promise<Contact> => {
  return CreateContactService({
    name,
    number,
    companyId,
    returnFound: true
  });
};

export default FindOrCreateContactService;
