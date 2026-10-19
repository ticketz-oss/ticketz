import * as Yup from "yup";
import { Request, Response } from "express";
import axios from "axios";
import moment from "moment";
import AppError from "../errors/AppError";
import Company from "../models/Company";

import ListCompaniesService from "../services/CompanyService/ListCompaniesService";
import CreateCompanyService from "../services/CompanyService/CreateCompanyService";
import UpdateCompanyService from "../services/CompanyService/UpdateCompanyService";
import ShowCompanyService from "../services/CompanyService/ShowCompanyService";
import UpdateSchedulesService from "../services/CompanyService/UpdateSchedulesService";
import DeleteCompanyService from "../services/CompanyService/DeleteCompanyService";
import FindAllCompaniesService from "../services/CompanyService/FindAllCompaniesService";
import CreateSelfServiceCompanyService from "../services/CompanyService/CreateSelfServiceCompanyService";
import { SignupFiles } from "../services/CompanyService/SignupBrandingService";
import { companyTrial } from "../helpers/companyTrial";
import User from "../models/User";

import isSignupAllowed from "../services/CompanyService/SignupGateService";
import { OpenHoursData } from "../helpers/checkOpenHours";
import { normalizeCompanyTimezone } from "../services/CompanyService/CompanyTimezoneService";
import {
  hasCentralizedBillingFields,
  isBillingConsoleCompany
} from "../helpers/billingConsole";

type IndexQuery = {
  searchParam: string;
  pageNumber: string;
};

type CompanyData = {
  whatsappMode?: "normal" | "meta";
  name: string;
  id?: number;
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
  timezone?: string | null;
  slug?: string;
  partnerId?: number | null;
  saleValue?: number | null;
  introValue?: number | null;
  introMonths?: number | null;
  platformCost?: number | null;
  aiAddon?: string | null;
};

type SchedulesData = {
  schedules: OpenHoursData;
};

const companySchema = Yup.object()
  .shape({
    name: Yup.string().min(2).required(),
    whatsappMode: Yup.string().oneOf(
      ["normal", "meta"],
      "ERR_COMPANY_INVALID_WHATSAPP_MODE"
    ),
    phone: Yup.string().nullable(),
    email: Yup.string().email().nullable(),
    password: Yup.string(),
    status: Yup.boolean(),
    planId: Yup.number().integer().positive().nullable(),
    campaignsEnabled: Yup.boolean(),
    voiceCallsEnabled: Yup.boolean(),
    dueDate: Yup.string()
      .nullable()
      .test(
        "valid-due-date",
        "ERR_COMPANY_INVALID_DUE_DATE",
        value => !value || moment(value, moment.ISO_8601, true).isValid()
      ),
    trialDays: Yup.number()
      .strict(true)
      .integer("ERR_INVALID_TRIAL_DAYS")
      .min(0, "ERR_INVALID_TRIAL_DAYS")
      .max(3650, "ERR_INVALID_TRIAL_DAYS"),
    dueDay: Yup.number()
      .strict(true)
      .integer("ERR_INVALID_DUE_DAY")
      .min(1, "ERR_INVALID_DUE_DAY")
      .max(31, "ERR_INVALID_DUE_DAY"),
    recurrence: Yup.string(),
    language: Yup.string(),
    timezone: Yup.string()
      .nullable()
      .test(
        "valid-timezone",
        "ERR_COMPANY_INVALID_TIMEZONE",
        value => !value || normalizeCompanyTimezone(value) !== null
      ),
    slug: Yup.string().nullable(),
    partnerId: Yup.number().integer().positive().nullable(),
    saleValue: Yup.number().nullable(),
    introValue: Yup.number().nullable(),
    introMonths: Yup.number().integer().nullable(),
    platformCost: Yup.number().nullable(),
    captchaToken: Yup.string(),
    passwordConfigured: Yup.boolean(),
    aiAddon: Yup.string()
      .oneOf(["atendimento", "equipe", "gestao"], "ERR_INVALID_AI_ADDON")
      .nullable()
  })
  .noUnknown(true, "ERR_UNKNOWN_FIELD")
  .strict(true);

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { searchParam, pageNumber } = req.query as IndexQuery;

  const { companies, count, hasMore } = await ListCompaniesService({
    searchParam,
    pageNumber
  });

  return res.json({ companies, count, hasMore });
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  const newCompany: CompanyData = {
    ...req.body,
    // Public checkout names are normalized to the provider values used by
    // company administration and the immutable connection-mode checks.
    whatsappMode:
      req.body.whatsappMode === "official"
        ? "meta"
        : req.body.whatsappMode === "unofficial"
          ? "normal"
          : req.body.whatsappMode
  };

  try {
    await companySchema.validate(newCompany);
  } catch (err) {
    throw new AppError(err.message);
  }

  const company = await CreateCompanyService(newCompany);

  return res.status(200).json(company);
};

