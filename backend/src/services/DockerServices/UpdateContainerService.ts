import os from "os";
import type { ContainerCreateOptions } from "dockerode";
import AppError from "../../errors/AppError";
import { logger } from "../../utils/logger";
import GetDockerClient from "./GetDockerClient";
import PullImageService from "./PullImageService";

export interface UpdateContainerResult {
  updated: boolean;
  self: boolean;
  image: string;
  message: string;
}

interface EndpointSettings {
  Aliases?: string[];
  IPAMConfig?: unknown;
  Links?: string[];
  DriverOpts?: Record<string, string>;
}

const buildEndpointSettings = (
  networks: Record<string, EndpointSettings>
): Record<string, EndpointSettings> => {
  const endpoints: Record<string, EndpointSettings> = {};

  Object.entries(networks || {}).forEach(([networkName, networkConfig]) => {
    endpoints[networkName] = {
      Aliases: networkConfig.Aliases,
      IPAMConfig: networkConfig.IPAMConfig,
      Links: networkConfig.Links,
      DriverOpts: networkConfig.DriverOpts
    };
  });

  return endpoints;
};

const UpdateContainerService = async (
  containerId: string
): Promise<UpdateContainerResult> => {
  const docker = GetDockerClient();
  const container = docker.getContainer(containerId);

  let info;
  try {
    info = await container.inspect();
  } catch (err) {
    throw new AppError(`Container não encontrado: ${err.message}`, 404);
  }

  const imageRef = info.Config?.Image || "";

  if (!imageRef || imageRef.startsWith("sha256:")) {
    throw new AppError(
      "Container utiliza imagem local sem referência de registro; não é possível atualizar.",
      400
    );
  }

  const previousImageId = info.Image;
  const { imageId: newImageId } = await PullImageService(containerId);

  if (newImageId === previousImageId) {
    return {
      updated: false,
      self: false,
      image: imageRef,
      message: "Imagem já está na versão mais recente"
    };
  }

  const containerName = info.Name.replace(/^\//, "");
  const hostname = os.hostname();
  const isSelf = !!hostname && info.Id.startsWith(hostname);

  const env = (info.Config.Env || []).filter(
    entry => !entry.startsWith("TICKETZ_UPDATE_REPLACE=")
  );

  const createOptions: ContainerCreateOptions = {
    ...info.Config,
    name: containerName,
    Image: imageRef,
    Hostname: undefined,
    HostConfig: info.HostConfig,
    NetworkingConfig: {
      EndpointsConfig: buildEndpointSettings(info.NetworkSettings?.Networks)
    }
  };
  delete createOptions.Hostname;

  if (isSelf) {
    // Self update: the old container cannot stop itself mid-process, so it
    // renames itself, starts the replacement and lets the new instance
    // stop/remove the old container (see CleanupReplacedContainerService).
    const oldName = `${containerName}-old-${Date.now()}`;
    await container.rename({ name: oldName });

    createOptions.Env = [...env, `TICKETZ_UPDATE_REPLACE=${info.Id}`];

    const newContainer = await docker.createContainer(createOptions);
    await newContainer.start();

    logger.info(
      `Self update: started replacement container ${newContainer.id} for ${containerName}`
    );

    return {
      updated: true,
      self: true,
      image: imageRef,
      message:
        "Nova versão iniciada. Este container será substituído em instantes."
    };
  }

  try {
    await container.stop({ t: 10 });
  } catch (err) {
    if (err.statusCode !== 304 && err.statusCode !== 404) {
      throw new AppError(`Falha ao parar container: ${err.message}`, 500);
    }
  }

  try {
    await container.remove({ v: false });
  } catch (err) {
    if (err.statusCode !== 404) {
      throw new AppError(`Falha ao remover container: ${err.message}`, 500);
    }
  }

  const newContainer = await docker.createContainer(createOptions);
  await newContainer.start();

  logger.info(`Container ${containerName} recreated with image ${imageRef}`);

  return {
    updated: true,
    self: false,
    image: imageRef,
    message: "Container atualizado e reiniciado com a nova imagem"
  };
};

export default UpdateContainerService;
