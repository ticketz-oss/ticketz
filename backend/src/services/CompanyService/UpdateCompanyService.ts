import AppError from "../../errors/AppError";
import Company from "../../models/Company";
import Setting from "../../models/Setting";
import Plan from "../../models/Plan";

interface CompanyData {
  name: string;
  id?: number | string;
  phone?: string;
  email?: string;
  status?: boolean;
  planId?: number;
  campaignsEnabled?: boolean;
  downloadLimit?: number;
  dueDate?: string;
  recurrence?: string;
}

const UpdateCompanyService = async (
  companyData: CompanyData
): Promise<Company> => {
  const company = await Company.findByPk(companyData.id);
  const {
    name,
    phone,
    email,
    status,
    planId,
    campaignsEnabled,
    downloadLimit,
    dueDate,
    recurrence
  } = companyData;

  if (!company) {
    throw new AppError("ERR_NO_COMPANY_FOUND", 404);
  }

  await company.update({
    name,
    phone,
    email,
    status,
    planId,
    downloadLimit,
    dueDate,
    recurrence
  });

  // Se campanhas foram especificadas manualmente, usar essa configuração
  if (companyData.campaignsEnabled !== undefined) {
    const [setting, created] = await Setting.findOrCreate({
      where: {
        companyId: company.id,
        key: "campaignsEnabled"
      },
      defaults: {
        companyId: company.id,
        key: "campaignsEnabled",
        value: `${campaignsEnabled}`
      }
    });
    if (!created) {
      await setting.update({ value: `${campaignsEnabled}` });
    }
  }
  
  // Se downloadLimit foi especificado manualmente, usar essa configuração
  if (companyData.downloadLimit !== undefined) {
    const [downloadSetting, downloadCreated] = await Setting.findOrCreate({
      where: {
        companyId: company.id,
        key: "downloadLimit"
      },
      defaults: {
        companyId: company.id,
        key: "downloadLimit",
        value: `${downloadLimit}`
      }
    });
    if (!downloadCreated) {
      await downloadSetting.update({ value: `${downloadLimit}` });
    }
    console.log(`🔧 [MANUAL] Limite de download atualizado manualmente para empresa ${company.name}: ${downloadLimit}MB`);
  }
  
  // Se o planId foi alterado, configurar campanhas baseado no plano
  if (planId && planId !== company.planId) {
    const plan = await Plan.findByPk(planId);
    if (plan) {
      // Só atualizar campanhas se não foi especificado manualmente
      if (companyData.campaignsEnabled === undefined) {
        const [setting, created] = await Setting.findOrCreate({
          where: {
            companyId: company.id,
            key: "campaignsEnabled"
          },
          defaults: {
            companyId: company.id,
            key: "campaignsEnabled",
            value: `${plan.campaignsEnabled}`
          }
        });
        if (!created) {
          await setting.update({ value: `${plan.campaignsEnabled}` });
        }
      }

      // Só atualizar downloadLimit se não foi especificado manualmente
      if (companyData.downloadLimit === undefined) {
        const [downloadSetting, downloadCreated] = await Setting.findOrCreate({
          where: {
            companyId: company.id,
            key: "downloadLimit"
          },
          defaults: {
            companyId: company.id,
            key: "downloadLimit",
            value: `${plan.downloadLimitMB}`
          }
        });
        if (!downloadCreated) {
          await downloadSetting.update({ value: `${plan.downloadLimitMB}` });
        }
        console.log(`🔧 [PLANO] Limite de download atualizado pelo plano para empresa ${company.name}: ${plan.downloadLimitMB}MB (plano: ${plan.name})`);
      }
    }
  }

  return company;
};

export default UpdateCompanyService;
