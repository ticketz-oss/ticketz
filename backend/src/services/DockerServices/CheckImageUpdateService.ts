import AppError from "../../errors/AppError";
import GetDockerClient from "./GetDockerClient";
import GetRegistryAuthService from "./GetRegistryAuthService";

export interface ImageUpdateCheckResult {
  containerId: string;
  image: string;
  updateAvailable: boolean | null;
  remoteDigest: string | null;
  message?: string;
}

const CheckImageUpdateService = async (
  containerId: string
): Promise<ImageUpdateCheckResult> => {
  const docker = GetDockerClient();

  let info;
  try {
    info = await docker.getContainer(containerId).inspect();
  } catch (err) {
    throw new AppError(`Container não encontrado: ${err.message}`, 404);
  }

  const imageRef = info.Config?.Image || "";

  if (!imageRef || imageRef.startsWith("sha256:")) {
    return {
      containerId,
      image: imageRef,
      updateAvailable: null,
      remoteDigest: null,
      message: "Imagem local sem referência de registro"
    };
  }

  const image = docker.getImage(imageRef);

  const authconfig = GetRegistryAuthService({ imageRef });

  let remoteDigest: string | null = null;
  try {
    const distribution = authconfig
      ? await image.distribution({ authconfig })
      : await image.distribution();
    remoteDigest = distribution?.Descriptor?.digest || null;
  } catch (err) {
    return {
      containerId,
      image: imageRef,
      updateAvailable: null,
      remoteDigest: null,
      message: `Não foi possível consultar o registro: ${err.message}`
    };
  }

  let repoDigests: string[] = [];
  try {
    const imageInfo = await image.inspect();
    repoDigests = imageInfo.RepoDigests || [];
  } catch {
    repoDigests = [];
  }

  if (!remoteDigest) {
    return {
      containerId,
      image: imageRef,
      updateAvailable: null,
      remoteDigest: null,
      message: "Registro não retornou digest da imagem"
    };
  }

  const updateAvailable = !repoDigests.some(digest =>
    digest.endsWith(`@${remoteDigest}`)
  );

  return { containerId, image: imageRef, updateAvailable, remoteDigest };
};

export default CheckImageUpdateService;
