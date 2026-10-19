import AppError from "../../errors/AppError";
import Whatsapp from "../../models/Whatsapp";

// Campanha e mensagem iniciada pela empresa: na Cloud API oficial so passa
// como template aprovado, que a campanha ainda nao tem. Recusar ao salvar
// evita a campanha que fica EM_ANDAMENTO para sempre sem enviar nada - antes
// so o disparo era pulado, calado, horas depois.
const assertCampaignConnection = async (data: {
  whatsappId?: number;
  companyId?: number;
}): Promise<void> => {
  if (!data.whatsappId) return;

  const connection = await Whatsapp.findOne({
    where: { id: data.whatsappId, companyId: data.companyId },
    attributes: ["id", "apiMode"]
  });

  if (connection?.apiMode === "official") {
    throw new AppError("ERR_WAPP_OFFICIAL_MODE_NOT_SUPPORTED", 400);
  }
};

export default assertCampaignConnection;
