import GetDefaultWhatsApp from "../../helpers/GetDefaultWhatsApp";
import { cacheLayer } from "../../libs/cache";
import { getWbot } from "../../libs/wbot";

const GetProfilePicUrl = async (
  number: string,
  companyId: number
): Promise<string> => {
  const defaultWhatsapp = await GetDefaultWhatsApp(companyId);

  const wbot = getWbot(defaultWhatsapp.id);

  let profilePicUrl: string;
  const redisKey = `profilePicUrl:${number}`;
  try {
    profilePicUrl = await cacheLayer.get(redisKey);
    if (profilePicUrl) {
      return profilePicUrl;
    }

    profilePicUrl = await wbot.profilePictureUrl(`${number}`, "image", 300);
    await cacheLayer.set(redisKey, profilePicUrl, "EX", 60 * 60 * 24);
  } catch (error) {
    profilePicUrl = `${process.env.FRONTEND_URL}/nopicture.png`;
  }

  return profilePicUrl;
};

export default GetProfilePicUrl;
