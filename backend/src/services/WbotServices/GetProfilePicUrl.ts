import { cacheLayer } from "../../libs/cache";
import { Session } from "../../libs/wbot";

const GetProfilePicUrl = async (
  number: string,
  type: "preview" | "image",
  wbot: Session
): Promise<string | void> => {
  const redisKey = `picurl_${type}:${number}`;

  const profilePicUrl = await cacheLayer.get(redisKey);
  if (profilePicUrl) {
    return profilePicUrl;
  }

  return wbot.profilePictureUrl(`${number}`, type).then(pic => {
    cacheLayer.set(redisKey, pic, "EX", 60 * 60 * 24 * 5);
  });
};

export default GetProfilePicUrl;
