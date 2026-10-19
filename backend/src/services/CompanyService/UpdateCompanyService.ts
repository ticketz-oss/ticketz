import { assertCompanyWhatsAppModeUnchanged } from "./CompanyWhatsAppModeService";
import { Op, Transaction } from "sequelize";
import AppError from "../../errors/AppError";
import Company from "../../models/Company";
import Invoices from "../../models/Invoices";
import Setting from "../../models/Setting";
import normalizeSlug from "../../helpers/normalizeSlug";
import { revokeCompanyMcpGrants } from "../McpServices/RevokeMcpGrantsService";
import { assertVoiceCompanyAllowlisted } from "../VoiceServices/VoiceAccessService";
import { disableCompanyVoiceConnections } from "../VoiceServices/VoiceService";
import moment from "moment";
import {
  assertDueDay,
  assertTrialDays
} from "../BillingServices/BillingConfigService";
import {
  firstBillableDueDate,
  resolveTrialEndsAt
} from "../BillingServices/BillingDateService";
import { assertCompanyTimezone } from "./CompanyTimezoneService";

interface CompanyData {
  whatsappMode?: "normal" | "meta";
  name: string;
  id?: number | string;
  phone?: string;
  email?: string;
  status?: boolean;
  planId?: number;
  campaignsEnabled?: boolean;
  voiceCallsEnabled?: boolean;
  dueDate?: string | null;
  trialDays?: number;
  dueDay?: number;
  recurrence?: string;
  language?: string;
  timezone?: string | null;
  slug?: string;
  partnerId?: number | null;
  saleValue?: number | null;
  introValue?: number | null;
  introMonths?: number | null;
  platformCost?: number | null;
}

