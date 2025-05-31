import * as Yup from "yup";
import AppError from "../../errors/AppError";
import Company from "../../models/Company";
import User from "../../models/User";
import Setting from "../../models/Setting";
import Plan from "../../models/Plan";

interface CompanyData {
  name: string;
  phone?: string;
  email?: string;
  password?: string;
  status?: boolean;
  planId?: number;
  campaignsEnabled?: boolean;
  downloadLimit?: number;
  dueDate?: string;
  recurrence?: string;
}

const CreateCompanyService = async (
  companyData: CompanyData
): Promise<Company> => {
  const {
    name,
    phone,
    email,
    status,
    planId,
    password,
    campaignsEnabled,
    downloadLimit,
    dueDate,
    recurrence
  } = companyData;

  const companySchema = Yup.object().shape({
    name: Yup.string()
      .min(2, "ERR_COMPANY_INVALID_NAME")
      .required("ERR_COMPANY_INVALID_NAME")
      .test(
        "Check-unique-name",
        "ERR_COMPANY_NAME_ALREADY_EXISTS",
        async value => {
          if (value) {
            const companyWithSameName = await Company.findOne({
              where: { name: value }
            });

            return !companyWithSameName;
          }
          return false;
        }
      )
  });

  try {
    await companySchema.validate({ name });
  } catch (err: any) {
    throw new AppError(err.message);
  }

  const company = await Company.create({
    name,
    phone,
    email,
    status,
    planId,
    downloadLimit,
    dueDate,
    recurrence
  });
  const [user, created] = await User.findOrCreate({
    where: { name, email },
    defaults: {
      name: name,
      email: email,
      password: password || "mudar123",
      profile: "admin",
      companyId: company.id
    }
  });

  if (!created) {
    await user.update({ companyId: company.id });
  }

  await Setting.findOrCreate({
    where: {
      companyId: company.id,
      key: "asaas"
    },
    defaults: {
      companyId: company.id,
      key: "asaas",
      value: ""
    },
  });

  //tokenixc
  await Setting.findOrCreate({
    where: {
      companyId: company.id,
      key: "tokenixc"
    },
    defaults: {
      companyId: company.id,
      key: "tokenixc",
      value: ""
    },
  });

  //ipixc
  await Setting.findOrCreate({
    where: {
      companyId: company.id,
      key: "ipixc"
    },
    defaults: {
      companyId: company.id,
      key: "ipixc",
      value: ""
    },
  });

  //ipmkauth
  await Setting.findOrCreate({
    where: {
      companyId: company.id,
      key: "ipmkauth"
    },
    defaults: {
      companyId: company.id,
      key: "ipmkauth",
      value: ""
    },
  });

  //clientsecretmkauth
  await Setting.findOrCreate({
    where: {
      companyId: company.id,
      key: "clientsecretmkauth"
    },
    defaults: {
      companyId: company.id,
      key: "clientsecretmkauth",
      value: ""
    },
  });

  //clientidmkauth
  await Setting.findOrCreate({
    where: {
      companyId: company.id,
      key: "clientidmkauth"
    },
    defaults: {
      companyId: company.id,
      key: "clientidmkauth",
      value: ""
    },
  });

  //CheckMsgIsGroup
  await Setting.findOrCreate({
    where: {
      companyId: company.id,
      key: "CheckMsgIsGroup"
    },
    defaults: {
      companyId: company.id,
      key: "enabled",
      value: ""
    },
  });

  //CheckMsgIsGroup
  await Setting.findOrCreate({
    where: {
      companyId: company.id,
      key: ""
    },
    defaults: {
      companyId: company.id,
      key: "call",
      value: "disabled"
    },
  });

  //scheduleType
  await Setting.findOrCreate({
    where: {
      companyId: company.id,
      key: "scheduleType"
    },
    defaults: {
      companyId: company.id,
      key: "scheduleType",
      value: "disabled"
    },
  });

  //userRating
  await Setting.findOrCreate({
    where: {
      companyId: company.id,
      key: "userRating"
    },
    defaults: {
      companyId: company.id,
      key: "userRating",
      value: "disabled"
    },
  });

  //userRating
  await Setting.findOrCreate({
    where: {
      companyId: company.id,
      key: "chatBotType"
    },
    defaults: {
      companyId: company.id,
      key: "chatBotType",
      value: "text"
    },
  });

  // Configurar campanhas baseado no plano (prioridade 1)
  if (planId) {
    const plan = await Plan.findByPk(planId);
    if (plan) {
      console.log(`🔧 [BUG FIX] Aplicando configuração do plano ${plan.name}: campaignsEnabled = ${plan.campaignsEnabled}`);
      await Setting.findOrCreate({
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

      // Configurar limite de download baseado no plano
      console.log(`🔧 [BUG FIX] Aplicando limite de download do plano ${plan.name}: downloadLimitMB = ${plan.downloadLimitMB}MB`);
      await Setting.findOrCreate({
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
    }
  } else if (companyData.campaignsEnabled !== undefined) {
    // Se não há plano especificado, usar configuração manual (prioridade 2)
    console.log(`🔧 [BUG FIX] Usando configuração manual: campaignsEnabled = ${campaignsEnabled}`);
    const [setting, created] = await Setting.findOrCreate({
      where: {
        companyId: company.id,
        key: "campaignsEnabled"
      },
      defaults: {
        companyId: company.id,
        key: "campaignsEnabled",
        value: `${campaignsEnabled}`
      },
    });
    if (!created) {
      await setting.update({ value: `${campaignsEnabled}` });
    }
  }

  // Se não há plano especificado, usar limite padrão de download
  if (!planId) {
    await Setting.findOrCreate({
      where: {
        companyId: company.id,
        key: "downloadLimit"
      },
      defaults: {
        companyId: company.id,
        key: "downloadLimit",
        value: "15"
      }
    });
  }

  return company;
};

export default CreateCompanyService;
