import { z } from "zod";
import AppError from "../../errors/AppError";

const posicao = z.object({ x: z.number().finite(), y: z.number().finite() });
const bloco = z.object({
  id: z.string().min(1).max(80),
  optionId: z.number().int().positive().nullable().optional(),
  kind: z.enum(["inicio", "mensagem", "menu", "midia", "transferir", "humano"]),
  title: z.string().trim().min(1).max(200),
  message: z.string().max(20000).default(""),
  isActive: z.boolean().default(true),
  forwardQueueId: z.number().int().positive().nullable().optional(),
  position: posicao
});
const esquema = z.object({
  version: z.string(),
  nodes: z.array(bloco).min(1).max(300),
  edges: z.array(z.object({ source: z.string(), target: z.string() })).max(299)
});

export type Fluxo = z.infer<typeof esquema>;

export const validarFluxo = (entrada: unknown): Fluxo => {
  const resultado = esquema.safeParse(entrada);
  if (!resultado.success) throw new AppError("ERR_FLOW_INVALID", 400);
  const fluxo = resultado.data;
  const porId = new Map(fluxo.nodes.map(no => [no.id, no]));
  const inicio = fluxo.nodes.filter(no => no.kind === "inicio");
  const opcoes = fluxo.nodes.flatMap(no => (no.optionId ? [no.optionId] : []));
  if (
    porId.size !== fluxo.nodes.length ||
    inicio.length !== 1 ||
    inicio[0].optionId ||
    new Set(opcoes).size !== opcoes.length
  ) {
    throw new AppError("ERR_FLOW_INVALID", 400);
  }
  const pais = new Map<string, string>();
  fluxo.edges.forEach(ligacao => {
    const origem = porId.get(ligacao.source);
    const destino = porId.get(ligacao.target);
    if (
      !origem ||
      !destino ||
      destino.kind === "inicio" ||
      pais.has(destino.id) ||
      ["transferir", "humano"].includes(origem.kind)
    ) {
      throw new AppError("ERR_FLOW_CONNECTION", 400);
    }
    pais.set(destino.id, origem.id);
  });
  fluxo.nodes.forEach(no => {
    if (no.kind === "transferir" && !no.forwardQueueId) {
      throw new AppError("ERR_FLOW_QUEUE_REQUIRED", 400);
    }
    const visitados = new Set<string>();
    let atual = no.id;
    while (atual !== inicio[0].id) {
      if (visitados.has(atual) || !pais.has(atual)) {
        throw new AppError("ERR_FLOW_DISCONNECTED", 400);
      }
      visitados.add(atual);
      atual = pais.get(atual);
    }
  });
  return fluxo;
};
