import AppError from "../../errors/AppError";
import CommemorativeDate from "../../models/CommemorativeDate";
import Contact from "../../models/Contact";
import Schedule from "../../models/Schedule";
import ScheduleAudienceContact from "../../models/ScheduleAudienceContact";
import User from "../../models/User";

const ShowService = async (
  id: string | number,
  companyId: number
): Promise<Schedule> => {
  const schedule = await Schedule.findOne({
    where: { id, companyId },
    include: [
      { model: Contact, as: "contact", attributes: ["id", "name"] },
      { model: User, as: "user", attributes: ["id", "name"] },
      { model: CommemorativeDate, as: "commemorativeDate" },
      {
        model: ScheduleAudienceContact,
        as: "audienceContacts",
        include: [
          {
            model: Contact,
            as: "contact",
            attributes: ["id", "name", "number"]
          }
        ]
      }
    ]
  });
  if (!schedule) throw new AppError("ERR_NO_SCHEDULE_FOUND", 404);
  return schedule;
};

export default ShowService;
