import ShowService from "./ShowService";
import RenumberSiblingsService, { scopeOf } from "./RenumberSiblingsService";

const DeleteService = async (queueOptionId: number | string): Promise<void> => {
  const queueOption = await ShowService(queueOptionId);

  // O escopo precisa ser lido antes do destroy, que zera a instancia.
  const scope = scopeOf(queueOption);

  await queueOption.destroy();

  // Fecha o buraco deixado na numeracao, no lugar do loop de PUTs que o
  // frontend disparava sem await.
  await RenumberSiblingsService(scope);
};

export default DeleteService;
