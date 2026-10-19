import * as Yup from "yup";
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
  priority: number;
  title: string;
  text: string;
  status: boolean;
  companyId: number;
  isGlobal?: boolean;
  startsAt?: string;
  endsAt?: string;
  mediaPath?: string;
  mediaName?: string;
}

const CreateService = async (data: Data): Promise<Announcement> => {
  const { title, text, companyId } = data;

  const announcementSchema = Yup.object().shape({
    title: Yup.string().required("ERR_ANNOUNCEMENT_REQUIRED"),
    text: Yup.string().required("ERR_ANNOUNCEMENT_REQUIRED")
  });

  try {
    await announcementSchema.validate({ title, text });
  } catch (err: any) {
    throw new AppError(err.message);
  }

  const targeting = await validateTargeting(data, companyId);
  const window = parseWindow(data.startsAt, data.endsAt);

  const record = await Announcement.create({
    priority: data.priority,
    title: data.title,
    text: data.text,
    status: data.status,
    companyId,
    isGlobal: !!data.isGlobal,
    mediaPath: data.mediaPath,
    mediaName: data.mediaName,
    audienceMode: targeting.audienceMode,
    profiles: targeting.profiles,
    ...window
  } as any);

  await syncTargeting(record, targeting);

  return ShowService(record.id);
};

export default CreateService;
