import QuickMessage from "../../models/QuickMessage";
import mcpConfig from "../../config/mcp";
import {
  McpAuthContext,
  validateScopes
} from "../../services/McpServices/OAuthService";
import { TOOL_SCOPES } from "../../services/McpServices/McpServerService";
import CreateService from "../../services/QuickMessageService/CreateService";
import FindService from "../../services/QuickMessageService/FindService";
import UpdateService from "../../services/QuickMessageService/UpdateService";
import { GetCompanySetting } from "../../helpers/CheckSettings";
import { getIO } from "../../libs/socket";
import {
  createQuickMessage,
  listQuickMessages,
  updateQuickMessage
} from "../../services/McpServices/McpQuickMessageService";

jest.mock("../../services/QuickMessageService/CreateService");
jest.mock("../../services/QuickMessageService/FindService");
jest.mock("../../services/QuickMessageService/UpdateService");
// A fábrica precisa já devolver uma promise: o i18nService chama
// GetCompanySetting no carregamento do módulo, antes de qualquer beforeEach.
jest.mock("../../helpers/CheckSettings", () => ({
  __esModule: true,
  GetCompanySetting: jest.fn().mockResolvedValue("individual"),
  default: jest.fn().mockResolvedValue("")
}));
jest.mock("../../libs/socket");

const findService = FindService as jest.MockedFunction<typeof FindService>;
const createService = CreateService as jest.MockedFunction<
  typeof CreateService
>;
const updateService = UpdateService as jest.MockedFunction<
  typeof UpdateService
>;
const getCompanySetting = GetCompanySetting as jest.MockedFunction<
  typeof GetCompanySetting
>;
const socket = getIO as jest.MockedFunction<typeof getIO>;

const auth: McpAuthContext = {
  grantId: "grant-1",
  userId: 7,
  companyId: 3,
  clientId: "ticketz_test",
  scopes: ["quick_messages:read", "quick_messages:write"],
  expiresAt: 0
};

const record = (fields: Partial<QuickMessage>): QuickMessage =>
  ({
    id: 1,
    shortcode: "especialidade",
    message: "Somos especializados em X.",
    companyId: 3,
    userId: 7,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...fields
  }) as QuickMessage;

beforeEach(() => {
  findService.mockResolvedValue([]);
  getCompanySetting.mockResolvedValue("individual");
  createService.mockImplementation(async data =>
    record({ id: 99, ...data } as Partial<QuickMessage>)
  );
  updateService.mockImplementation(async data =>
    record({ ...data } as Partial<QuickMessage>)
  );
  socket.mockReturnValue({ emit: jest.fn() } as never);
});

describe("MCP quick message writes", () => {
  it("strips the leading slash the attendant types in the chat", async () => {
    await createQuickMessage(auth, {
      shortcode: " /especialidade ",
      message: "  Somos especializados em X.  "
    });

    expect(createService).toHaveBeenCalledWith({
      shortcode: "especialidade",
      message: "Somos especializados em X.",
      companyId: 3,
      userId: 7
    });
  });

  it("rejects a shortcode with whitespace, which would break the / autocomplete", async () => {
    await expect(
      createQuickMessage(auth, {
        shortcode: "minha especialidade",
        message: "Somos especializados em X."
      })
    ).rejects.toMatchObject({
      message: "ERR_QUICKMESSAGE_SHORTCODE_HAS_WHITESPACE"
    });
    expect(createService).not.toHaveBeenCalled();
  });

  it("refuses a duplicated shortcode instead of creating a second one", async () => {
    // Não há UNIQUE no banco: sem esta checagem os dois atalhos coexistiriam.
    findService.mockResolvedValue([
      record({ id: 5, shortcode: "Especialidade" })
    ]);

    await expect(
      createQuickMessage(auth, {
        shortcode: "especialidade",
        message: "Outro texto qualquer."
      })
    ).rejects.toMatchObject({
      message: "ERR_QUICKMESSAGE_SHORTCODE_ALREADY_EXISTS"
    });
    expect(createService).not.toHaveBeenCalled();
  });

  it("only reaches quick replies the connected user can already see", async () => {
    findService.mockResolvedValue([record({ id: 5 })]);

    await expect(
      updateQuickMessage(auth, { quick_message_id: 404, message: "Novo texto" })
    ).rejects.toMatchObject({ message: "ERR_NO_QUICKMESSAGE_FOUND" });
    expect(updateService).not.toHaveBeenCalled();
  });

  it("keeps the original owner and the untouched field when updating", async () => {
    findService.mockResolvedValue([
      record({
        id: 5,
        shortcode: "horario",
        message: "Texto antigo",
        userId: 42
      })
    ]);

    await updateQuickMessage(auth, {
      quick_message_id: 5,
      message: "Texto novo"
    });

    // Sem userId no payload o UpdateService preserva o dono: editar pelo
    // ChatGPT não pode transferir a resposta rápida de outro atendente.
    expect(updateService).toHaveBeenCalledWith({
      id: 5,
      companyId: 3,
      shortcode: "horario",
      message: "Texto novo"
    });
  });

  it("refuses an update that changes nothing", async () => {
    findService.mockResolvedValue([record({ id: 5 })]);

    await expect(
      updateQuickMessage(auth, { quick_message_id: 5 })
    ).rejects.toMatchObject({ message: "ERR_QUICKMESSAGE_NOTHING_TO_UPDATE" });
  });

  it("reports the shortcode the attendant types and who owns it", async () => {
    findService.mockResolvedValue([
      record({ id: 5, shortcode: "horario", userId: 42 })
    ]);

    const result = await listQuickMessages(auth);

    expect(result.quickMessages[0]).toMatchObject({
      id: 5,
      usageHint: "/horario",
      ownerUserId: 42,
      ownedByConnectedUser: false
    });
    expect(result.visibility).toBe("individual");
  });
});

describe("MCP quick message authorization", () => {
  it("gates writes behind a scope that reads never grant", () => {
    expect(TOOL_SCOPES.list_quick_messages).toBe("quick_messages:read");
    expect(TOOL_SCOPES.create_quick_message).toBe("quick_messages:write");
    expect(TOOL_SCOPES.update_quick_message).toBe("quick_messages:write");
    expect(TOOL_SCOPES.list_conversations).toBe("conversations:read");
  });

  it("declares every registered tool scope as grantable", () => {
    // Um escopo declarado numa tool mas ausente do config viraria uma
    // ferramenta impossível de autorizar.
    Object.values(TOOL_SCOPES).forEach(scope => {
      expect(mcpConfig.scopes).toContain(scope);
    });
  });

  it("accepts the new scopes at the authorization endpoint", () => {
    expect(validateScopes("quick_messages:read quick_messages:write")).toEqual([
      "quick_messages:read",
      "quick_messages:write"
    ]);
    expect(() => validateScopes("quick_messages:delete")).toThrow(
      "invalid_scope"
    );
  });
});
