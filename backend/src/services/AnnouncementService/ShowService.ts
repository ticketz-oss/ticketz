import Announcement from "../../models/Announcement";
import AppError from "../../errors/AppError";
import { announcementIncludes } from "./targeting";

const ShowService = async (id: string | number): Promise<Announcement> => {
  const record = await Announcement.findByPk(id, {
    include: announcementIncludes
  });

  if (!record) {
    throw new AppError("ERR_NO_ANNOUNCEMENT_FOUND", 404);
  }

  return record;
};

export default ShowService;
