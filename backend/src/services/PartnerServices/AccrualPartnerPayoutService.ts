import { UniqueConstraintError } from "sequelize";
import Invoices from "../../models/Invoices";
import Company from "../../models/Company";
import Partner from "../../models/Partner";
import PartnerPayout from "../../models/PartnerPayout";
import Plan from "../../models/Plan";
import { getPartnerPixFee } from "../PaymentGatewayServices/AbacatePayServices";
import { logger } from "../../utils/logger";
import { resellerCost, round2 } from "./PartnerPricing";

// Reexportado para os importadores historicos deste modulo; a aritmetica do
// canal mora em PartnerPricing.
export { round2 };

/**
 * Registra o repasse de uma fatura paga.
 *
 * O parceiro compra o plano com desconto e revende pelo preço que quiser: a
 * plataforma fica com o custo de revenda e o parceiro com tudo o que estiver
 * acima dele. O custo vem do snapshot gravado na venda (`Company.platformCost`),
 * então reajuste de plano não altera negócio já fechado.
 *
 * Idempotente por construção: `PartnerPayouts.invoiceId` é único, então um
 * replay do webhook de pagamento não consegue gerar um segundo repasse. Essa
 * é a invariante crítica do módulo — tudo o mais pode ser reprocessado.
 *
 * No-op silencioso quando a empresa não foi vendida por parceiro, quando o
 * parceiro está inativo ou quando a margem é zero ou negativa.
 */
const AccrualPartnerPayoutService = async (
  invoice: Invoices
): Promise<PartnerPayout | null> => {
  const company =
    invoice.company || (await Company.findByPk(invoice.companyId));

  if (!company?.partnerId) {
    return null;
  }

  const partner = await Partner.findByPk(company.partnerId);

  if (!partner || !partner.status) {
    return null;
  }

  // O snapshot cobre a venda; o fallback existe para empresas antigas que
  // ficaram sem ele e recalcula pelo preco de tabela atual.
  const platformCost =
    company.platformCost != null
      ? round2(company.platformCost)
      : resellerCost(
          (await Plan.findByPk(company.planId))?.value ?? 0,
          partner.discountPct
        );

  const baseValue = round2(invoice.value);
  const amount = round2(baseValue - platformCost);

  if (amount <= 0) {
    return null;
  }

  // No modo imediato cada repasse é uma transferência, então a tarifa sai do
  // parceiro. No agendado o mês inteiro sai numa transferência só e a tarifa
  // é absorvida pela plataforma.
  const mode = partner.payoutMode === "scheduled" ? "scheduled" : "immediate";
  const feeAmount = mode === "immediate" ? round2(await getPartnerPixFee()) : 0;

  try {
    return await PartnerPayout.create({
      partnerId: partner.id,
      companyId: company.id,
      invoiceId: invoice.id,
      baseValue,
      platformCost,
      amount,
      feeAmount,
      netAmount: round2(amount - feeAmount),
      mode,
      status: "pending",
      attempts: 0
    } as any);
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      logger.debug(
        `[partnerPayouts] repasse da fatura ${invoice.id} já registrado`
      );
      return PartnerPayout.findOne({ where: { invoiceId: invoice.id } });
    }
    throw error;
  }
};

export default AccrualPartnerPayoutService;
