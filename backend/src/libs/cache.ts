import Redis from "ioredis";
import {
  REDIS_MANDATORY_CLEAR_COUNTER,
  REDIS_URI_CONNECTION
} from "../config/redis";
import * as crypto from "crypto";
import { logger } from "../utils/logger";

type RedisSetOption = "EX" | "PX" | "EXAT" | "PXAT" | "NX" | "XX" | "KEEPTTL";

let redis: Redis | null = null;

function getRedisClient(): Redis {
  if (!redis) {
    redis = new Redis(REDIS_URI_CONNECTION);
  }

  return redis;
}
const REDIS_MANDATORY_CLEAR_KEY = "mandatory-clear-counter";
const preserveKeys = ["TICKETZ_JWT_SECRET", "TICKETZ_JWT_REFRESH_SECRET"];

function encryptParams(params: unknown) {
  const str = JSON.stringify(params);
  return crypto.createHash("sha256").update(str).digest("base64");
}

export function setFromParams(
  key: string,
  params: unknown,
  value: string,
  option?: RedisSetOption,
  optionValue?: number
) {
  const finalKey = `${key}:${encryptParams(params)}`;
  if (option === undefined) {
    return set(finalKey, value);
  }

  if (option === "NX" || option === "XX" || option === "KEEPTTL") {
    return set(finalKey, value, option);
  }

  if (optionValue !== undefined) {
    return set(finalKey, value, option, optionValue);
  }

  throw new Error(`Redis option ${option} requires optionValue`);
}

export function getFromParams(key: string, params: unknown) {
  const finalKey = `${key}:${encryptParams(params)}`;
  return get(finalKey);
}

export function delFromParams(key: string, params: unknown) {
  const finalKey = `${key}:${encryptParams(params)}`;
  return del(finalKey);
}

export function set(
  key: string,
  value: string,
  option?: RedisSetOption,
  optionValue?: number
) {
  const redisClient = getRedisClient();
  if (option === undefined) {
    return redisClient.set(key, value);
  }

  if (option === "NX") {
    return redisClient.set(key, value, "NX");
  }

  if (option === "XX") {
    return redisClient.set(key, value, "XX");
  }

  if (option === "KEEPTTL") {
    return redisClient.set(key, value, "KEEPTTL");
  }

  if (option === "EX") {
    if (optionValue === undefined) {
      throw new Error("Redis option EX requires optionValue");
    }
    return redisClient.set(key, value, "EX", optionValue);
  }

  if (option === "PX") {
    if (optionValue === undefined) {
      throw new Error("Redis option PX requires optionValue");
    }
    return redisClient.set(key, value, "PX", optionValue);
  }

  if (option === "EXAT") {
    if (optionValue === undefined) {
      throw new Error("Redis option EXAT requires optionValue");
    }
    return redisClient.set(key, value, "EXAT", optionValue);
  }

  if (optionValue === undefined) {
    throw new Error("Redis option PXAT requires optionValue");
  }
  return redisClient.set(key, value, "PXAT", optionValue);
}

export function get(key: string) {
  const redisClient = getRedisClient();
  return redisClient.get(key);
}

export function getKeys(pattern: string) {
  const redisClient = getRedisClient();
  return redisClient.keys(pattern);
}

export function del(key: string) {
  const redisClient = getRedisClient();
  return redisClient.del(key);
}

export async function delFromPattern(pattern: string) {
  const all = await getKeys(pattern);
  await Promise.all(all.map(item => del(item)));
}

export async function runMandatoryClearIfNeeded() {
  const currentCounterRaw = await get(REDIS_MANDATORY_CLEAR_KEY);
  const currentCounter = Number(currentCounterRaw || "0");

  if (currentCounter >= REDIS_MANDATORY_CLEAR_COUNTER) {
    return;
  }

  const preservedEntries = await Promise.all(
    preserveKeys.map(async key => {
      const value = await get(key);
      return [key, value] as const;
    })
  );

  const redisClient = getRedisClient();
  await redisClient.flushall();

  await Promise.all(
    preservedEntries
      .filter(([, value]) => Boolean(value))
      .map(([key, value]) => set(key, value as string))
  );

  await set(REDIS_MANDATORY_CLEAR_KEY, String(REDIS_MANDATORY_CLEAR_COUNTER));

  logger.warn(
    `Redis mandatory clear executed (counter ${currentCounter} -> ${REDIS_MANDATORY_CLEAR_COUNTER})`
  );
}

export async function disconnectCache(): Promise<void> {
  if (!redis) {
    return;
  }

  try {
    await redis.quit();
  } catch {
    redis.disconnect();
  } finally {
    redis = null;
  }
}

export const cacheLayer = {
  set,
  setFromParams,
  get,
  getFromParams,
  getKeys,
  del,
  delFromParams,
  delFromPattern,
  runMandatoryClearIfNeeded,
  disconnectCache
};
