import AppError from "../../errors/AppError";
import Announcement from "../../models/Announcement";
import ShowService from "./ShowService";
import {
  TargetingData,
  parseWindow,
  syncTargeting,
  validateTargeting
} from "./targeting";

interface Data extends TargetingData {
  id: number;
  priority: number;
  title: string;
  text: string;
  status: boolean;
  companyId: number;
  isGlobal?: boolean;
  startsAt?: string;
  endsAt?: string;
}

const UpdateService = async (data: Data): Promise<Announcement> => {
  const { id } = data;

  const record = await Announcement.findByPk(id);

  if (!record) {
    throw new AppError("ERR_NO_ANNOUNCEMENT_FOUND", 404);
  }

  const targeting = await validateTargeting(data, record.companyId);
  const window = parseWindow(data.startsAt, data.endsAt);

  await record.update({
    priority: data.priority,
    title: data.title,
    text: data.text,
    status: data.status,
    isGlobal: data.isGlobal === undefined ? record.isGlobal : !!data.isGlobal,
    audienceMode: targeting.audienceMode,
    profiles: targeting.profiles,
    ...window
  });

  await syncTargeting(record, targeting);

  return ShowService(record.id);
};

export default UpdateService;
