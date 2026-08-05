import AppError from "../../errors/AppError";
import GetDockerClient from "./GetDockerClient";

const RestartContainerService = async (containerId: string): Promise<void> => {
  const docker = GetDockerClient();

  try {
    await docker.getContainer(containerId).restart({ t: 10 });
  } catch (err) {
    if (err.statusCode === 404) {
      throw new AppError("Container não encontrado", 404);
    }
    throw new AppError(`Falha ao reiniciar container: ${err.message}`, 500);
  }
};

export default RestartContainerService;