export const signup = async (
  req: Request,
  res: Response
): Promise<Response> => {
  if (!(await isSignupAllowed())) {
    throw new AppError("ERR_SIGNUP_DISABLED", 403);
  }

  if (process.env.RECAPTCHA_SECRET_KEY) {
    if (!req.body.captchaToken) {
      return res.status(401).json("empty captcha");
    }
    const response = await axios.post(
      `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${req.body.captchaToken}`
    );

    if (!response.data.success) {
      return res.status(401).json("🤖 be gone");
    }
  }

  const company = await CreateSelfServiceCompanyService(
    req.body,
    req.files as SignupFiles
  );
  return res.status(201).json({
    id: company.id,
    name: company.name,
    slug: company.slug,
    signupSource: company.signupSource,
    dueDay: company.dueDay,
    dueDate: company.dueDate,
    trialDays: company.trialDays,
    trialStartedAt: company.trialStartedAt,
    trialExpiresAt: company.trialExpiresAt,
    trial: companyTrial(company)
  });
};

export const show = async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;

  const requestUser = await User.findByPk(req.user.id);

  if (!requestUser.super && Number.parseInt(id, 10) !== requestUser.companyId) {
    throw new AppError("ERR_FORBIDDEN", 403);
  }

  const company = await ShowCompanyService(id);

  return res.status(200).json(company);
};

export const list = async (req: Request, res: Response): Promise<Response> => {
  const companies: Company[] = await FindAllCompaniesService();

  return res.status(200).json(companies);
};

export const update = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const companyData: CompanyData = req.body;

  if (hasCentralizedBillingFields(companyData as Record<string, unknown>)) {
    const requesterCompany = await Company.findByPk(req.user.companyId, {
      attributes: ["id", "slug"]
    });
    if (isBillingConsoleCompany(requesterCompany)) {
      throw new AppError("ERR_BILLING_MANAGED_IN_CENTRAL", 409);
    }
  }

  try {
    await companySchema
      .concat(Yup.object({ name: Yup.string().min(2) }))
      .validate(companyData);
  } catch (err) {
    throw new AppError(err.message);
  }

  const { id } = req.params;

  const company = await UpdateCompanyService({ id, ...companyData });

  return res.status(200).json(company);
};

export const updateSchedules = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { schedules }: SchedulesData = req.body;
  const { id } = req.params;
  const requestUser = await User.findByPk(req.user.id);

  if (!requestUser.super && Number.parseInt(id, 10) !== requestUser.companyId) {
    throw new AppError("ERR_FORBIDDEN", 403);
  }

  const company = await UpdateSchedulesService({
    id,
    schedules
  });

  return res.status(200).json(company);
};

export const remove = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { id } = req.params;

  if (Number(id) === 1) {
    throw new AppError("ERR_FORBIDDEN", 403);
  }

  const company = await DeleteCompanyService(id);

  return res.status(200).json(company);
};
