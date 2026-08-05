import AppError from "../../errors/AppError";
import GetDockerClient from "./GetDockerClient";
import GetRegistryAuthService from "./GetRegistryAuthService";

export interface PullImageResult {
  image: string;
  imageId: string;
}

const PullImageService = async (
  containerId: string
): Promise<PullImageResult> => {
  const docker = GetDockerClient();

  let info;
  try {
    info = await docker.getContainer(containerId).inspect();
  } catch (err) {
    throw new AppError(`Container não encontrado: ${err.message}`, 404);
  }

  const imageRef = info.Config?.Image || "";

  if (!imageRef || imageRef.startsWith("sha256:")) {
    throw new AppError(
      "Container utiliza imagem local sem referência de registro; não é possível fazer pull.",
      400
    );
  }

  const authconfig = GetRegistryAuthService({ imageRef });

  let stream;
  try {
    stream = authconfig
      ? await docker.pull(imageRef, { authconfig })
      : await docker.pull(imageRef);
  } catch (err) {
    throw new AppError(
      `Falha ao iniciar pull de ${imageRef}: ${err.message}`,
      500
    );
  }

  await new Promise((resolve, reject) => {
    docker.modem.followProgress(
      stream,
      (err: Error | null, output: unknown) =>
        err ? reject(err) : resolve(output),
      () => {}
    );
  }).catch(err => {
    throw new AppError(`Falha no pull de ${imageRef}: ${err.message}`, 500);
  });

  const imageInfo = await docker.getImage(imageRef).inspect();

  return { image: imageRef, imageId: imageInfo.Id };
};

export default PullImageService;
