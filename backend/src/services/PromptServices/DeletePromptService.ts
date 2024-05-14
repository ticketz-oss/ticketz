import ShowPromptService from "./ShowPromptService";

const DeletePromptService = async (promptId: number | string, companyId: number | string): Promise<void> => {
  const prompt = await ShowPromptService({ promptId, companyId });

  await prompt.destroy();
};

export default DeletePromptService;
