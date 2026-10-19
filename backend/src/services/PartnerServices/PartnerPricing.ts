import moment from "moment";
import Company from "../../models/Company";

/** Arredondamento monetario padrao do canal (2 casas). */
export const round2 = (value: number): number =>
  Math.round((Number(value) || 0) * 100) / 100;

/** Desconto de revenda usado quando o parceiro nao define um proprio. */
export const DEFAULT_DISCOUNT_PCT = 30;

/**
 * Custo de revenda: o que a plataforma recebe todo mes, independente do preco
 * que o parceiro cobrar do cliente final.
 *
 * O desconto invalido (nulo, NaN) cai no padrao e o valido e limitado a 0..100,
 * para que o custo nunca fique negativo nem acima do preco de tabela.
 */
export const resellerCost = (
  planValue: number,
  discountPct: number
): number => {
  const parsedValue = Number(planValue) || 0;
  const parsedPct = Number(discountPct);
  const pct = Number.isFinite(parsedPct) ? parsedPct : DEFAULT_DISCOUNT_PCT;
  const safePct = Math.min(Math.max(pct, 0), 100);

  return round2(parsedValue * (1 - safePct / 100));
};

/**
 * Preco da fatura de um ciclo: `introValue` enquanto a janela promocional
 * estiver aberta, `saleValue` depois.
 *
 * Funcao PURA de (company, dueDate) e por isso idempotente: a cron apaga e
 * recria as faturas em aberto a cada minuto, entao qualquer regra baseada em
 * contagem de faturas daria um preco instavel. A janela e ancorada em
 * `company.createdAt`, que nao muda.
 */
export const priceForDueDate = (
  company: Company,
  dueDate: Date | string
): number => {
  const introValue = Number(company.introValue) || 0;
  const introMonths = Number(company.introMonths) || 0;

  if (introValue > 0 && introMonths > 0) {
    const introEndsAt = moment(company.createdAt).add(introMonths, "months");

    if (moment(dueDate).isBefore(introEndsAt)) {
      return introValue;
    }
  }

  return company.saleValue;
};
