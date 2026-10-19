import BaileysContact from "../../models/BaileysContact";
import AppError from "../../errors/AppError";

const ShowBaileysService = async (
  id: string | number
): Promise<BaileysContact[]> => {
  const baileysData = await BaileysContact.findAll({
    where: {
      whatsappId: id
    },
    order: [["contactId", "ASC"]]
  });

  if (!baileysData.length) {
    throw new AppError("ERR_NO_BAILEYS_DATA_FOUND", 404);
  }

  return baileysData;
};

export default ShowBaileysService;
