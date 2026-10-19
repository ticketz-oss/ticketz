import Redis from "ioredis";
import { REDIS_URI_CONNECTION } from "../config/redis";
import util from "util";
import * as crypto from "crypto";

const redis = new Redis(REDIS_URI_CONNECTION);

function encryptParams(params: any) {
  const str = JSON.stringify(params);
  return crypto.createHash("sha256").update(str).digest("base64");
}

export function setFromParams(
  key: string,
  params: any,
  value: string,
  option?: string,
  optionValue?: string | number
) {
  const finalKey = `${key}:${encryptParams(params)}`;
  if (option !== undefined && optionValue !== undefined) {
    return set(finalKey, value, option, optionValue);
  }
  return set(finalKey, value);
}

export function getFromParams(key: string, params: any) {
  const finalKey = `${key}:${encryptParams(params)}`;
  return get(finalKey);
}

export function delFromParams(key: string, params: any) {
  const finalKey = `${key}:${encryptParams(params)}`;
  return del(finalKey);
}

export function set(
  key: string,
  value: string,
  option?: string,
  optionValue?: string | number
) {
  const setPromisefy = util.promisify(redis.set).bind(redis);
  if (option !== undefined && optionValue !== undefined) {
    return setPromisefy(key, value, option, optionValue);
  }

  return setPromisefy(key, value);
}

export function get(key: string) {
  const getPromisefy = util.promisify(redis.get).bind(redis);
  return getPromisefy(key);
}

export function getKeys(pattern: string) {
  const getKeysPromisefy = util.promisify(redis.keys).bind(redis);
  return getKeysPromisefy(pattern);
}

export function del(key: string) {
  const delPromisefy = util.promisify(redis.del).bind(redis);
  return delPromisefy(key);
}

export async function consume(key: string): Promise<string | null> {
  return redis.eval(
    "local value = redis.call('GET', KEYS[1]); if value then redis.call('DEL', KEYS[1]); end; return value",
    1,
    key
  ) as Promise<string | null>;
}

// A wrong PKCE verifier must not burn the code. After verification/revalidation,
// compare and delete the exact record atomically so concurrent exchanges cannot
// both succeed. The raw code and verifier are never stored in Redis.
export async function consumeIfMatch(
  key: string,
  expected: string
): Promise<boolean> {
  const result = await redis.eval(
    "local value = redis.call('GET', KEYS[1]); if value and value == ARGV[1] then redis.call('DEL', KEYS[1]); return 1; end; return 0",
    1,
    key,
    expected
  );
  return result === 1;
}

export async function delFromPattern(pattern: string) {
  const all = await getKeys(pattern);
  for (let item of all) {
    del(item);
  }
}

export const cacheLayer = {
  set,
  setFromParams,
  get,
  getFromParams,
  getKeys,
  del,
  consume,
  consumeIfMatch,
  delFromParams,
  delFromPattern
};
