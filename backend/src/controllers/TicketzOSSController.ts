import { Request, Response } from "express";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { GetCompanySetting } from "../helpers/CheckSettings";
import UpdateSettingService from "../services/SettingServices/UpdateSettingService";
import { GitInfo } from "../gitinfo";
import { cacheLayer } from "../libs/cache";

export async function show(_req: Request, res: Response): Promise<Response> {
  if (!process.env.TICKETZ_REGISTRY_URL) {
    return res.status(200).json({ disabled: "true" });
  }

  const registry = JSON.parse(
    await GetCompanySetting(1, "ticketz_registry", "{}")
  );

  return res.status(200).json(registry);
}

export async function store(req: Request, res: Response): Promise<Response> {
  if (!process.env.TICKETZ_REGISTRY_URL) {
    return res.status(200).json({ disabled: "true" });
  }

  await UpdateSettingService({
    key: "ticketz_registry",
    value: JSON.stringify(req.body),
    companyId: 1
  });

  const frontendUrl = URL.parse(process.env.FRONTEND_URL);
  let { hostname } = frontendUrl;
  if (frontendUrl.protocol === "http:") {
    let uniqueInstallId = await cacheLayer.get("uniqueInstallId");
    if (!uniqueInstallId) {
      uniqueInstallId = uuidv4();
      await cacheLayer.set("uniqueInstallId", uniqueInstallId);
    }
    hostname = `${frontendUrl.hostname}.${uniqueInstallId}`;
  }

  const registryData = {
    hostname,
    name: req.body.name,
    whatsapp: req.body.whatsapp,
    email: process.env.EMAIL_ADDRESS || "admin@ticketz.host",
    version: GitInfo.tagName || GitInfo.branchName || GitInfo.commitHash
  };

  await axios.post(process.env.TICKETZ_REGISTRY_URL, registryData);

  return res.status(200).json(true);
}
