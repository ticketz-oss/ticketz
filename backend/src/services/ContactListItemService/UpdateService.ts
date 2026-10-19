import AppError from "../../errors/AppError";
import ContactListItem from "../../models/ContactListItem";
import { logger } from "../../utils/logger";
import CheckContactNumber from "../WbotServices/CheckNumber";

interface Data {
  id: number | string;
  name: string;
  number: string;
  email?: string;
}

const UpdateService = async (data: Data): Promise<ContactListItem> => {
  const { id, name, number, email } = data;

  const record = await ContactListItem.findByPk(id);

  if (!record) {
    throw new AppError("ERR_NO_CONTACTLISTITEM_FOUND", 404);
  }

  await record.update({
    name,
    number,
    email
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

export default UpdateService;
