import { Op } from "sequelize";
import AppError from "../../errors/AppError";
import { getIO } from "../../libs/socket";
import Company from "../../models/Company";
import { cancelPendingForCompany } from "./StatusPostService";

const PAGE_SIZE = 20;

export type CompanyStatusFlag = {
  id: number;
  name: string;
  whatsappMode: "normal" | "meta";
  whatsappStatusEnabled: boolean;
};

export const isStatusEnabled = async (companyId: number): Promise<boolean> => {
  if (!companyId) return false;
  const company = await Company.findByPk(companyId, {
    attributes: ["id", "whatsappStatusEnabled"]
  });
  return company?.whatsappStatusEnabled === true;
};

export const setStatusEnabled = async (
  companyId: number,
  enabled: boolean
): Promise<{ id: number; name: string; whatsappStatusEnabled: boolean }> => {
  const company = await Company.findByPk(companyId);
  if (!company) {
    throw new AppError("ERR_COMPANY_NOT_FOUND", 404);
  }

  await company.update({ whatsappStatusEnabled: enabled });

  if (!enabled) {
    // Scheduled posts must never go out after a super admin turns the
    // feature off for this tenant.
    await cancelPendingForCompany(company.id);
  }

  getIO()
    .to(`company-${company.id}-mainchannel`)
    .emit(`company-${company.id}-whatsapp-status-availability`, { enabled });

  return {
    id: company.id,
    name: company.name,
    whatsappStatusEnabled: company.whatsappStatusEnabled === true
  };
};

export const listCompaniesWithStatusFlag = async ({
  searchParam = "",
  pageNumber = 1
}: {
  searchParam?: string;
  pageNumber?: number;
}): Promise<{ companies: CompanyStatusFlag[]; hasMore: boolean }> => {
  const page =
    Number.isSafeInteger(pageNumber) && pageNumber > 0 ? pageNumber : 1;
  const offset = (page - 1) * PAGE_SIZE;
  const search =
    typeof searchParam === "string" ? searchParam.trim().slice(0, 100) : "";

  const { rows, count } = await Company.findAndCountAll({
    attributes: ["id", "name", "whatsappMode", "whatsappStatusEnabled"],
    where: search
      ? { name: { [Op.iLike]: `%${search.replace(/[\\%_]/g, "\\$&")}%` } }
      : {},
    order: [
      ["name", "ASC"],
      ["id", "ASC"]
    ],
    limit: PAGE_SIZE,
    offset
  });

  return {
    companies: rows.map(row => {
      const { id, name, whatsappMode, whatsappStatusEnabled } = row.get({
        plain: true
      }) as CompanyStatusFlag;
      return {
        id,
        name,
        whatsappMode,
        whatsappStatusEnabled: whatsappStatusEnabled === true
      };
    }),
    hasMore: offset + rows.length < count
  };
};
