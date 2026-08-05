import { Request, Response } from "express";
import AppError from "../errors/AppError";
import { cacheLayer } from "../libs/cache";
import { logger } from "../utils/logger";
import CheckAllContainersUpdateService from "../services/DockerServices/CheckAllContainersUpdateService";
import CheckImageUpdateService from "../services/DockerServices/CheckImageUpdateService";
import GetDockerClient from "../services/DockerServices/GetDockerClient";
import ListContainersService from "../services/DockerServices/ListContainersService";
import RestartContainerService from "../services/DockerServices/RestartContainerService";
import UpdateAllContainersService from "../services/DockerServices/UpdateAllContainersService";
import UpdateContainerService from "../services/DockerServices/UpdateContainerService";

interface DockerErrorLike {
  code?: string;
  statusCode?: number;
  message?: string;
}

const rethrowAsAppError = (err: unknown): never => {
  if (err instanceof AppError) {
    throw err;
  }

  const dockerErr = err as DockerErrorLike;

  if (dockerErr.code === "ENOENT" || dockerErr.code === "ECONNREFUSED") {
    throw new AppError("Serviço Docker indisponível neste servidor", 503);
  }

  const statusCode =
    dockerErr.statusCode &&
    dockerErr.statusCode >= 400 &&
    dockerErr.statusCode < 600
      ? dockerErr.statusCode
      : 500;

  throw new AppError(
    `Docker: ${dockerErr.message || "erro desconhecido"}`,
    statusCode
  );
};

export const status = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const docker = GetDockerClient();
    await docker.ping();
    return res.status(200).json({ available: true });
  } catch (err) {
    return res.status(200).json({ available: false, message: err.message });
  }
};

export const index = async (req: Request, res: Response): Promise<Response> => {
  try {
    const containers = await ListContainersService();
    return res.status(200).json(containers);
  } catch (err) {
    rethrowAsAppError(err);
  }
};

const DOCKER_UPDATES_CACHE_KEY = "docker:updates:daily-check";
const DOCKER_UPDATES_CACHE_TTL_SECONDS = 60 * 60 * 24;

export const checkAllUpdates = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const result = await CheckAllContainersUpdateService();
    return res.status(200).json(result);
  } catch (err) {
    rethrowAsAppError(err);
  }
};

export const getDailyUpdateCheck = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const cached = await cacheLayer.get(DOCKER_UPDATES_CACHE_KEY);
    if (cached) {
      return res.status(200).json({ ...JSON.parse(cached), cached: true });
    }
  } catch (err) {
    logger.warn(
      { message: err?.message },
      "DockerController: failed to read cached update check, falling back to live"
    );
  }

  return checkAllUpdates(req, res);
};

export const refreshUpdateCheck = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const result = await CheckAllContainersUpdateService();
    await cacheLayer.set(
      DOCKER_UPDATES_CACHE_KEY,
      JSON.stringify(result),
      "EX",
      DOCKER_UPDATES_CACHE_TTL_SECONDS
    );
    return res.status(200).json({ ...result, cached: false });
  } catch (err) {
    rethrowAsAppError(err);
  }
};

export const updateAll = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const result = await UpdateAllContainersService();
    return res.status(200).json(result);
  } catch (err) {
    rethrowAsAppError(err);
  }
};

export const checkUpdate = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const result = await CheckImageUpdateService(req.params.id);
    return res.status(200).json(result);
  } catch (err) {
    rethrowAsAppError(err);
  }
};

export const restart = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    await RestartContainerService(req.params.id);
    return res.status(200).json({ restarted: true });
  } catch (err) {
    rethrowAsAppError(err);
  }
};

export const update = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const result = await UpdateContainerService(req.params.id);
    return res.status(200).json(result);
  } catch (err) {
    rethrowAsAppError(err);
  }
};
