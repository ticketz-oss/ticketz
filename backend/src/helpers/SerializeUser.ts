import Queue from "../models/Queue";
import Company from "../models/Company";
import User from "../models/User";

interface SerializedUser {
  id: number;
  name: string;
  email: string;
  profilePicUrl: string | null;
  profile: string;
  visibleScreens: string[] | null;
  companyId: number;
  company: Company | null;
  super: boolean;
  queues: Queue[];
}

export const SerializeUser = async (user: User): Promise<SerializedUser> => {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    profilePicUrl: user.profilePicUrl,
    profile: user.profile,
    visibleScreens: user.visibleScreens,
    companyId: user.companyId,
    company: user.company,
    super: user.super,
    queues: user.queues
  };
};
