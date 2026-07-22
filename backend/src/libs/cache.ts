import Redis from "ioredis";
import { REDIS_URI_CONNECTION } from "../config/redis";
import * as crypto from "crypto";

type RedisSetOption = "EX" | "PX" | "EXAT" | "PXAT" | "NX" | "XX" | "KEEPTTL";

const redis = new Redis(REDIS_URI_CONNECTION);

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
  if (option === undefined) {
    return redis.set(key, value);
  }

  if (option === "NX") {
    return redis.set(key, value, "NX");
  }

  if (option === "XX") {
    return redis.set(key, value, "XX");
  }

  if (option === "KEEPTTL") {
    return redis.set(key, value, "KEEPTTL");
  }

  if (option === "EX") {
    if (optionValue === undefined) {
      throw new Error("Redis option EX requires optionValue");
    }
    return redis.set(key, value, "EX", optionValue);
  }

  if (option === "PX") {
    if (optionValue === undefined) {
      throw new Error("Redis option PX requires optionValue");
    }
    return redis.set(key, value, "PX", optionValue);
  }

  if (option === "EXAT") {
    if (optionValue === undefined) {
      throw new Error("Redis option EXAT requires optionValue");
    }
    return redis.set(key, value, "EXAT", optionValue);
  }

  if (optionValue === undefined) {
    throw new Error("Redis option PXAT requires optionValue");
  }
  return redis.set(key, value, "PXAT", optionValue);
}

export function get(key: string) {
  return redis.get(key);
}

export function getKeys(pattern: string) {
  return redis.keys(pattern);
}

export function del(key: string) {
  return redis.del(key);
}

export async function delFromPattern(pattern: string) {
  const all = await getKeys(pattern);
  await Promise.all(all.map(item => del(item)));
}

export const cacheLayer = {
  set,
  setFromParams,
  get,
  getFromParams,
  getKeys,
  del,
  delFromParams,
  delFromPattern
};
