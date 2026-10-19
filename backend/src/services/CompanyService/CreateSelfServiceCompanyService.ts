import * as Yup from "yup";
import { promises as fs } from "fs";
import moment from "moment";
import sequelize from "../../database";
import Plan from "../../models/Plan";
import AppError from "../../errors/AppError";
import CreateCompanyService from "./CreateCompanyService";
import {
  prepareSignupImages,
  saveSignupBranding,
  SignupFiles
} from "./SignupBrandingService";

export const SELF_SERVICE_TRIAL_DAYS = 7;

export const normalizeSignupData = (body: Record<string, unknown>) => ({
  name: typeof body.name === "string" ? body.name.trim() : body.name,
  email:
    typeof body.email === "string"
      ? body.email.trim().toLowerCase()
      : body.email,
  phone: body.phone,
  password: body.password,
  planId: Number(body.planId),
  dueDay:
    body.dueDay === undefined
      ? moment.utc().add(SELF_SERVICE_TRIAL_DAYS, "days").date()
      : Number(body.dueDay),
  slug: body.slug,
  timezone: body.timezone || null,
  aiAddon: body.aiAddon || null,
  whatsappMode:
    body.whatsappMode === "official"
      ? "meta"
      : body.whatsappMode === "unofficial" || !body.whatsappMode
        ? "normal"
        : body.whatsappMode,
  primaryColor: body.primaryColor || "#5000ff"
});

const signupSchema = Yup.object({
  name: Yup.string().min(2).max(100).required(),
  email: Yup.string().email().max(254).required(),
  phone: Yup.string()
    .matches(/^\+?\d{10,15}$/)
    .required(),
  password: Yup.string().min(6).max(128).required(),
  planId: Yup.number().integer().positive().required(),
  dueDay: Yup.number().integer().min(1).max(31).required(),
  slug: Yup.string().max(63).nullable(),
  timezone: Yup.string().max(100).nullable(),
  aiAddon: Yup.string()
    .oneOf(["atendimento", "equipe", "gestao", null])
    .nullable(),
  whatsappMode: Yup.string().oneOf(["normal", "meta"]).required(),
  primaryColor: Yup.string()
    .matches(/^#[0-9a-f]{6}$/i)
    .required()
}).strict();

const CreateSelfServiceCompanyService = async (
  body: Record<string, unknown>,
  files: SignupFiles = {}
) => {
  let data: Yup.InferType<typeof signupSchema>;
  try {
    data = await signupSchema.validate(normalizeSignupData(body));
  } catch {
    throw new AppError("ERR_SIGNUP_INVALID_DATA", 400);
  }
  const images = await prepareSignupImages(files);
  const writtenFiles: string[] = [];
  try {
    return await sequelize.transaction(async transaction => {
      const plan = await Plan.findOne({
        where: { id: data.planId, isPublic: true },
        transaction
      });
      if (!plan) throw new AppError("ERR_SIGNUP_INVALID_PLAN", 400);
      const company = await CreateCompanyService(
        {
          ...data,
          whatsappMode: data.whatsappMode as "normal" | "meta",
          aiAddon: /\b(ai|ia)\b|enterprise/i.test(plan.name)
            ? null
            : data.aiAddon,
          status: true,
          campaignsEnabled: data.whatsappMode !== "meta",
          recurrence: "MENSAL",
          trialDays: SELF_SERVICE_TRIAL_DAYS,
          signupSource: "self_service"
        },
        { transaction }
      );
      await saveSignupBranding(
        company.id,
        company.name,
        data.primaryColor,
        images,
        transaction,
        writtenFiles
      );
      return company;
    });
  } catch (error) {
    await Promise.all(
      writtenFiles.map(filepath => fs.unlink(filepath).catch(() => undefined))
    );
    throw error;
  }
};

export default CreateSelfServiceCompanyService;
