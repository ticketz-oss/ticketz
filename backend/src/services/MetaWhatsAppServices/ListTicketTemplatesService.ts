import NodeCache from "node-cache";
import Whatsapp from "../../models/Whatsapp";
import {
  bodyOfTemplate,
  listMetaTemplatesSafe,
  MetaTemplate
} from "./MetaTemplateRegistryService";

export interface TicketTemplate {
  name: string;
  language: string;
  category: string;
  header: string | null;
  body: string;
  footer: string | null;
  // Quantas variaveis {{n}} o corpo espera, na ordem em que a Meta as numera.
  variables: number;
}

const componentOf = (template: MetaTemplate, type: string) =>
  template.components?.find(component => component.type === type);

// A Meta numera as variaveis do corpo de 1 a N; o maior indice presente e a
// quantidade de parametros que o envio precisa mandar.
export const countTemplateVariables = (body: string): number => {
  const indexes = [...body.matchAll(/\{\{\s*(\d+)\s*\}\}/g)].map(match =>
    Number(match[1])
  );

  return indexes.length ? Math.max(...indexes) : 0;
};

export const toTicketTemplate = (template: MetaTemplate): TicketTemplate => {
  const body = bodyOfTemplate(template);

  return {
    name: template.name,
    language: template.language,
    category: template.category || "",
    header: componentOf(template, "HEADER")?.text || null,
    body,
    footer: componentOf(template, "FOOTER")?.text || null,
    variables: countTemplateVariables(body)
  };
};

// A lista muda quando alguem cria ou aprova um template no Gerenciador da
// Meta, nao a cada atendimento aberto. Sem cache, cada atendente abrindo um
// ticket viraria uma chamada a Graph API e o limite de taxa da WABA seria o
// proximo problema.
const templatesCache = new NodeCache({ stdTTL: 300, useClones: false });

export const clearTicketTemplatesCache = (whatsappId?: number): void => {
  if (whatsappId === undefined) {
    templatesCache.flushAll();
    return;
  }
  templatesCache.del(String(whatsappId));
};

// Só templates aprovados: mandar um PENDING ou REJECTED devolve erro da Graph
// API e o atendente nao teria como saber a diferenca na tela.
//
// Templates com header de midia ficam de fora por enquanto - eles exigem um
// handle de upload, que e o fluxo da cobranca e nao cabe no chat.
const ListTicketTemplatesService = async (
  whatsapp: Whatsapp
): Promise<TicketTemplate[]> => {
  const cacheKey = String(whatsapp.id);
  const cached = templatesCache.get<TicketTemplate[]>(cacheKey);

  if (cached) return cached;

  const templates = await listMetaTemplatesSafe(whatsapp);

  if (!templates) return [];

  const approved = templates
    .filter(template => template.status === "APPROVED")
    .filter(template => {
      if (template.parameter_format === "NAMED") return false;
      return (template.components || []).every(component => {
        if (component.type === "HEADER") {
          return (
            (!component.format || component.format === "TEXT") &&
            !component.text?.includes("{{")
          );
        }
        if (component.type === "BODY") {
          return !/\{\{\s*[^\d\s}]/.test(component.text || "");
        }
        if (component.type === "FOOTER") return !component.text?.includes("{{");
        if (component.type === "BUTTONS") {
          return (component.buttons || []).every(
            button =>
              ["URL", "PHONE_NUMBER", "QUICK_REPLY"].includes(button.type) &&
              !button.url?.includes("{{")
          );
        }
        return false;
      });
    })
    .map(toTicketTemplate)
    .sort((left, right) => left.name.localeCompare(right.name));

  templatesCache.set(cacheKey, approved);

  return approved;
};

export default ListTicketTemplatesService;
