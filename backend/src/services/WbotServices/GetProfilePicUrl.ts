import { cacheLayer } from "../../libs/cache";
import { Session } from "../../libs/wbot";

const GetProfilePicUrl = async (
  number: string,
  type: "preview" | "image",
  wbot: Session
): Promise<string> => {
  const redisKey = `picurl_${type}:${number}`;
  const noPicture = `${process.env.FRONTEND_URL}/nopicture.png`;

  const profilePicUrl = await cacheLayer.get(redisKey);
  if (profilePicUrl) {
    return profilePicUrl;
  }

  try {
    const url = await wbot.profilePictureUrl(`${number}`, type);

    await cacheLayer.set(redisKey, url, "EX", 60 * 60 * 24 * 4);
    
    return url;
  } catch (error) {

    await cacheLayer.set(redisKey, noPicture, "EX", 60 * 60 * 24 * 1);
    
    return noPicture;
  }
};

export default GetProfilePicUrl;
