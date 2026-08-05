import os from "os";
import AppError from "../../errors/AppError";
import GetDockerClient from "./GetDockerClient";

export interface DockerContainerInfo {
  id: string;
  name: string;
  image: string;
  imageId: string;
  state: string;
  status: string;
  created: number;
  project: string | null;
  service: string | null;
  self: boolean;
}

const ListContainersService = async (): Promise<DockerContainerInfo[]> => {
  const docker = GetDockerClient();
  const hostname = os.hostname();

  let containers;
  try {
    containers = await docker.listContainers({ all: true });
  } catch (err) {
    throw new AppError(`Serviço Docker indisponível: ${err.message}`, 503);
  }

  return containers
    .map(container => ({
      id: container.Id,
      name: (container.Names[0] || "").replace(/^\//, ""),
      image: container.Image,
      imageId: container.ImageID,
      state: container.State,
      status: container.Status,
      created: container.Created,
      project: container.Labels?.["com.docker.compose.project"] || null,
      service: container.Labels?.["com.docker.compose.service"] || null,
      self: !!hostname && container.Id.startsWith(hostname)
    }))
    .sort((a, b) => {
      if (a.self !== b.self) return a.self ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
};

export default ListContainersService;
