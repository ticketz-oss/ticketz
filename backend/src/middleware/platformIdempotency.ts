/* eslint-disable @typescript-eslint/no-explicit-any */
import { createHash } from "crypto";
import { NextFunction, Request, Response } from "express";
import { UniqueConstraintError } from "sequelize";
import PlatformIdempotencyKey from "../models/PlatformIdempotencyKey";

const MUTATING_METHODS = new Set(["POST", "PATCH", "DELETE"]);
const IN_PROGRESS_WAIT_MS = 100;
const IN_PROGRESS_MAX_WAITS = 100;
const UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const canonicalize = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }
  if (value && typeof value === "object") {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((result, key) => {
        result[key] = canonicalize((value as Record<string, unknown>)[key]);
        return result;
      }, {});
  }
  return value;
};

const requestHash = (body: unknown): string =>
  createHash("sha256")
    .update(JSON.stringify(canonicalize(body ?? {})))
    .digest("hex");

const responseFromStored = (
  res: Response,
  record: PlatformIdempotencyKey
): Response => {
  const status = record.statusCode || 500;
  const body = record.responseBody || "";
  if (status === 204) {
    return res.status(204).send();
  }
  res.type("application/json; charset=utf-8");
  return res.status(status).send(body);
};

const waitForStoredResponse = async (
  id: string
): Promise<PlatformIdempotencyKey | null> => {
  for (let attempt = 0; attempt < IN_PROGRESS_MAX_WAITS; attempt += 1) {
    const record = await PlatformIdempotencyKey.findByPk(id);
    if (!record || record.statusCode != null) {
      return record;
    }
    await new Promise(resolve => {
      setTimeout(resolve, IN_PROGRESS_WAIT_MS);
    });
  }
  return PlatformIdempotencyKey.findByPk(id);
};

const platformIdempotency = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (!MUTATING_METHODS.has(req.method.toUpperCase())) {
    next();
    return;
  }

  const key = req.header("Idempotency-Key");
  if (!key || !UUID_V4.test(key)) {
    res.status(400).json({ error: "idempotency_key_required" });
    return;
  }

  const method = req.method.toUpperCase();
  const path = req.originalUrl.split("?")[0];
  const bodyHash = requestHash(req.body);

  let record = await PlatformIdempotencyKey.findOne({ where: { key } });

  if (record) {
    if (
      record.method !== method ||
      record.path !== path ||
      record.bodyHash !== bodyHash
    ) {
      res.status(409).json({ error: "idempotency_key_reuse" });
      return;
    }

    if (record.statusCode == null) {
      record = await waitForStoredResponse(record.id);
    }

    if (record?.statusCode != null) {
      responseFromStored(res, record);
      return;
    }

    res.status(409).json({ error: "idempotency_request_in_progress" });
    return;
  }

  try {
    record = await PlatformIdempotencyKey.create({
      key,
      method,
      path,
      bodyHash,
      statusCode: null,
      responseBody: null
    } as any);
  } catch (error) {
    if (!(error instanceof UniqueConstraintError)) {
      throw error;
    }

    const concurrent = await PlatformIdempotencyKey.findOne({ where: { key } });
    if (
      !concurrent ||
      concurrent.method !== method ||
      concurrent.path !== path ||
      concurrent.bodyHash !== bodyHash
    ) {
      res.status(409).json({ error: "idempotency_key_reuse" });
      return;
    }

    const completed = await waitForStoredResponse(concurrent.id);
    if (completed?.statusCode != null) {
      responseFromStored(res, completed);
      return;
    }

    res.status(409).json({ error: "idempotency_request_in_progress" });
    return;
  }

  const originalSend = res.send.bind(res);
  res.send = (async (body?: any): Promise<Response> => {
    const responseBody =
      body === undefined || body === null
        ? ""
        : Buffer.isBuffer(body)
          ? body.toString("utf8")
          : String(body);

    await PlatformIdempotencyKey.update(
      { statusCode: res.statusCode, responseBody },
      { where: { id: record.id, statusCode: null } }
    );

    return originalSend(body);
  }) as any;

  next();
};

export default platformIdempotency;
