import { Request, Response } from "express";
import * as Yup from "yup";
import AppError from "../errors/AppError";
import ProspeccaoLead from "../models/ProspeccaoLead";
import {
  criarBusca,
  listarLeads,
  listarProdutos,
  statusDaBusca
} from "../services/ProspeccaoServices/ProspeccaoApi";
import SyncProspeccaoLeadsService from "../services/ProspeccaoServices/SyncProspeccaoLeadsService";
import ListProspeccaoLeadsService from "../services/ProspeccaoServices/ListProspeccaoLeadsService";
import AbrirConversaDoLeadService from "../services/ProspeccaoServices/AbrirConversaDoLeadService";
import {
  listCities,
  listCountries,
  listStates,
  resolveLocation
} from "../services/ProspeccaoServices/LocalidadesService";
import {
  getAutomation,
  saveAutomation,
  setAutomationEnabled
} from "../services/ProspeccaoServices/AutomationService";

const STATUS_TERMINAIS = ["ok", "failed", "timeout"];

const serializaLead = (lead: ProspeccaoLead, contatados: Set<number>) => ({
  id: lead.id,
  jobId: lead.jobId,
  nome: lead.nome,
  telefone: lead.telefoneExibicao || lead.telefone,
  temTelefone: !!lead.telefone,
  categoria: lead.categoria,
  endereco: lead.endereco,
  instagramHandle: lead.instagramHandle,
  instagramBio: lead.instagramBio,
  instagramSeguidores: lead.instagramSeguidores,
  idiomaSugerido: lead.idiomaSugerido,
  status: lead.status,
  rascunho: lead.rascunho,
  erro: lead.erro,
  contactId: lead.contactId,
  ticketId: lead.ticketId,
  abertoEm: lead.abertoEm,
  contatado: !!lead.contactId && contatados.has(lead.contactId),
  origin: lead.origin,
  deliveryStatus:
    lead.deliveryStatus ||
    (lead.contactId && contatados.has(lead.contactId)
      ? "SENT"
      : lead.ticketId
        ? "OPEN_CONVERSATION"
        : "NOT_CONTACTED"),
  scheduledSendAt: lead.scheduledSendAt,
  autoSentAt: lead.autoSentAt,
  repliedAt: lead.repliedAt,
  closeDueAt: lead.closeDueAt,
  deliveryError: lead.deliveryError,
  createdAt: lead.createdAt
});

export const produtos = async (
  _req: Request,
  res: Response
): Promise<Response> => {
  return res.json(await listarProdutos());
};

const buscaSchema = Yup.object().shape({
  nicho: Yup.string().trim().max(120),
  cidade: Yup.string().trim().max(120),
  maxResultados: Yup.number().integer().min(1).max(100),
  profundidade: Yup.number().integer().min(1).max(50),
  tom: Yup.string().oneOf(["curta", "media", "longa"]),
  produto: Yup.string().trim().max(60).required(),
  somenteComWhatsapp: Yup.boolean(),
  countryCode: Yup.string().length(2),
  stateCode: Yup.string().max(20),
  cityName: Yup.string().max(120)
});

export const store = async (req: Request, res: Response): Promise<Response> => {
  const {
    nicho,
    cidade,
    maxResultados,
    profundidade,
    tom,
    produto,
    somenteComWhatsapp,
    countryCode,
    stateCode,
    cityName
  } = req.body;

  try {
    await buscaSchema.validate({
      nicho,
      cidade,
      maxResultados,
      profundidade,
      tom,
      produto,
      somenteComWhatsapp,
      countryCode,
      stateCode,
      cityName
    });
  } catch (erro) {
    throw new AppError((erro as Yup.ValidationError).message, 400);
  }

  let locationQuery = String(cidade || "").trim();
  if (countryCode) {
    locationQuery = (
      await resolveLocation({ countryCode, stateCode, cityName })
    ).query;
  }
  if (!String(nicho || "").trim() || !locationQuery) {
    throw new AppError("ERR_PROSPECCAO_NICHO_CIDADE_OBRIGATORIOS", 400);
  }

  const jobId = await criarBusca({
    nicho: String(nicho).trim(),
    cidade: locationQuery,
    maxResultados: maxResultados ? Number(maxResultados) : 10,
    profundidade: profundidade ? Number(profundidade) : undefined,
    somenteComWhatsapp,
    tom: tom || "media",
    produto
  });

  return res.status(202).json({ jobId });
};

export const countries = async (
  _req: Request,
  res: Response
): Promise<Response> => res.json(await listCountries());

export const states = async (req: Request, res: Response): Promise<Response> =>
  res.json(await listStates(String(req.query.pais || "")));

export const cities = async (req: Request, res: Response): Promise<Response> =>
  res.json(
    await listCities(
      String(req.query.pais || ""),
      String(req.query.estado || "") || undefined
    )
  );

export const automationShow = async (
  req: Request,
  res: Response
): Promise<Response> =>
  res.json(await getAutomation(Number(req.user.companyId)));

export const automationUpdate = async (
  req: Request,
  res: Response
): Promise<Response> =>
  res.json(await saveAutomation(Number(req.user.companyId), req.body));

export const automationActivation = async (
  req: Request,
  res: Response
): Promise<Response> =>
  res.json(
    await setAutomationEnabled(
      Number(req.user.companyId),
      req.body.enabled === true
    )
  );

// Uma chamada só para a tela: o status da raspagem e os rascunhos vivem em
// serviços diferentes, mas quem está olhando a tela só quer saber se já pode
// mandar mensagem. Aproveitamos o poll para trazer os leads novos para a base.
export const show = async (req: Request, res: Response): Promise<Response> => {
  const { jobId } = req.params;
  const { companyId } = req.user;

  const statusBusca = await statusDaBusca(jobId);
  const raspagemTerminou = STATUS_TERMINAIS.includes(statusBusca);

  let pendentes = 0;
  let total = 0;
  let ingeridos = { novos: 0, atualizados: 0, ignorados: 0 };

  if (raspagemTerminou) {
    const leads = await listarLeads(jobId);
    total = leads.length;
    pendentes = leads.filter(lead => lead.status === "pendente").length;
    ingeridos = await SyncProspeccaoLeadsService({
      companyId: Number(companyId),
      jobId,
      leads
    });
  }

  return res.json({
    jobId,
    statusBusca,
    raspagemTerminou,
    pendentes,
    total,
    novos: ingeridos.novos,
    repetidos: ingeridos.ignorados,
    // Só é "concluído" quando todo lead saiu de pendente. Lista vazia não
    // conta: o enriquecimento ainda pode estar rodando lá fora.
    concluido: raspagemTerminou && total > 0 && pendentes === 0
  });
};

export const leads = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;
  const { filtro, searchParam, pageNumber, perPage } = req.query as Record<
    string,
    string
  >;

  const resultado = await ListProspeccaoLeadsService({
    companyId: Number(companyId),
    filtro,
    searchParam,
    pageNumber,
    perPage
  });

  return res.json({
    leads: resultado.leads.map(lead =>
      serializaLead(lead, resultado.contatados)
    ),
    count: resultado.count,
    hasMore: resultado.hasMore,
    pageNumber: resultado.pageNumber,
    perPage: resultado.perPage
  });
};

export const abrirConversa = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { companyId, id: userId } = req.user;
  const { leadId } = req.params;
  const { rascunho } = req.body;

  const resultado = await AbrirConversaDoLeadService({
    leadId: Number(leadId),
    companyId: Number(companyId),
    userId: Number(userId),
    rascunho
  });

  return res.json(resultado);
};
