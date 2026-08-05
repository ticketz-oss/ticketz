import { Router } from "express";
import isAuth from "../middleware/isAuth";
import isSuper from "../middleware/isSuper";

import * as DockerController from "../controllers/DockerController";

const dockerRoutes = Router();

/**
 * @openapi
 * /docker/status:
 *   get:
 *     tags:
 *       - Docker
 *     summary: Check Docker service availability
 *     description: |
 *       Returns whether the Docker daemon is reachable from the backend.
 *       Only super users can access this endpoint.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Docker availability status
 *       401:
 *         description: Access denied
 */
dockerRoutes.get("/docker/status", isAuth, isSuper, DockerController.status);

/**
 * @openapi
 * /docker/containers:
 *   get:
 *     tags:
 *       - Docker
 *     summary: List Docker containers
 *     description: |
 *       Lists all containers visible to the Docker daemon, including stopped
 *       ones, with metadata such as image, state, compose project/service and
 *       whether the container is the current backend instance.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of Docker containers
 *       401:
 *         description: Access denied
 *       503:
 *         description: Docker service unavailable
 */
dockerRoutes.get("/docker/containers", isAuth, isSuper, DockerController.index);

/**
 * @openapi
 * /docker/updates:
 *   get:
 *     tags:
 *       - Docker
 *     summary: Check for updates on all containers
 *     description: |
 *       Lists all running containers and checks whether any image update is
 *       available. The result separates the backend/frontend containers
 *       (which trigger the dashboard banner) from all other containers (which
 *       are handled manually from the settings page).
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Container update summary
 *       401:
 *         description: Access denied
 *       503:
 *         description: Docker service unavailable
 */
dockerRoutes.get(
  "/docker/updates",
  isAuth,
  isSuper,
  DockerController.checkAllUpdates
);

/**
 * @openapi
 * /docker/updates/update-all:
 *   post:
 *     tags:
 *       - Docker
 *     summary: Update backend and frontend containers
 *     description: |
 *       Updates only the backend and frontend containers that have an image
 *       update available, in a safe order: backend first, frontend last.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Update operation result
 *       401:
 *         description: Access denied
 *       503:
 *         description: Docker service unavailable
 */
dockerRoutes.post(
  "/docker/updates/update-all",
  isAuth,
  isSuper,
  DockerController.updateAll
);

/**
 * @openapi
 * /docker/updates/daily-check:
 *   get:
 *     tags:
 *       - Docker
 *     summary: Get the daily Docker update check result
 *     description: |
 *       Returns the result of the most recent daily Docker update check
 *       (populated by the 6 AM cron job). If no cached result exists, it
 *       performs a live check and returns that.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Daily update check result
 *       401:
 *         description: Access denied
 *       503:
 *         description: Docker service unavailable
 */
dockerRoutes.get(
  "/docker/updates/daily-check",
  isAuth,
  isSuper,
  DockerController.getDailyUpdateCheck
);

/**
 * @openapi
 * /docker/updates/refresh:
 *   post:
 *     tags:
 *       - Docker
 *     summary: Refresh the daily Docker update check
 *     description: |
 *       Performs a live check on all running containers and stores the
 *       result as the daily update check cache.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Refreshed update check result
 *       401:
 *         description: Access denied
 *       503:
 *         description: Docker service unavailable
 */
dockerRoutes.post(
  "/docker/updates/refresh",
  isAuth,
  isSuper,
  DockerController.refreshUpdateCheck
);

/**
 * @openapi
 * /docker/containers/{id}/check-update:
 *   get:
 *     tags:
 *       - Docker
 *     summary: Check for image update for a container
 *     description: |
 *       Compares the remote registry digest of the container image with the
 *       locally pulled digest to determine whether an update is available.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Container id
 *     responses:
 *       200:
 *         description: Update check result
 *       401:
 *         description: Access denied
 *       404:
 *         description: Container not found
 */
dockerRoutes.get(
  "/docker/containers/:id/check-update",
  isAuth,
  isSuper,
  DockerController.checkUpdate
);

/**
 * @openapi
 * /docker/containers/{id}/restart:
 *   post:
 *     tags:
 *       - Docker
 *     summary: Restart a container
 *     description: |
 *       Restarts the container with the given id.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Container id
 *     responses:
 *       200:
 *         description: Container restarted
 *       401:
 *         description: Access denied
 *       404:
 *         description: Container not found
 */
dockerRoutes.post(
  "/docker/containers/:id/restart",
  isAuth,
  isSuper,
  DockerController.restart
);

/**
 * @openapi
 * /docker/containers/{id}/update:
 *   post:
 *     tags:
 *       - Docker
 *     summary: Update a container (pull + recreate)
 *     description: |
 *       Pulls the latest image and recreates the container with the new
 *       version, preserving its configuration and network settings. For the
 *       current backend instance, a replacement container is started and the
 *       old one is cleaned up on the next boot.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Container id
 *     responses:
 *       200:
 *         description: Update result
 *       401:
 *         description: Access denied
 *       404:
 *         description: Container not found
 */
dockerRoutes.post(
  "/docker/containers/:id/update",
  isAuth,
  isSuper,
  DockerController.update
);

export default dockerRoutes;
