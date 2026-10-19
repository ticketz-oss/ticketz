import { Op, Sequelize } from "sequelize";
import * as Yup from "yup";
import AppError from "../../errors/AppError";
import Partner from "../../models/Partner";
import Company from "../../models/Company";
import PartnerPayout from "../../models/PartnerPayout";
import SerializePartner, {
  SerializedPartner
} from "../../helpers/SerializePartner";
import { DEFAULT_DISCOUNT_PCT } from "./PartnerPricing";

const PARTNERS_PER_PAGE = 20;

const normalizeEmail = (email: string): string =>
  String(email || "")
    .trim()
    .toLowerCase();

const assertEmailAvailable = async (
  email: string,
  ignoreId?: number
): Promise<void> => {
  const where: Record<string, any> = Sequelize.where(
    Sequelize.fn("LOWER", Sequelize.col("email")),
    email
  );

  const existing = await Partner.findOne({
    where: ignoreId
      ? { [Op.and]: [where, { id: { [Op.ne]: ignoreId } }] }
      : where
  });

  if (existing) {
    throw new AppError("ERR_PARTNER_EMAIL_ALREADY_EXISTS", 400);
  }
};

const partnerSchema = Yup.object().shape({
  name: Yup.string().min(2, "ERR_PARTNER_INVALID_NAME").required(),
  email: Yup.string().email("ERR_PARTNER_INVALID_EMAIL").required(),
  discountPct: Yup.number().min(0).max(100)
});

export interface PartnerWithStats extends SerializedPartner {
  companiesCount: number;
  pendingAmount: number;
}

export const ListPartners = async ({
  searchParam = "",
  pageNumber = "1"
}: {
  searchParam?: string;
  pageNumber?: string;
}): Promise<{
  partners: PartnerWithStats[];
  count: number;
  hasMore: boolean;
}> => {
  const search = `%${searchParam.toLowerCase().trim()}%`;
  const limit = PARTNERS_PER_PAGE;
  const offset = limit * (Number(pageNumber) - 1);

  const { count, rows } = await Partner.findAndCountAll({
    where: searchParam
      ? {
          [Op.or]: [
            Sequelize.where(Sequelize.fn("LOWER", Sequelize.col("name")), {
              [Op.like]: search
            }),
            Sequelize.where(Sequelize.fn("LOWER", Sequelize.col("email")), {
              [Op.like]: search
            })
          ]
        }
      : undefined,
    limit,
    offset,
    order: [["name", "ASC"]]
  });

  const ids = rows.map(partner => partner.id);

  const companies = ids.length
    ? await Company.findAll({
        where: { partnerId: ids },
        attributes: ["id", "partnerId"]
      })
    : [];

  const openPayouts = ids.length
    ? await PartnerPayout.findAll({
        where: { partnerId: ids, status: { [Op.ne]: "paid" } },
        attributes: ["partnerId", "netAmount"]
      })
    : [];

  const partners = rows.map(partner => ({
    ...SerializePartner(partner),
    companiesCount: companies.filter(c => c.partnerId === partner.id).length,
    pendingAmount:
      Math.round(
        openPayouts
          .filter(p => p.partnerId === partner.id)
          .reduce((acc, p) => acc + (Number(p.netAmount) || 0), 0) * 100
      ) / 100
  }));

  return { partners, count, hasMore: count > offset + rows.length };
};

export const ShowPartner = async (
  id: number | string
): Promise<SerializedPartner> => {
  const partner = await Partner.findByPk(id);

  if (!partner) {
    throw new AppError("ERR_NO_PARTNER_FOUND", 404);
  }

  return SerializePartner(partner);
};

interface PartnerData {
  name: string;
  email: string;
  phone?: string;
  discountPct?: number;
  status?: boolean;
}

export const CreatePartner = async (
  data: PartnerData
): Promise<SerializedPartner> => {
  const email = normalizeEmail(data.email);

  try {
    await partnerSchema.validate({ ...data, email });
  } catch (err: any) {
    throw new AppError(err.message);
  }

  await assertEmailAvailable(email);

  // Sem desconto informado o parceiro nasce no padrao do canal (30%), e nao em
  // zero: zero significaria comprar o plano pelo preco de tabela.
  const discountPct = Number(data.discountPct);

  const partner = await Partner.create({
    name: data.name,
    email,
    phone: data.phone,
    discountPct: Number.isFinite(discountPct)
      ? discountPct
      : DEFAULT_DISCOUNT_PCT,
    status: data.status ?? true
  } as any);

  return SerializePartner(partner);
};

export const UpdatePartner = async (
  id: number | string,
  data: Partial<PartnerData>
): Promise<SerializedPartner> => {
  const partner = await Partner.findByPk(id);

  if (!partner) {
    throw new AppError("ERR_NO_PARTNER_FOUND", 404);
  }

  const payload: Record<string, any> = {};

  if (data.name !== undefined) payload.name = data.name;
  if (data.phone !== undefined) payload.phone = data.phone;
  if (data.status !== undefined) payload.status = data.status;

  if (data.discountPct !== undefined) {
    const pct = Number(data.discountPct);
    if (!Number.isFinite(pct) || pct < 0 || pct > 100) {
      throw new AppError("ERR_INVALID_COMMISSION", 400);
    }
    // Nao mexe nos repasses ja apurados: cada linha guarda o seu snapshot.
    payload.discountPct = pct;
  }

  if (data.email !== undefined) {
    const email = normalizeEmail(data.email);
    await assertEmailAvailable(email, partner.id);
    payload.email = email;
  }

  await partner.update(payload);

  return SerializePartner(partner);
};

export const DeletePartner = async (id: number | string): Promise<void> => {
  const partner = await Partner.findByPk(id);

  if (!partner) {
    throw new AppError("ERR_NO_PARTNER_FOUND", 404);
  }

  const openPayouts = await PartnerPayout.count({
    where: { partnerId: partner.id, status: { [Op.ne]: "paid" } }
  });

  if (openPayouts) {
    throw new AppError("ERR_PARTNER_HAS_OPEN_PAYOUTS", 400);
  }

  // As empresas ficam: o FK e SET NULL, entao viram venda direta.
  await partner.destroy();
};
