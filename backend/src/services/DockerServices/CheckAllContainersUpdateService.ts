import { logger } from "../../utils/logger";
import CheckImageUpdateService, {
  ImageUpdateCheckResult
} from "./CheckImageUpdateService";
import ListContainersService, {
  DockerContainerInfo
} from "./ListContainersService";

export type UpdateableContainerKind = "backend" | "frontend" | "other";

export interface UpdateableContainer {
  id: string;
  name: string;
  image: string;
  service: string | null;
  project: string | null;
  self: boolean;
  kind: UpdateableContainerKind;
  check: ImageUpdateCheckResult;
}

export interface AllContainersUpdateResult {
  checkedAt: string;
  hasBackendOrFrontendUpdate: boolean;
  hasOtherUpdate: boolean;
  backendOrFrontend: UpdateableContainer[];
  others: UpdateableContainer[];
  all: UpdateableContainer[];
}

// Identifies the container kind based on the compose service name and the
// self flag. The backend is the current instance (self) or the compose
// service named "backend"; the frontend is the compose service named
// "frontend". Everything else is treated as "other".
const classifyContainer = (
  container: DockerContainerInfo
): UpdateableContainerKind => {
  if (container.self || container.service === "backend") {
    return "backend";
  }
  if (container.service === "frontend") {
    return "frontend";
  }
  return "other";
};

const CheckAllContainersUpdateService =
  async (): Promise<AllContainersUpdateResult> => {
    const containers = await ListContainersService();
    const running = containers.filter(c => c.state === "running");

    const updateable: UpdateableContainer[] = [];

    for (let i = 0; i < running.length; i++) {
      const container = running[i];
      try {
        const check = await CheckImageUpdateService(container.id);
        if (check.updateAvailable === true) {
          updateable.push({
            id: container.id,
            name: container.name,
            image: container.image,
            service: container.service,
            project: container.project,
            self: container.self,
            kind: classifyContainer(container),
            check
          });
        }
      } catch (err) {
        logger.warn(
          { message: err?.message, container: container.name },
          "CheckAllContainersUpdateService: failed to check container"
        );
      }
    }

    const backendOrFrontend = updateable.filter(
      c => c.kind === "backend" || c.kind === "frontend"
    );
    const others = updateable.filter(c => c.kind === "other");

    return {
      checkedAt: new Date().toISOString(),
      hasBackendOrFrontendUpdate: backendOrFrontend.length > 0,
      hasOtherUpdate: others.length > 0,
      backendOrFrontend,
      others,
      all: updateable
    };
  };

export default CheckAllContainersUpdateService;
