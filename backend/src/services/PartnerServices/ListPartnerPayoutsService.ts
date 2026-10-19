import { Op } from "sequelize";
import PartnerPayout from "../../models/PartnerPayout";
import Company from "../../models/Company";
import Invoices from "../../models/Invoices";
import Partner from "../../models/Partner";
import { round2 } from "./AccrualPartnerPayoutService";

interface ListParams {
  partnerId?: number;
  // Datas ISO (YYYY-MM-DD). Filtram pela criacao do repasse.
  startDate?: string;
  endDate?: string;
  status?: string;
}

export interface PartnerPayoutTotals {
  // Comissao bruta do periodo.
  gross: number;
  // Tarifas Pix descontadas (so no modo imediato).
  fees: number;
  // Ja creditado na conta do parceiro.
  paid: number;
  // Ainda a receber (tudo que nao esta pago).
  pending: number;
}

const sumBy = (
  rows: PartnerPayout[],
  field: "amount" | "feeAmount" | "netAmount"
): number =>
  round2(rows.reduce((acc, row) => acc + (Number(row[field]) || 0), 0));

const ListPartnerPayoutsService = async ({
  partnerId,
  startDate,
  endDate,
  status
}: ListParams): Promise<{
  payouts: PartnerPayout[];
  totals: PartnerPayoutTotals;
}> => {
  const where: Record<string, any> = {};

  if (partnerId) {
    where.partnerId = partnerId;
  }

  if (status) {
    where.status = status;
  }

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) {
      where.createdAt[Op.gte] = new Date(`${startDate}T00:00:00`);
    }
    if (endDate) {
      where.createdAt[Op.lte] = new Date(`${endDate}T23:59:59`);
    }
  }

  const payouts = await PartnerPayout.findAll({
    where,
    include: [
      { model: Company, as: "company", attributes: ["id", "name"] },
      {
        model: Invoices,
        as: "invoice",
        attributes: ["id", "detail", "dueDate", "status", "value"]
      },
      { model: Partner, as: "partner", attributes: ["id", "name", "email"] }
    ],
    order: [["id", "DESC"]]
  });

  const paidRows = payouts.filter(row => row.status === "paid");
  const pendingRows = payouts.filter(row => row.status !== "paid");

  return {
    payouts,
    totals: {
      gross: sumBy(payouts, "amount"),
      fees: sumBy(payouts, "feeAmount"),
      paid: sumBy(paidRows, "netAmount"),
      pending: sumBy(pendingRows, "netAmount")
    }
  };
};

export default ListPartnerPayoutsService;
