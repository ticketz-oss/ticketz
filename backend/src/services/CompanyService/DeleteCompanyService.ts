import fs from "fs";
import { join } from "path";
import Company from "../../models/Company";
import AppError from "../../errors/AppError";
import { getPublicPath } from "../../helpers/GetPublicPath";
import { S3Storage } from "../../helpers/S3Storage";
import { logger } from "../../utils/logger";

const fileStorage = S3Storage.getInstance();

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
  (async () => {
    try {
      if (fs.existsSync(companyMediaPath)) {
        fs.rmSync(companyMediaPath, { recursive: true });
      }
    } catch (error) {
      logger.error(
        { path: companyMediaPath, error },
        `Error on remove company media folder: ${error.message}`
      );
    }
  })();

  await fileStorage.prepare();
  if (fileStorage.storage) {
    fileStorage.storage.deleteDirectory(`media/${id}`).catch(error => {
      logger.error(
        { path: `media/${id}`, error },
        `S3 Error on delete company media folder: ${error.message}`
      );
    });
  }
};

export default DeleteCompanyService;
