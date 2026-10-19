import Ticket from "../../../models/Ticket";
import Whatsapp from "../../../models/Whatsapp";
import ListTicketTemplatesService from "../ListTicketTemplatesService";
import PersistMetaOutboundMessageService from "../PersistMetaOutboundMessageService";
import SendMetaTemplateMessageService from "../SendMetaTemplateMessageService";
import SendTicketTemplateService, {
  renderTemplateBody
} from "../SendTicketTemplateService";

jest.mock("../ListTicketTemplatesService");
jest.mock("../PersistMetaOutboundMessageService", () => ({
  __esModule: true,
  default: jest.fn()
}));
jest.mock("../SendMetaTemplateMessageService");

const listTemplates = ListTicketTemplatesService as jest.MockedFunction<
  typeof ListTicketTemplatesService
>;
const sendTemplate = SendMetaTemplateMessageService as jest.MockedFunction<
  typeof SendMetaTemplateMessageService
>;
const persist = PersistMetaOutboundMessageService as jest.MockedFunction<
  typeof PersistMetaOutboundMessageService
>;
const findConnection = jest.spyOn(Whatsapp, "findByPk");

const ticket = {
  id: 7,
  whatsappId: 16,
  contact: { number: "+55 68 99999-0000" }
} as unknown as Ticket;

const approved = {
  name: "primeiro_contato",
  language: "pt_BR",
  category: "UTILITY",
  header: null,
  body: "Olá {{1}}, aqui é a {{2}}.",
  footer: null,
  variables: 2
};

beforeEach(() => {
  jest.clearAllMocks();
  findConnection.mockResolvedValue({
    id: 16,
    apiMode: "official",
    status: "CONNECTED"
  } as unknown as Whatsapp);
  listTemplates.mockResolvedValue([approved]);
  sendTemplate.mockResolvedValue("wamid.1");
});

describe("renderTemplateBody", () => {
  it("applies the parameters the way Meta delivers them", () => {
    expect(renderTemplateBody(approved.body, ["Ana", "Empresa Exemplo"])).toBe(
      "Olá Ana, aqui é a Empresa Exemplo."
    );
  });
});

describe("SendTicketTemplateService", () => {
  it("refuses disconnected connections before reading templates or sending", async () => {
    findConnection.mockResolvedValue({
      id: 16,
      apiMode: "official",
      status: "DISCONNECTED",
      metaAccessToken: "still-stored"
    } as unknown as Whatsapp);
    await expect(
      SendTicketTemplateService({ ticket, name: "primeiro_contato" })
    ).rejects.toMatchObject({ message: "ERR_WAPP_NOT_INITIALIZED" });
    expect(listTemplates).not.toHaveBeenCalled();
    expect(sendTemplate).not.toHaveBeenCalled();
    expect(persist).not.toHaveBeenCalled();
  });

  it("sends the template and stores what the customer received", async () => {
    await SendTicketTemplateService({
      ticket,
      name: "primeiro_contato",
      parameters: ["Ana", "Empresa Exemplo"],
      userId: 40
    });

    expect(sendTemplate).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "primeiro_contato",
        language: "pt_BR",
        to: "5568999990000",
        parameters: ["Ana", "Empresa Exemplo"]
      })
    );
    expect(persist).toHaveBeenCalledWith(
      expect.objectContaining({
        wamid: "wamid.1",
        body: "Olá Ana, aqui é a Empresa Exemplo."
      })
    );
  });

  it("refuses a template that is not approved on the WABA", async () => {
    listTemplates.mockResolvedValue([]);

    await expect(
      SendTicketTemplateService({ ticket, name: "inexistente" })
    ).rejects.toMatchObject({ message: "ERR_META_TEMPLATE_NOT_APPROVED" });

    expect(sendTemplate).not.toHaveBeenCalled();
  });

  it("refuses when the parameter count does not match the template", async () => {
    await expect(
      SendTicketTemplateService({
        ticket,
        name: "primeiro_contato",
        parameters: ["Ana"]
      })
    ).rejects.toMatchObject({ message: "ERR_META_TEMPLATE_INVALID" });

    expect(sendTemplate).not.toHaveBeenCalled();
  });

  it("refuses on a Baileys connection", async () => {
    findConnection.mockResolvedValue({
      id: 16,
      apiMode: "baileys"
    } as unknown as Whatsapp);

    await expect(
      SendTicketTemplateService({ ticket, name: "primeiro_contato" })
    ).rejects.toMatchObject({ message: "ERR_WAPP_OFFICIAL_MODE_ONLY" });
  });
});
