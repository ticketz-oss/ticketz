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

  // recursively remove company media folder if it exists
  try {
    if (fs.existsSync(companyMediaPath)) {
      fs.rmSync(companyMediaPath, { recursive: true });
    }
  } catch (error) {
    // Log the error but don't fail the company deletion
    console.warn(`Warning: Failed to remove company media folder ${companyMediaPath}:`, error);
  }
};

export default DeleteCompanyService;
