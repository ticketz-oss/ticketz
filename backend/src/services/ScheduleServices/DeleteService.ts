import Schedule from "../../models/Schedule";
import AppError from "../../errors/AppError";
import fs from "fs";
import path from "path";

const DeleteService = async (
  id: string | number,
  companyId: number
): Promise<void> => {
  const schedule = await Schedule.findOne({
    where: { id, companyId }
  });

  if (!schedule) {
    throw new AppError("ERR_NO_SCHEDULE_FOUND", 404);
  }

  const mediaPath = schedule.mediaPath;
  await schedule.destroy();
  if (mediaPath) {
    const fullPath = path.resolve("public", mediaPath);
    if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
  }
};

export default DeleteService;
