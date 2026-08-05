import { logger } from "../../utils/logger";
import GetDockerClient from "./GetDockerClient";

// After a self update, the replacement container is created with the
// TICKETZ_UPDATE_REPLACE env var pointing to the previous container id.
// On boot, the new instance stops and removes the old container.
const CleanupReplacedContainerService = async (): Promise<void> => {
  const replacedContainerId = process.env.TICKETZ_UPDATE_REPLACE;

  if (!replacedContainerId) {
    return;
  }

  try {
    const docker = GetDockerClient();
    const container = docker.getContainer(replacedContainerId);

    try {
      await container.stop({ t: 15 });
    } catch {
      // already stopped or gone
    }

    await container.remove({ v: false });
    logger.info(
      `Removed replaced container ${replacedContainerId} after self update`
    );
  } catch (err) {
    logger.warn(
      `Could not remove replaced container ${replacedContainerId}: ${err.message}`
    );
  }
};

export default CleanupReplacedContainerService;
