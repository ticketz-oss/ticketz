import AppError from "../../errors/AppError";
import QuickMessage from "../../models/QuickMessage";

interface Data {
  shortcode: string;
  message: string;
  companyId: number;
  userId?: number;
  id?: number;
}

const UpdateService = async (data: Data): Promise<QuickMessage> => {
  const { id, shortcode, message, companyId, userId } = data;

  const record = await QuickMessage.findByPk(id);

  // Sem o filtro de companyId qualquer sessão autenticada editaria a resposta
  // rápida de outro tenant informando só o id.
  if (!record || record.companyId !== companyId) {
    throw new AppError("ERR_NO_QUICKMESSAGE_FOUND", 404);
  }

  await record.update({
    shortcode,
    message,
    // Quem chama sem userId preserva o dono original do registro.
    ...(userId === undefined ? {} : { userId })
  });

  return record;
};

export default UpdateService;
