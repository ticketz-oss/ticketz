// Package exports use explicit .js paths even when compiled from TypeScript.
// eslint-disable-next-line import/no-unresolved
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
// eslint-disable-next-line import/no-unresolved
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import AppError from "../../errors/AppError";
import McpAudit from "../../models/McpAudit";
import Schedule from "../../models/Schedule";
import { McpAuthContext } from "../../services/McpServices/OAuthService";
import {
  MCP_SERVER_INSTRUCTIONS,
  createServer
} from "../../services/McpServices/McpServerService";
import CreateService from "../../services/ScheduleServices/CreateService";
import PreviewService from "../../services/ScheduleServices/PreviewService";
import ShowService from "../../services/ScheduleServices/ShowService";
import QuickMessageFindService from "../../services/QuickMessageService/FindService";
import { getTenantTimezone } from "../../services/McpServices/tenantTimezone";
import { getMcpWriteCapabilities } from "../../services/McpServices/McpDataService";
import { getIO } from "../../libs/socket";

jest.mock("../../services/ScheduleServices/CreateService");
jest.mock("../../services/ScheduleServices/PreviewService");
jest.mock("../../services/ScheduleServices/ShowService");
jest.mock("../../services/QuickMessageService/FindService");
jest.mock("../../services/McpServices/tenantTimezone");
jest.mock("../../libs/socket");
// A fábrica precisa já devolver uma promise: o i18nService chama
// GetCompanySetting no carregamento do módulo, antes de qualquer beforeEach.
jest.mock("../../helpers/CheckSettings", () => ({
  __esModule: true,
  GetCompanySetting: jest.fn().mockResolvedValue("individual"),
  default: jest.fn().mockResolvedValue("")
}));
jest.mock("../../services/TranslationServices/i18nService", () => ({
  __esModule: true,
  _t: (text: string) => text,
  i18n: { t: (text: string) => text },
  i18nReady: Promise.resolve(),
  getUniqueLanguages: jest.fn().mockResolvedValue([]),
  initializeI18n: jest.fn().mockResolvedValue(undefined),
  reloadTranslations: jest.fn().mockResolvedValue(undefined),
  updateDefaultLanguage: jest.fn()
}));

// O modelo não pode ser automocado: o database/index.ts registra a classe em
// sequelize.addModels, e um objeto simples quebra o carregamento do módulo.
let audit: jest.SpyInstance;
const createService = CreateService as jest.MockedFunction<
  typeof CreateService
>;
const previewService = PreviewService as jest.MockedFunction<
  typeof PreviewService
>;
const showService = ShowService as jest.MockedFunction<typeof ShowService>;
const findQuickMessages = QuickMessageFindService as jest.MockedFunction<
  typeof QuickMessageFindService
>;
const tenantTimezone = getTenantTimezone as jest.MockedFunction<
  typeof getTenantTimezone
>;
const socket = getIO as jest.MockedFunction<typeof getIO>;

const auth: McpAuthContext = {
  grantId: "grant-1",
  userId: 7,
  companyId: 3,
  clientId: "ticketz_test",
  scopes: ["conversations:read", "quick_messages:write", "schedules:write"],
  expiresAt: 0
};

const schedule = {
  id: 21,
  kind: "ONCE",
  status: "PENDENTE",
  active: true,
  audienceMode: "SELECTED",
  body: "Lembrete da sua consulta amanhã.",
  sendAt: new Date("2026-08-21T18:00:00.000Z"),
  sendTime: null,
  timezone: "America/Sao_Paulo",
  nextRunAt: new Date("2026-08-21T18:00:00.000Z"),
  totalRecipients: 1,
  commemorativeDate: null,
  audienceContacts: [],
  createdAt: new Date("2026-08-20T10:00:00.000Z"),
  updatedAt: new Date("2026-08-20T10:00:00.000Z")
} as unknown as Schedule;

const validArguments = {
  kind: "ONCE",
  body: "Lembrete da sua consulta amanhã.",
  audience_mode: "SELECTED",
  contact_ids: [11],
  send_at: "2026-08-21T15:00:00"
};

type ToolResult = {
  isError?: boolean;
  content?: Array<{ type: string; text?: string }>;
  structuredContent?: Record<string, unknown>;
};

let open: Array<() => Promise<void>> = [];

