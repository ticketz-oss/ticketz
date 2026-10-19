import AppError from "../../errors/AppError";
import Whatsapp from "../../models/Whatsapp";
import { logger } from "../../utils/logger";
import { getMetaGraphApiClient, withAuth } from "./MetaGraphApiClient";
import UploadMetaTemplateSampleService from "./UploadMetaTemplateSampleService";
import {
  PLACEHOLDER_EXAMPLES,
  TEMPLATE_BODY_LIMIT,
  TEMPLATE_CATEGORY,
  TEMPLATE_LANGUAGE,
  TemplatePlaceholder
} from "./MetaTemplateFormat";

export interface MetaTemplate {
  id: string;
  name: string;
  status: string;
  language: string;
  category?: string;
  parameter_format?: string;
  components?: {
    type: string;
    format?: string;
    text?: string;
    buttons?: { type: string; url?: string }[];
  }[];
  rejected_reason?: string;
}

export interface TemplateSample {
  content: Buffer;
  filename: string;
  mimetype: string;
}

const requireWaba = (whatsapp: Whatsapp): void => {
  if (!whatsapp.metaWabaId || !whatsapp.metaAccessToken) {
    throw new AppError("ERR_META_CONNECTION_NOT_CONFIGURED");
  }
};

export const listMetaTemplates = async (
  whatsapp: Whatsapp
): Promise<MetaTemplate[]> => {
  requireWaba(whatsapp);

  const templates: MetaTemplate[] = [];
  const seen = new Set<string>();
  let after: string | undefined;
  for (let page = 0; page < 100; page += 1) {
    const { data } = await getMetaGraphApiClient().get(
      `/${whatsapp.metaWabaId}/message_templates`,
      {
        ...withAuth(whatsapp.metaAccessToken),
        params: {
          limit: 200,
          fields:
            "id,name,status,language,category,components,rejected_reason",
          ...(after ? { after } : {})
        }
      }
    );
    templates.push(...((data?.data as MetaTemplate[]) || []));
    if (!data?.paging?.next) return templates;
    // Never follow a supplied URL with our bearer token. Validate the origin
    // and resource, then use only the cursor on our fixed Graph endpoint.
    let next: URL;
    try {
      next = new URL(data.paging.next);
    } catch {
      throw new AppError("ERR_META_TEMPLATE_PAGINATION", 502);
    }
    const expectedSuffix = `/${whatsapp.metaWabaId}/message_templates`;
    const pathname = next.pathname.replace(/^\/v\d+\.\d+/, "");
    after = next.searchParams.get("after") || undefined;
    if (
      next.protocol !== "https:" ||
      next.host !== "graph.facebook.com" ||
      next.username ||
      next.password ||
      pathname !== expectedSuffix ||
      !after ||
      seen.has(after)
    ) {
      throw new AppError("ERR_META_TEMPLATE_PAGINATION", 502);
    }
    seen.add(after);
  }
  throw new AppError("ERR_META_TEMPLATE_PAGINATION", 502);
};

// A tela de cobranca precisa do status de cada etapa, mas nao pode quebrar se
// a Graph API estiver fora - sem isso a pagina inteira deixaria de abrir.
export const listMetaTemplatesSafe = async (
  whatsapp: Whatsapp
): Promise<MetaTemplate[] | null> => {
  try {
    return await listMetaTemplates(whatsapp);
  } catch (error) {
    logger.warn(
      { error, whatsappId: whatsapp.id },
      "Could not list Meta templates"
    );
    return null;
  }
};

export const bodyOfTemplate = (template: MetaTemplate): string =>
  template.components?.find(component => component.type === "BODY")?.text || "";

export const hasDocumentHeader = (template: MetaTemplate): boolean =>
  !!template.components?.find(
    component => component.type === "HEADER" && component.format === "DOCUMENT"
  );

interface SubmitRequest {
  whatsapp: Whatsapp;
  name: string;
  body: string;
  variables: TemplatePlaceholder[];
  sample?: TemplateSample;
  existing?: MetaTemplate;
}

// Cria o template na WABA ou edita o que ja existe. A Meta nao deixa trocar
// nome, idioma nem categoria numa edicao, so os componentes - e qualquer
// edicao devolve o template para aprovacao (PENDING).
export const submitMetaTemplate = async ({
  whatsapp,
  name,
  body,
  variables,
  sample,
  existing
}: SubmitRequest): Promise<{ id: string; status: string }> => {
  requireWaba(whatsapp);

  if (body.length > TEMPLATE_BODY_LIMIT) {
    throw new AppError("ERR_META_TEMPLATE_BODY_TOO_LONG", 400);
  }

  const components: Record<string, unknown>[] = [];

  if (sample) {
    components.push({
      type: "HEADER",
      format: "DOCUMENT",
      example: {
        header_handle: [
          await UploadMetaTemplateSampleService(
            sample.content,
            sample.filename,
            sample.mimetype
          )
        ]
      }
    });
  }

  components.push({
    type: "BODY",
    text: body,
    ...(variables.length
      ? {
          example: {
            body_text: [variables.map(key => PLACEHOLDER_EXAMPLES[key])]
          }
        }
      : {})
  });

  const { data } = await getMetaGraphApiClient().post(
    existing ? `/${existing.id}` : `/${whatsapp.metaWabaId}/message_templates`,
    existing
      ? { components }
      : {
          name,
          language: TEMPLATE_LANGUAGE,
          category: TEMPLATE_CATEGORY,
          components
        },
    withAuth(whatsapp.metaAccessToken)
  );

  return {
    id: (data?.id as string) || existing?.id || "",
    // Uma edicao devolve apenas success; o status real volta como PENDING.
    status: (data?.status as string) || "PENDING"
  };
};
