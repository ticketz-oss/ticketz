import axios, { AxiosInstance, AxiosError } from "axios";
import AppError from "../../errors/AppError";
import { prospeccaoConfig } from "../../helpers/prospeccao";
import { logger } from "../../utils/logger";

export interface NovaBusca {
  nicho?: string;
  cidade?: string;
  queries?: string[];
  maxResultados?: number;
  profundidade?: number;
  raioMetros?: number;
  somenteComWhatsapp?: boolean;
  tom: string;
  produto: string;
}

export interface Lead {
  id: number;
  job_id: string;
  tom: string | null;
  produto: string | null;
  nome: string | null;
  telefone: string | null;
  categoria: string | null;
  endereco: string | null;
  instagram_handle: string | null;
  instagram_bio: string | null;
  instagram_seguidores: number | null;
  instagram_whatsapp: string | null;
  idioma_sugerido: string | null;
  status: string;
  rascunho: string | null;
  erro: string | null;
  created_at: string | null;
  updated_at: string | null;
}

const TOM_VALIDO = ["curta", "media", "longa"];

// O raspador do Google Maps é lento por natureza e o enriquecimento roda lead a
// lead; nosso timeout só cobre o aceite da requisição, nunca o trabalho em si.
const TIMEOUT_MS = 20000;

const clientFor = (baseURL: string): AxiosInstance => {
  const { apiKey } = prospeccaoConfig();
  if (!apiKey) {
    throw new AppError("ERR_PROSPECCAO_NAO_CONFIGURADA", 503);
  }
  return axios.create({
    baseURL,
    timeout: TIMEOUT_MS,
    headers: { "X-API-Key": apiKey }
  });
};

// Erros da API externa não podem vazar para o tenant como 500 anônimo: o
// usuário precisa saber se foi chave, payload ou serviço fora do ar. A mensagem
// crua da API externa fica só no log.
const traduzErro = (erro: unknown, contexto: string): AppError => {
  const axiosErro = erro as AxiosError;
  const status = axiosErro?.response?.status;

  logger.error(
    { status, contexto, detalhe: axiosErro?.message },
    "Falha ao falar com a API de prospecção"
  );

  if (status === 401 || status === 403) {
    return new AppError("ERR_PROSPECCAO_CHAVE_INVALIDA", 502);
  }
  if (status === 422) {
    return new AppError("ERR_PROSPECCAO_BUSCA_INVALIDA", 422);
  }
  if (status === 404) {
    return new AppError("ERR_PROSPECCAO_BUSCA_NAO_ENCONTRADA", 404);
  }
  return new AppError("ERR_PROSPECCAO_INDISPONIVEL", 502);
};

export const listarProdutos = async (): Promise<string[]> => {
  const { bridgeUrl } = prospeccaoConfig();
  try {
    const { data } = await clientFor(bridgeUrl).get<string[]>("/produtos");
    return Array.isArray(data) ? data : [];
  } catch (erro) {
    if (erro instanceof AppError) throw erro;
    throw traduzErro(erro, "listarProdutos");
  }
};

export const criarBusca = async (busca: NovaBusca): Promise<string> => {
  const { apiUrl, webhookUrl } = prospeccaoConfig();

  const tom = TOM_VALIDO.includes(busca.tom) ? busca.tom : "media";
  const webhook = new URL(webhookUrl);
  webhook.searchParams.set("tom", tom);
  webhook.searchParams.set("produto", busca.produto);
  if (busca.cidade) webhook.searchParams.set("cidade", busca.cidade);

  const payload: Record<string, unknown> = {
    idioma: "pt",
    enriquecer_instagram: true,
    // O objetivo final é abrir uma conversa no WhatsApp: lead sem telefone é
    // custo de IA jogado fora.
    filtros: busca.somenteComWhatsapp === false ? [] : ["tem_whatsapp"],
    webhook_url: webhook.toString()
  };

  if (busca.queries?.length) {
    payload.queries = busca.queries;
  } else {
    payload.nicho = busca.nicho;
    payload.cidade = busca.cidade;
  }
  if (busca.maxResultados) payload.max_resultados = busca.maxResultados;
  if (busca.profundidade) payload.profundidade = busca.profundidade;
  if (busca.raioMetros) payload.raio_metros = busca.raioMetros;

  try {
    const { data } = await clientFor(apiUrl).post<{ job_id: string }>(
      "/prospeccao",
      payload
    );
    if (!data?.job_id) {
      throw new AppError("ERR_PROSPECCAO_INDISPONIVEL", 502);
    }
    return data.job_id;
  } catch (erro) {
    if (erro instanceof AppError) throw erro;
    throw traduzErro(erro, "criarBusca");
  }
};

export const statusDaBusca = async (jobId: string): Promise<string> => {
  const { apiUrl } = prospeccaoConfig();
  try {
    const { data } = await clientFor(apiUrl).get<{ status: string }>(
      `/prospeccao/${encodeURIComponent(jobId)}`
    );
    return data?.status || "working";
  } catch (erro) {
    if (erro instanceof AppError) throw erro;
    throw traduzErro(erro, "statusDaBusca");
  }
};

export const listarLeads = async (jobId: string): Promise<Lead[]> => {
  const { bridgeUrl } = prospeccaoConfig();
  try {
    const { data } = await clientFor(bridgeUrl).get<Lead[]>("/leads", {
      params: { job_id: jobId }
    });
    return Array.isArray(data) ? data : [];
  } catch (erro) {
    if (erro instanceof AppError) throw erro;
    throw traduzErro(erro, "listarLeads");
  }
};
