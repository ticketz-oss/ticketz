import AppError from "../../errors/AppError";
import { logger } from "../../utils/logger";
import CheckAllContainersUpdateService, {
  UpdateableContainer,
  UpdateableContainerKind
} from "./CheckAllContainersUpdateService";
import UpdateContainerService from "./UpdateContainerService";

export interface UpdateAllContainerStep {
  id: string;
  name: string;
  kind: UpdateableContainerKind;
  updated: boolean;
  self: boolean;
  image: string;
  message: string;
}

export interface UpdateAllContainersResult {
  updated: boolean;
  steps: UpdateAllContainerStep[];
  skipped: UpdateableContainer[];
  error?: string;
}

const byKind = (a: UpdateableContainer, b: UpdateableContainer): number => {
  if (a.kind === b.kind) return 0;
  return a.kind === "backend" ? -1 : 1;
};

// Updates only the backend and frontend containers that have an available
// update, in a safe order: backend first, frontend last.
const UpdateAllContainersService =
  async (): Promise<UpdateAllContainersResult> => {
    const checkResult = await CheckAllContainersUpdateService();
    const targets = checkResult.backendOrFrontend.slice().sort(byKind);

    if (targets.length === 0) {
      return { updated: false, steps: [], skipped: [] };
    }

    const steps: UpdateAllContainerStep[] = [];

    for (let i = 0; i < targets.length; i++) {
      const target = targets[i];
      try {
        const result = await UpdateContainerService(target.id);
        steps.push({
          id: target.id,
          name: target.name,
          kind: target.kind,
          updated: result.updated,
          self: result.self,
          image: result.image,
          message: result.message
        });

        if (!result.updated && !result.self) {
          logger.info(
            `UpdateAllContainersService: ${target.name} already up to date`
          );
        }
      } catch (err) {
        const message = err instanceof AppError ? err.message : err?.message;
        logger.error(
          { message, container: target.name },
          "UpdateAllContainersService: failed to update container"
        );
        steps.push({
          id: target.id,
          name: target.name,
          kind: target.kind,
          updated: false,
          self: target.self,
          image: target.image,
          message: message || "Failed to update"
        });

        // If the backend self-update failed we must stop: the frontend depends
        // on it.
        if (target.kind === "backend") {
          return {
            updated: false,
            steps,
            skipped: targets.slice(i + 1),
            error: `Backend update failed: ${message}`
          };
        }
      }
    }

    return { updated: true, steps, skipped: [] };
  };

export default UpdateAllContainersService;