// Cliente real do SDK sobre transporte em memória: é o único jeito de provar
// como o erro chega ao ChatGPT, porque a serialização acontece dentro do SDK.
const connect = async (context: McpAuthContext = auth): Promise<Client> => {
  const server = createServer(context);
  const client = new Client({ name: "spec", version: "1.0.0" });
  const [clientTransport, serverTransport] =
    InMemoryTransport.createLinkedPair();
  await Promise.all([
    server.connect(serverTransport),
    client.connect(clientTransport)
  ]);
  // Listar antes de chamar ativa a validação de outputSchema no cliente, que é
  // o que um cliente MCP de verdade faz.
  await client.listTools();
  open.push(async () => {
    await client.close();
    await server.close();
  });
  return client;
};

const callTool = async (
  client: Client,
  name: string,
  args: Record<string, unknown>
): Promise<ToolResult> =>
  (await client.callTool({ name, arguments: args })) as ToolResult;

const confirmedArguments = async (
  client: Client,
  args: Record<string, unknown> = validArguments
): Promise<Record<string, unknown>> => {
  const result = await callTool(client, "preview_schedule", args);
  const structured = result.structuredContent as {
    result: { preview: { confirmationToken: string } };
  };
  return {
    ...args,
    confirmation_token: structured.result.preview.confirmationToken,
    confirmed: true
  };
};

beforeEach(() => {
  audit = jest.spyOn(McpAudit, "create") as unknown as jest.SpyInstance;
  audit.mockResolvedValue(undefined);
  tenantTimezone.mockResolvedValue("America/Sao_Paulo");
  createService.mockResolvedValue(schedule);
  previewService.mockResolvedValue({
    eligibleCount: 1,
    excludedCount: 0,
    missingVariables: {},
    estimatedDurationSeconds: 0,
    nextRunAt: new Date("2026-08-21T18:00:00.000Z"),
    renderedMessage: "Lembrete da sua consulta amanhã."
  });
  showService.mockResolvedValue(schedule);
  findQuickMessages.mockResolvedValue([]);
  socket.mockReturnValue({ to: () => ({ emit: jest.fn() }) } as never);
});

afterEach(async () => {
  await Promise.all(open.map(close => close()));
  open = [];
  jest.restoreAllMocks();
});

describe("MCP tool error contract", () => {
  it("returns the domain error code instead of [object Object]", async () => {
    // AppError não estende Error: sem normalização o SDK serializa com
    // String(erro) e o código desaparece.
    createService.mockRejectedValue(
      new AppError("ERR_SCHEDULE_INVALID_RECIPIENT", 400)
    );
    const client = await connect();

    const result = await callTool(
      client,
      "create_schedule",
      await confirmedArguments(client)
    );

    expect(result.isError).toBe(true);
    expect(result.content?.[0].text).toBe("ERR_SCHEDULE_INVALID_RECIPIENT");
    expect(result.content?.[0].text).not.toContain("[object Object]");
  });

  it("survives the client-side output schema validation", async () => {
    // O cliente do SDK valida structuredContent contra o outputSchema mesmo
    // quando isError é true, então o envelope precisa ficar sob "result".
    createService.mockRejectedValue(
      new AppError("ERR_SCHEDULE_NO_ELIGIBLE_RECIPIENTS", 400)
    );
    const client = await connect();

    const result = await callTool(
      client,
      "create_schedule",
      await confirmedArguments(client)
    );

    expect(result.structuredContent).toEqual({
      result: {
        error: { code: "ERR_SCHEDULE_NO_ELIGIBLE_RECIPIENTS", status: 400 }
      }
    });
  });

  it("carries the status code of a not-found error", async () => {
    showService.mockRejectedValue(new AppError("ERR_NO_SCHEDULE_FOUND", 404));
    const client = await connect();

    const result = await callTool(client, "update_schedule", {
      schedule_id: 900,
      body: "Texto novo do lembrete.",
      confirmation_token: "preview-token",
      confirmed: true
    });

    expect(result.content?.[0].text).toBe("ERR_NO_SCHEDULE_FOUND");
    expect(result.structuredContent).toEqual({
      result: { error: { code: "ERR_NO_SCHEDULE_FOUND", status: 404 } }
    });
  });

  it("fixes the contract for every tool, not only the schedule ones", async () => {
    // O mesmo AppError sai das respostas rápidas, então a correção precisa
    // estar no registerTool e não em cada tool.
    const client = await connect();

    const result = await callTool(client, "create_quick_message", {
      shortcode: "minha especialidade",
      message: "Somos especializados em X."
    });

    expect(result.isError).toBe(true);
    expect(result.content?.[0].text).toBe(
      "ERR_QUICKMESSAGE_SHORTCODE_HAS_WHITESPACE"
    );
  });

  it("still audits the failure with the status code and without the text", async () => {
    createService.mockRejectedValue(
      new AppError("ERR_SCHEDULE_INVALID_MESSAGE", 400)
    );
    const client = await connect();

    await callTool(client, "create_schedule", await confirmedArguments(client));

    expect(audit).toHaveBeenCalledWith(
      expect.objectContaining({
        tool: "create_schedule",
        status: "error_400",
        filters: expect.not.objectContaining({ body: expect.anything() })
      })
    );
  });

  it("keeps an unexpected error distinguishable from a domain error", async () => {
    // Um bug não tem código para o modelo agir: continua subindo e não pode
    // virar um código falso de domínio.
    createService.mockRejectedValue(new Error("coluna inexistente"));
    const client = await connect();

    const result = await callTool(
      client,
      "create_schedule",
      await confirmedArguments(client)
    );

    expect(result.isError).toBe(true);
    expect(result.content?.[0].text).toContain("coluna inexistente");
    expect(result.structuredContent).toBeUndefined();
    expect(audit).toHaveBeenCalledWith(
      expect.objectContaining({ status: "error_500" })
    );
  });

  it("still returns structured data when the tool succeeds", async () => {
    const client = await connect();

    const result = await callTool(
      client,
      "create_schedule",
      await confirmedArguments(client)
    );

    expect(result.isError).toBeFalsy();
    expect(result.structuredContent).toMatchObject({
      result: { schedule: { id: 21 }, coverage: { returnedRecords: 1 } }
    });
  });
});

