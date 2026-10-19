import BaileysContact from "../../models/BaileysContact";

const DeleteBaileysService = async (id: string | number): Promise<void> => {
  await BaileysContact.destroy({
    where: {
      whatsappId: id
    }
  });
};

export default DeleteBaileysService;
