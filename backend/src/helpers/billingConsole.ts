import Company from "../models/Company";
import User from "../models/User";

// A Central de Cobrança é a tela do responsável financeiro da operação: ela
// enxerga as faturas de *todos* os tenants, então só pode existir no tenant
// dono da plataforma. Amarramos ao slug (e não ao id) porque cada instalação
// tem o seu id 1 — a AC Norte, por exemplo, roda o mesmo código em banco
// próprio e não pode ganhar a tela.
const DEFAULT_SLUGS = ["teste"];

// Estes campos definem o ciclo financeiro do cliente. No tenant dono da
// Central eles só podem ser alterados pela própria Central de Cobrança; a tela
// genérica de empresas continua cuidando dos dados operacionais.
export const CENTRALIZED_BILLING_FIELDS = [
  "planId",
  "saleValue",
  "introValue",
  "introMonths",
  "trialDays",
  "dueDay",
  "dueDate",
  "recurrence"
] as const;

export const hasCentralizedBillingFields = (
  payload?: Record<string, unknown> | null
): boolean =>
  !!payload &&
  CENTRALIZED_BILLING_FIELDS.some(field =>
    Object.prototype.hasOwnProperty.call(payload, field)
  );

const clean = (slug?: string | null): string =>
  String(slug ?? "")
    .trim()
    .toLowerCase();

export const billingConsoleSlugs = (): string[] => {
  const configured = process.env.BILLING_CONSOLE_SLUGS?.trim();
  const slugs = configured ? configured.split(",") : DEFAULT_SLUGS;
  return slugs.map(clean).filter(Boolean);
};

export const isBillingConsoleCompany = (
  company?: Pick<Company, "slug"> | null
): boolean => {
  const slug = clean(company?.slug);
  return !!slug && billingConsoleSlugs().includes(slug);
};

// O financeiro é admin do tenant dono — não precisa ser super, que abriria a
// plataforma inteira.
export const canUseBillingConsole = (
  user?: Pick<User, "profile" | "super"> | null
): boolean => !!user && (user.super === true || user.profile === "admin");
