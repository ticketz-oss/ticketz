import { cacheLayer } from "../../libs/cache";
import type { Session } from "../../libs/wbot";

export const profilePictureCacheKey = (
  number: string,
  type: string,
  wbot: Pick<Session, "id">
) => `picurl:v2:${wbot.id}:${type}:${number}`;

export const invalidateProfilePicture = async (
  number: string,
  wbot: Pick<Session, "id">
) => {
  await Promise.all(
    ["preview", "image"].map(type =>
      cacheLayer.del(profilePictureCacheKey(number, type, wbot))
    )
  );
};

const GetProfilePicUrl = async (
  number: string,
  type: "preview" | "image",
  wbot: Pick<Session, "id" | "profilePictureUrl">
): Promise<string | void> => {
  const redisKey = profilePictureCacheKey(number, type, wbot);

  const profilePicUrl = await cacheLayer.get(redisKey);
  if (profilePicUrl) {
    return profilePicUrl;
  }

  const pic = await wbot.profilePictureUrl(number, type, 5000);
  if (pic) {
    // Cache only the URL, never image bytes. Signed CDN URLs can expire early.
    let ttl = 60 * 60;
    try {
      const expires = parseInt(new URL(pic).searchParams.get("oe") || "", 16);
      if (Number.isFinite(expires))
        ttl = Math.min(ttl, expires - Math.floor(Date.now() / 1000) - 60);
    } catch {
      /* Non-CDN URLs use the conservative default TTL. */
    }
    if (ttl > 0) await cacheLayer.set(redisKey, pic, "EX", ttl);
  }
  return pic;
};

export default GetProfilePicUrl;