const UpdateCompanyService = async (
  companyData: CompanyData,
  options: { transaction?: Transaction; billingCentralized?: boolean } = {}
): Promise<Company> => {
  const { transaction } = options;
  const company = await Company.findByPk(companyData.id, { transaction });
  const {
    name,
    phone,
    email,
    status,
    planId,
    campaignsEnabled,
    dueDate,
    recurrence,
    language
  } = companyData;

  if (!company) {
    throw new AppError("ERR_NO_COMPANY_FOUND", 404);
  }

  assertCompanyWhatsAppModeUnchanged(
    company.whatsappMode,
    companyData.whatsappMode
  );

  const previousPlanId = company.planId;
  const wasActive = company.status;
  const previousDueDate = company.dueDate;
  const previousSaleValue = company.saleValue;
  const previousIntroValue = company.introValue;
  const previousIntroMonths = company.introMonths;

  const hasPartnerId = companyData.partnerId !== undefined;
  const hasSaleValue = companyData.saleValue !== undefined;
  const hasIntroValue = companyData.introValue !== undefined;
  const hasIntroMonths = companyData.introMonths !== undefined;
  const hasPlatformCost = companyData.platformCost !== undefined;
  const hasTrialDays = companyData.trialDays !== undefined;
  const hasDueDay = companyData.dueDay !== undefined;
  const trialDays = hasTrialDays
    ? assertTrialDays(companyData.trialDays)
    : company.trialDays;
  let dueDay = hasDueDay ? assertDueDay(companyData.dueDay) : company.dueDay;
  if (
    dueDate !== undefined &&
    dueDate !== null &&
    dueDate !== company.dueDate
  ) {
    dueDay = assertDueDay(moment.utc(dueDate).date());
  }
  let trialEndsAt = company.trialEndsAt;
  let nextDueDate = dueDate;
  if (hasTrialDays && trialDays !== company.trialDays) {
    const billed = await Invoices.count({
      where:
        company.trialEndsAt === null
          ? { companyId: company.id }
          : { companyId: company.id, billingType: "initial_prorata" },
      transaction
    });
    if (billed > 0) throw new AppError("ERR_TRIAL_ALREADY_STARTED", 409);
    trialEndsAt = resolveTrialEndsAt(
      moment.utc().format("YYYY-MM-DD"),
      trialDays
    );
    // The first (prorated) invoice is due on the last trial day.
    nextDueDate = trialEndsAt;
  } else if (
    hasDueDay &&
    trialEndsAt &&
    (dueDate === undefined || dueDate === company.dueDate)
  ) {
    const initialIssued = await Invoices.count({
      where: { companyId: company.id, billingType: "initial_prorata" },
      transaction
    });
    // New companies keep the first charge on the last trial day, whatever the
    // due day; companies created before that rule had it on the due day.
    const chargedAtTrialEnd =
      moment.utc(company.dueDate).format("YYYY-MM-DD") === trialEndsAt;
    if (initialIssued === 0 && !chargedAtTrialEnd)
      nextDueDate = firstBillableDueDate(trialEndsAt, dueDay);
  }

  const hasSlug = companyData.slug !== undefined;
  const slug = hasSlug ? normalizeSlug(companyData.slug) : undefined;
  const hasTimezone = companyData.timezone !== undefined;
  const timezone = hasTimezone
    ? assertCompanyTimezone(companyData.timezone)
    : undefined;

  if (slug) {
    const companyWithSameSlug = await Company.findOne({
      where: { slug, id: { [Op.ne]: company.id } },
      transaction
    });

    if (companyWithSameSlug) {
      throw new AppError("ERR_COMPANY_SLUG_ALREADY_EXISTS");
    }
  }

  const dueDateChanged =
    dueDate !== undefined && dueDate !== null && dueDate !== previousDueDate;

  // Uma cobrança já emitida no gateway não pode ter seu ciclo movido por
  // baixo dos panos: o valor/data no provedor continuariam antigos e a cron
  // criaria outra fatura. A Central precisa excluir a cobrança primeiro.
  if (options.billingCentralized && dueDateChanged) {
    const chargedOpenInvoice = await Invoices.findOne({
      where: {
        companyId: company.id,
        status: "open",
        origem: "sistema",
        externalRef: null,
        dueDate: { [Op.ne]: dueDate },
        txId: { [Op.not]: null, [Op.ne]: "" }
      },
      transaction
    });
    if (chargedOpenInvoice) {
      throw new AppError("ERR_ACTIVE_CHARGE_PREVENTS_DUE_DATE_CHANGE", 409);
    }
  }

  await company.update(
    {
      name,
      phone,
      email,
      status,
      planId,
      dueDate: nextDueDate,
      ...(hasTrialDays ? { trialDays, trialEndsAt } : {}),
      ...(hasDueDay || dueDate !== undefined ? { dueDay } : {}),
      recurrence,
      language,
      ...(hasTimezone ? { timezone } : {}),
      ...(hasSlug ? { slug: slug || null } : {}),
      ...(hasPartnerId ? { partnerId: companyData.partnerId || null } : {}),
      ...(hasSaleValue ? { saleValue: companyData.saleValue ?? null } : {}),
      ...(hasIntroValue ? { introValue: companyData.introValue ?? null } : {}),
      ...(hasIntroMonths
        ? { introMonths: companyData.introMonths ?? null }
        : {}),
      ...(hasPlatformCost
        ? { platformCost: companyData.platformCost ?? null }
        : {})
    },
    { transaction }
  );

  if (
    (wasActive !== false && status === false) ||
    (dueDate !== undefined && dueDate !== previousDueDate)
  ) {
    if (!transaction) {
      await revokeCompanyMcpGrants(company.id);
    }
  }

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
      },
      transaction
    });
    if (!created) {
      await setting.update({ value: `${campaignsEnabled}` }, { transaction });
    }
  }

  if (companyData.voiceCallsEnabled !== undefined) {
    if (companyData.voiceCallsEnabled) {
      assertVoiceCompanyAllowlisted(company.id);
    }
    const [setting, created] = await Setting.findOrCreate({
      where: {
        companyId: company.id,
        key: "voiceCallsEnabled"
      },
      defaults: {
        companyId: company.id,
        key: "voiceCallsEnabled",
        value: `${companyData.voiceCallsEnabled}`
      },
      transaction
    });
    if (!created) {
      await setting.update(
        { value: `${companyData.voiceCallsEnabled}` },
        { transaction }
      );
    }
    if (!companyData.voiceCallsEnabled) {
      if (transaction) {
        transaction.afterCommit(() =>
          disableCompanyVoiceConnections(company.id)
        );
      } else {
        await disableCompanyVoiceConnections(company.id);
      }
    }
  }

  const shouldRebuildInvoice = options.billingCentralized
    ? dueDateChanged
    : !!dueDate && new Date(dueDate) > new Date();

  if (shouldRebuildInvoice) {
    await Invoices.destroy({
      where: {
        companyId: company.id,
        status: "open",
        billingType: "regular",
        ...(options.billingCentralized
          ? {}
          : { dueDate: { [Op.lte]: dueDate } }),
        origem: "sistema",
        externalRef: null,
        [Op.or]: [{ txId: null }, { txId: "" }]
      },
      transaction
    });
  }

  // Sem isso a mudanca de preco so valeria no ciclo seguinte: a fatura em
  // aberto ja teria nascido com o valor antigo. Vale para os tres campos que
  // determinam o preco do ciclo — mensalidade, valor do periodo inicial e
  // duracao dele —, senao um periodo inicial recem-definido nasceria atrasado.
  const priceChanged =
    (hasSaleValue && (companyData.saleValue ?? null) !== previousSaleValue) ||
    (hasIntroValue &&
      (companyData.introValue ?? null) !== previousIntroValue) ||
    (hasIntroMonths &&
      (companyData.introMonths ?? null) !== previousIntroMonths);

  if (priceChanged) {
    await Invoices.destroy({
      where: {
        companyId: company.id,
        status: "open",
        billingType: "regular",
        origem: "sistema",
        externalRef: null,
        [Op.or]: [{ txId: null }, { txId: "" }]
      },
      transaction
    });
  }

  if (planId && previousPlanId !== planId) {
    await Invoices.destroy({
      where: {
        companyId: company.id,
        status: "open",
        billingType: "regular",
        origem: "sistema",
        externalRef: null,
        [Op.or]: [{ txId: null }, { txId: "" }]
      },
      transaction
    });
  }

  return company;
};

export default UpdateCompanyService;