describe("MCP tool listing", () => {
  it("reports write capabilities from the granted scopes", () => {
    expect(getMcpWriteCapabilities(["conversations:read"])).toEqual({
      writeActions: false,
      quickMessageWrites: false,
      scheduleWrites: false,
      schedulePreviewConfirmationRequired: false
    });
    expect(
      getMcpWriteCapabilities([
        "conversations:read",
        "quick_messages:write",
        "schedules:write"
      ])
    ).toEqual({
      writeActions: true,
      quickMessageWrites: true,
      scheduleWrites: true,
      schedulePreviewConfirmationRequired: true
    });
  });

  it("hides the write tools from a read-only connection", async () => {
    const client = await connect({
      ...auth,
      scopes: ["conversations:read"]
    });

    const names = (await client.listTools()).tools.map(tool => tool.name);

    expect(names).toContain("list_schedules");
    expect(names).toContain("preview_schedule");
    expect(names).not.toContain("create_schedule");
    expect(names).not.toContain("update_schedule");
    expect(names).not.toContain("create_quick_message");
  });

  it("exposes schedule writes only after the explicit write grant", async () => {
    const client = await connect();
    const tools = (await client.listTools()).tools;
    const create = tools.find(tool => tool.name === "create_schedule");
    const update = tools.find(tool => tool.name === "update_schedule");

    expect(create).toBeDefined();
    expect(update).toBeDefined();
    expect(create?.inputSchema).toMatchObject({
      required: expect.arrayContaining(["confirmation_token", "confirmed"])
    });
    expect(update?.inputSchema).toMatchObject({
      properties: expect.objectContaining({
        kind: expect.any(Object),
        commemorative_date_id: expect.any(Object),
        confirmation_token: expect.any(Object),
        confirmed: expect.any(Object)
      }),
      required: expect.arrayContaining([
        "schedule_id",
        "confirmation_token",
        "confirmed"
      ])
    });
  });
});

describe("MCP schedule guidance", () => {
  it("requires context, coupon facts, preview, and later confirmation", () => {
    expect(MCP_SERVER_INSTRUCTIONS).toContain(
      "first call get_espaco_whats_context"
    );
    expect(MCP_SERVER_INSTRUCTIONS).toContain(
      "require the coupon code, benefit, validity or conditions"
    );
    expect(MCP_SERVER_INSTRUCTIONS).toContain("{{primeiro_nome}}");
    expect(MCP_SERVER_INSTRUCTIONS).toContain(
      "never call a write tool in the same turn as its preview"
    );
  });

  it("keeps media and Live mode explicitly unavailable", () => {
    expect(MCP_SERVER_INSTRUCTIONS).toContain(
      "media, file attachments, or media URLs"
    );
    expect(MCP_SERVER_INSTRUCTIONS).toContain(
      "Voice or Live mode is not a supported app surface"
    );
  });
});
