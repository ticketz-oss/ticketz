import { Op } from "sequelize";
import sequelize from "../database";
import Company from "../models/Company";
import Invoices from "../models/Invoices";
import Partner from "../models/Partner";
import PartnerPayout from "../models/PartnerPayout";

const main = async (): Promise<void> => {
  const [partners, partnerPayouts, companies] = await Promise.all([
    Partner.findAll({ order: [["id", "ASC"]] }),
    PartnerPayout.findAll({ order: [["id", "ASC"]] }),
    Company.findAll({
      where: { partnerId: { [Op.not]: null } },
      attributes: [
        "id",
        "name",
        "slug",
        "planId",
        "saleValue",
        "introValue",
        "introMonths",
        "platformCost",
        "partnerId",
        "dueDate",
        "recurrence",
        "createdAt"
      ],
      order: [["id", "ASC"]]
    })
  ]);

  const companyIds = companies.map(company => company.id);
  const invoices = companyIds.length
    ? await Invoices.findAll({
        where: { companyId: { [Op.in]: companyIds } },
        order: [["id", "ASC"]]
      })
    : [];
  const invoicesByCompany = invoices.reduce<Record<number, object[]>>(
    (result, invoice) => {
      result[invoice.companyId] ||= [];
      result[invoice.companyId].push(invoice.toJSON());
      return result;
    },
    {}
  );

  const payload = {
    exported_at: new Date().toISOString(),
    source: "espaco-whats",
    partners: partners.map(item => item.toJSON()),
    partner_payouts: partnerPayouts.map(item => item.toJSON()),
    tenants: companies.map(company => ({
      tenant_id: String(company.id),
      ...company.toJSON(),
      invoices: invoicesByCompany[company.id] || []
    }))
  };

  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
};

main()
  .catch(error => {
    process.stderr.write(`${error?.stack || error}\n`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sequelize.close();
  });
