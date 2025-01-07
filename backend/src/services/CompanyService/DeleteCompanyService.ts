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

  await company.destroy();

  const companyMediaPath = join(getPublicPath(), "media", id);

  // recursively remove company media folder
  fs.rmSync(companyMediaPath, { recursive: true });
};

export default DeleteCompanyService;
