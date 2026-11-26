import BaileysSessionContact from "../../models/BaileysSessionContact";
import AppError from "../../errors/AppError";

const ShowBaileysService = async (
  sessionId: string
): Promise<BaileysSessionContact[]> => {
  const baileysData = await BaileysSessionContact.findAll({
    where: {
      sessionId
    },
    order: [["contactId", "ASC"]]
  });

  if (!baileysData.length) {
    throw new AppError("ERR_NO_BAILEYS_DATA_FOUND", 404);
  }

  return baileysData;
};

export default ShowBaileysService;
