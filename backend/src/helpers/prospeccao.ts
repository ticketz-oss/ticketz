import { readFileSync } from "fs";
import Company from "../models/Company";
import User from "../models/User";

// A Prospecção fala com uma API externa (prospeccao-api + hermes-bridge) que
// gasta crédito de IA por lead e não tem noção de tenant: quem tem a chave vê
// todos os leads gerados nela. Por isso a tela é amarrada ao slug do tenant, e
// não ao id — cada instalação tem o seu id 1, e a AC Norte roda o mesmo código
// em banco próprio sem poder herdar a tela.
const TENANT_SLUG = "teste";

const clean = (slug?: string | null): string =>
  String(slug ?? "")
    .trim()
    .toLowerCase();

export const prospeccaoSlugs = (): string[] => {
  // Esta ferramenta usa uma base externa compartilhada. A autorização não é
  // configurável por ambiente para que um erro de variável não a exponha a
  // outro tenant.
  return [TENANT_SLUG];
};

export const isProspeccaoCompany = (
  company?: Pick<Company, "slug"> | null
): boolean => {
  const slug = clean(company?.slug);
  return !!slug && prospeccaoSlugs().includes(slug);
};

// Prospecção é ferramenta de dono da operação: admin do tenant basta, não
// precisa ser super (que abriria a plataforma inteira).
export const canUseProspeccao = (
  user?: Pick<User, "profile" | "super"> | null
): boolean => !!user && (user.super === true || user.profile === "admin");

const trimTrailingSlash = (url: string): string => url.replace(/\/+$/, "");

// Mesmo arranjo do WaCalls: em produção a chave chega como docker secret (um
// arquivo), e não pelo ambiente — assim ela não aparece no `docker inspect`
// nem na tela de variáveis do Dokploy. A variável direta continua valendo para
// desenvolvimento e testes.
const apiKeyFromEnvOrFile = (): string => {
  const direta = process.env.PROSPECCAO_API_KEY?.trim() || "";
  const arquivo = process.env.PROSPECCAO_API_KEY_FILE?.trim() || "";
  if (direta || !arquivo) return direta;
  try {
    return readFileSync(arquivo, "utf8").trim();
  } catch {
    return "";
  }
};

export interface ProspeccaoConfig {
  apiUrl: string;
  bridgeUrl: string;
  apiKey: string;
  webhookUrl: string;
}

// Os serviços de prospecção sobem em um projeto Compose separado e só são
// alcançáveis pelo IP do host (o prospeccao-api não está na dokploy-network),
// por isso o default é IP:porta e não um nome de serviço.
export const prospeccaoConfig = (): ProspeccaoConfig => {
  const bridgeUrl = trimTrailingSlash(
    process.env.PROSPECCAO_BRIDGE_URL?.trim() || "http://179.199.139.11:8001"
  );
  return {
    apiUrl: trimTrailingSlash(
      process.env.PROSPECCAO_API_URL?.trim() || "http://179.199.139.11:8000"
    ),
    bridgeUrl,
    apiKey: apiKeyFromEnvOrFile(),
    // Quem chama esse webhook é o prospeccao-api, não o nosso backend: o
    // endereço precisa fazer sentido de dentro do projeto Compose da
    // prospecção, onde o bridge é vizinho de rede. Usar o nome do serviço
    // evita depender de hairpin NAT no IP do host.
    webhookUrl:
      process.env.PROSPECCAO_WEBHOOK_URL?.trim() ||
      "http://hermes-bridge:8000/webhook/prospeccao"
  };
};

export const isProspeccaoConfigured = (): boolean =>
  !!prospeccaoConfig().apiKey;
