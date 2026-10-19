import { randomUUID, createHash } from "crypto";
import Company from "../../models/Company";
import AppError from "../../errors/AppError";
import { AgentFilters, agentCatalog, queryAgentData } from "./AgentDataService";
import { getPublicHelp } from "./AgentDocumentService";
import { resourceFor, moduleFor } from "./AgentCatalog";
import { appendCapabilitySource, readCapability } from "./AgentSessionService";
import { assertModule, auditAgent } from "./AgentPolicyService";

export const AGENT_TOOL_NAMES = [
  "get_agent_context",
  "query_tenant_records",
  "get_tenant_metrics",
  "read_module_documentation",
  "read_system_help",
  "read_business_context"
];
type ToolResult = {
  observedAt: string;
  records?: Record<string, unknown>[];
  total?: number;
  distribution?: unknown;
  coverage?: unknown;
  [key: string]: unknown;
};
export const evidenceDigest = (result: ToolResult) =>
  createHash("sha256")
    .update(
      JSON.stringify({
        records: result.records,
        total: result.total,
        distribution: result.distribution,
        coverage: result.coverage
      })
    )
    .digest("hex");
export const executeAgentTool = async (token: string, body: unknown) => {
  const input = body as { tool: string; arguments: Record<string, unknown> };
  if (
    !input ||
    !AGENT_TOOL_NAMES.includes(input.tool) ||
    !input.arguments ||
    typeof input.arguments !== "object" ||
    Array.isArray(input.arguments)
  )
    throw new AppError("ERR_AGENT_INVALID_REQUEST", 400);
  const { actor } = await readCapability(token);
  let result: ToolResult;
  let resource = "";
  let module = "";
  const args = input.arguments;
  if (
    Object.keys(args).some(
      key =>
        ![
          "resource",
          "search",
          "id",
          "ticketId",
          "chatId",
          "status",
          "dateFrom",
          "dateTo",
          "cursor",
          "limit",
          "module",
          "offset"
        ].includes(key)
    )
  )
    throw new AppError("ERR_AGENT_INVALID_REQUEST", 400);
  Object.entries(args).forEach(([key, value]) => {
    if (["ticketId", "chatId", "limit", "offset"].includes(key)) {
      if (
        !Number.isSafeInteger(value) ||
        Number(value) < (key === "offset" ? 0 : 1) ||
        Number(value) > (key === "limit" ? 20 : 2147483647)
      )
        throw new AppError("ERR_AGENT_INVALID_REQUEST", 400);
    } else if (key === "id") {
      if (
        !["string", "number"].includes(typeof value) ||
        String(value).length > 128 ||
        (typeof value === "number" &&
          (!Number.isSafeInteger(value) || value < 1))
      )
        throw new AppError("ERR_AGENT_INVALID_REQUEST", 400);
    } else if (
      typeof value !== "string" ||
      value.length > (key === "cursor" ? 2000 : key === "search" ? 200 : 128)
    )
      throw new AppError("ERR_AGENT_INVALID_REQUEST", 400);
  });
  try {
    switch (input.tool) {
      case "get_agent_context": {
        const company = await Company.findByPk(actor.companyId, {
          attributes: ["id", "name", "slug", "language", "timezone"]
        });
        result = {
          company,
          businessContext: actor.policy.businessContext.slice(0, 10000),
          businessContextTruncated: actor.policy.businessContext.length > 10000,
          modules: agentCatalog(actor),
          observedAt: new Date().toISOString(),
          readOnly: true
        };
        resource = "business";
        module = "negocio";
        break;
      }
      case "read_business_context": {
        const offset = Number(args.offset || 0);
        const text = actor.policy.businessContext;
        result = {
          text: text.slice(offset, offset + 6000),
          offset,
          totalCharacters: text.length,
          nextOffset: offset + 6000 < text.length ? offset + 6000 : null,
          observedAt: new Date().toISOString()
        };
        resource = "business";
        module = "negocio";
        break;
      }
      case "query_tenant_records":
      case "get_tenant_metrics": {
        resource = String(args.resource || "");
        module = resourceFor(resource)?.module.key || "";
        result = await queryAgentData(actor, args as AgentFilters, {
          metrics: input.tool === "get_tenant_metrics"
        });
        break;
      }
      case "read_module_documentation": {
        module = String(args.module || "");
        const descriptor = assertModule(actor, module);
        result = {
          module,
          title: descriptor.title,
          description: descriptor.description,
          usage: descriptor.usage,
          resources: descriptor.resources.map(item => ({
            key: item.key,
            table: item.table,
            fields: item.fields
          })),
          observedAt: new Date().toISOString(),
          note: "Consulte query_tenant_records para conteúdo atual com as mesmas permissões. Arquivos completos do tenant não são entregues à IA."
        };
        resource = "documentation";
        break;
      }
      case "read_system_help": {
        const help = await getPublicHelp();
        let records = help.records;
        if (args.id !== undefined)
          records = records.filter(item => String(item.id) === String(args.id));
        if (args.search)
          records = records.filter(item =>
            `${item.title} ${item.description} ${item.content}`
              .toLowerCase()
              .includes(String(args.search).toLowerCase())
          );
        const total = records.length;
        const offset = Number(args.offset || 0);
        const readingDocument = args.id !== undefined;
        const limit = Number(args.limit || 10);
        const selected = readingDocument
          ? records
          : records.slice(offset, offset + limit);
        result = {
          ...help,
          records: selected.map(item => ({
            ...item,
            content: item.content?.slice(
              readingDocument ? offset : 0,
              (readingDocument ? offset : 0) + 2000
            ),
            totalCharacters: item.content?.length || 0
          })),
          nextOffset: readingDocument
            ? (records[0]?.content?.length || 0) > offset + 2000
              ? offset + 2000
              : null
            : offset + selected.length < total
              ? offset + selected.length
              : null,
          coverage: {
            total,
            returned: selected.length,
            complete: !readingDocument && offset === 0 && total <= limit,
            textTruncatedAt: 2000
          }
        };
        resource = "system-help";
        module = "ajuda";
        break;
      }
    }
    const sourceId = randomUUID();
    await appendCapabilitySource(token, {
      id: sourceId,
      resource,
      module,
      observedAt: result.observedAt,
      digest: evidenceDigest(result),
      metrics: input.tool === "get_tenant_metrics",
      filters: args
    });
    await auditAgent(
      actor,
      "tool_read",
      "success",
      module,
      result.records?.length || 0,
      actor.policy.revision
    );
    return { ...result, sourceId };
  } catch (error) {
    await auditAgent(
      actor,
      "tool_read",
      "denied",
      module || moduleFor(String(args.module))?.key,
      0,
      actor.policy.revision
    );
    if (error instanceof AppError) throw error;
    throw new AppError("ERR_AGENT_QUERY_FAILED", 503);
  }
};
