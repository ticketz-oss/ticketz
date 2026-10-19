import AppError from "../../errors/AppError";
import Campaign from "../../models/Campaign";
import ContactList from "../../models/ContactList";
import Whatsapp from "../../models/Whatsapp";
import assertCampaignConnection from "./assertCampaignConnection";

interface Data {
  id: number;
  name: string;
  status: string;
  confirmation: boolean;
  scheduledAt: Date;
  companyId: number;
  contactListId: number;
  whatsappId?: number;
  message1?: string;
  message2?: string;
  message3?: string;
  message4?: string;
  message5?: string;
  confirmationMessage1?: string;
  confirmationMessage2?: string;
  confirmationMessage3?: string;
  confirmationMessage4?: string;
  confirmationMessage5?: string;
}

const UpdateService = async (data: Data): Promise<Campaign> => {
  const { id } = data;

  const record = await Campaign.findByPk(id);

  if (!record) {
    throw new AppError("ERR_NO_CAMPAIGN_FOUND", 404);
  }

  if (["INATIVA", "PROGRAMADA", "CANCELADA"].indexOf(data.status) === -1) {
    throw new AppError(
      "Só é permitido alterar campanha Inativa e Programada",
      400
    );
  }

  await assertCampaignConnection({
    whatsappId: data.whatsappId,
    companyId: data.companyId
  });

  if (data.scheduledAt != null && data.status === "INATIVA") {
    data.status = "PROGRAMADA";
  }

  await record.update(data);

  await record.reload({
    include: [
      { model: ContactList },
      { model: Whatsapp, attributes: ["id", "name"] }
    ]
  });

  return record;
};

export default UpdateService;
