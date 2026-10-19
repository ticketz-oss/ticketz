import * as Yup from "yup";
import AppError from "../../errors/AppError";
import ContactListItem from "../../models/ContactListItem";
import { logger } from "../../utils/logger";
import CheckContactNumber from "../WbotServices/CheckNumber";

interface Data {
  name: string;
  number: string;
  contactListId: number;
  companyId: number;
  email?: string;
}

const CreateService = async (data: Data): Promise<ContactListItem> => {
  const { name } = data;

  const contactListItemSchema = Yup.object().shape({
    name: Yup.string()
      .min(3, "ERR_CONTACTLISTITEM_INVALID_NAME")
      .required("ERR_CONTACTLISTITEM_REQUIRED")
  });

  try {
    await contactListItemSchema.validate({ name });
  } catch (err: any) {
    throw new AppError(err.message);
  }

  const [record] = await ContactListItem.findOrCreate({
    where: {
      number: data.number,
      companyId: data.companyId,
      contactListId: data.contactListId
    },
    defaults: data
  });

  try {
    const response = await CheckContactNumber(record.number, record.companyId);
    // Conexao oficial nao verifica numero: sem resposta o contato fica
    // valido e nao verificado, em vez de ser marcado invalido.
    record.isWhatsappValid = response ? response.exists : true;
    if (response) {
      record.number = response.jid.replace(/\D/g, "");
    }
    await record.save();
  } catch (error) {
    // A falha pode ser da conexao, nao do numero - a mensagem antiga
    // culpava o contato e mandava investigar o lugar errado.
    logger.error(
      { error, number: record.number },
      "Could not verify contact number"
    );
  }

  return record;
};

export default CreateService;
