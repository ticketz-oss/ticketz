import fs from "fs";
import { join } from "path";
import Company from "../../models/Company";
import AppError from "../../errors/AppError";
import { getPublicPath } from "../../helpers/GetPublicPath";

const DeleteCompanyService = async (id: string): Promise<void> => {
  const company = await Company.findOne({
    where: { id }
  });

  if (!company) {
    throw new AppError("ERR_NO_COMPANY_FOUND", 404);
  }

  const companyMediaPath = join(getPublicPath(), "media", id);

  // A tenant may not have uploaded any media yet. In that case the directory
  // does not exist and deletion must remain successful. Remove media before
  // the database row so a genuine filesystem failure remains retryable.
  fs.rmSync(companyMediaPath, { recursive: true, force: true });

  await company.destroy();
};

export default DeleteCompanyService;
