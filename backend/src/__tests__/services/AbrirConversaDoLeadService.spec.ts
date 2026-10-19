import AbrirConversaDoLeadService from "../../services/ProspeccaoServices/AbrirConversaDoLeadService";
import ProspeccaoLead from "../../models/ProspeccaoLead";
import ContactCustomField from "../../models/ContactCustomField";
import Ticket from "../../models/Ticket";
import { CheckNumberAndCreateContact } from "../../services/WbotServices/CheckNumber";
import CreateTicketService from "../../services/TicketServices/CreateTicketService";
import AppError from "../../errors/AppError";

// Sem isto o automock dos models remove os decorators e o addModels do
// database quebra ao carregar a cadeia de imports do serviço.
jest.mock("../../database", () => ({
  __esModule: true,
  default: { transaction: jest.fn() }
}));
jest.mock("../../models/ProspeccaoLead");
jest.mock("../../models/ContactCustomField");
jest.mock("../../models/Ticket");
jest.mock("../../services/WbotServices/CheckNumber", () => ({
  CheckNumberAndCreateContact: jest.fn()
}));
jest.mock("../../services/TicketServices/CreateTicketService");

const leadFalso = (campos: Record<string, unknown> = {}) => ({
  id: 5,
  companyId: 1,
  telefone: "5568999884999",
  nome: "Pimenta's House",
  endereco: "Avenida Oeste, 782",
  instagramHandle: "pimentas",
  categoria: "Hamburgueria",
  rascunho: "Oi! Vi que vocês...",
  abertoEm: null,
  update: jest.fn(),
  ...campos
});

describe("AbrirConversaDoLeadService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (ContactCustomField.findAll as jest.Mock).mockResolvedValue([]);
    (ContactCustomField.bulkCreate as jest.Mock).mockResolvedValue([]);
    (CreateTicketService as jest.Mock).mockResolvedValue({
      id: 1424,
      uuid: "uuid-do-ticket"
    });
    (CheckNumberAndCreateContact as jest.Mock).mockResolvedValue({
      id: 90,
      number: "5568999884999"
    });
  });

  // A regressão que quebrou o envio: criar o contato sem conferir o número no
  // WhatsApp abre o ticket mas derruba o envio com ERR_WAPP_CONTACT_NOT_FOUND,
  // porque o contato fica sem mapeamento de LID.
  it("cria o contato pelo caminho que confere o número no WhatsApp", async () => {
    const lead = leadFalso();
    (ProspeccaoLead.findOne as jest.Mock).mockResolvedValue(lead);

    await AbrirConversaDoLeadService({
      leadId: 5,
      companyId: 1,
      userId: 3,
      rascunho: "Mensagem revisada"
    });

    expect(CheckNumberAndCreateContact).toHaveBeenCalledWith(
      "5568999884999",
      "Pimenta's House",
      1
    );
  });

  it("devolve o ticket para a tela levar a pessoa à conversa", async () => {
    (ProspeccaoLead.findOne as jest.Mock).mockResolvedValue(leadFalso());

    const resultado = await AbrirConversaDoLeadService({
      leadId: 5,
      companyId: 1,
      userId: 3,
      rascunho: "Mensagem revisada"
    });

    expect(resultado).toEqual({
      ticketId: 1424,
      ticketUuid: "uuid-do-ticket",
      contactId: 90,
      rascunho: "Mensagem revisada"
    });
  });

  it("guarda endereço, Instagram e categoria como informação adicional", async () => {
    (ProspeccaoLead.findOne as jest.Mock).mockResolvedValue(leadFalso());

    await AbrirConversaDoLeadService({ leadId: 5, companyId: 1, userId: 3 });

    const gravados = (ContactCustomField.bulkCreate as jest.Mock).mock
      .calls[0][0];
    expect(gravados).toEqual([
      { name: "Localização", value: "Avenida Oeste, 782", contactId: 90 },
      {
        name: "Instagram",
        value: "https://instagram.com/pimentas",
        contactId: 90
      },
      { name: "Categoria", value: "Hamburgueria", contactId: 90 }
    ]);
  });

  it("não duplica informação adicional que o contato já tinha", async () => {
    (ProspeccaoLead.findOne as jest.Mock).mockResolvedValue(leadFalso());
    (ContactCustomField.findAll as jest.Mock).mockResolvedValue([
      { name: "Localização" },
      { name: "Instagram" }
    ]);

    await AbrirConversaDoLeadService({ leadId: 5, companyId: 1, userId: 3 });

    const gravados = (ContactCustomField.bulkCreate as jest.Mock).mock
      .calls[0][0];
    expect(gravados).toEqual([
      { name: "Categoria", value: "Hamburgueria", contactId: 90 }
    ]);
  });

  // O AppError deste projeto não estende Error, então `toThrow` não o
  // reconhece: a checagem é pela forma do objeto rejeitado, que de quebra
  // fixa o status que a tela recebe.
  it("recusa lead sem telefone antes de tocar no WhatsApp", async () => {
    (ProspeccaoLead.findOne as jest.Mock).mockResolvedValue(
      leadFalso({ telefone: null })
    );

    await expect(
      AbrirConversaDoLeadService({ leadId: 5, companyId: 1, userId: 3 })
    ).rejects.toMatchObject({
      message: "ERR_PROSPECCAO_LEAD_SEM_TELEFONE",
      statusCode: 400
    });
    expect(CheckNumberAndCreateContact).not.toHaveBeenCalled();
  });

  it("avisa quando não há conexão de WhatsApp disponível", async () => {
    (ProspeccaoLead.findOne as jest.Mock).mockResolvedValue(leadFalso());
    (CheckNumberAndCreateContact as jest.Mock).mockResolvedValue(null);

    await expect(
      AbrirConversaDoLeadService({ leadId: 5, companyId: 1, userId: 3 })
    ).rejects.toMatchObject({
      message: "ERR_PROSPECCAO_SEM_CONEXAO",
      statusCode: 503
    });
  });

  // CreateTicketService recusa quando o contato já tem conversa aberta com
  // outra pessoa; cair na conversa existente é melhor do que falhar.
  it("reaproveita a conversa aberta quando o ticket não pode ser criado", async () => {
    (ProspeccaoLead.findOne as jest.Mock).mockResolvedValue(leadFalso());
    (CreateTicketService as jest.Mock).mockRejectedValue(
      new AppError("ERR_OTHER_OPEN_TICKET")
    );
    (Ticket.findOne as jest.Mock).mockResolvedValue({
      id: 777,
      uuid: "uuid-existente"
    });

    const resultado = await AbrirConversaDoLeadService({
      leadId: 5,
      companyId: 1,
      userId: 3
    });

    expect(resultado.ticketId).toBe(777);
    expect(resultado.ticketUuid).toBe("uuid-existente");
  });
});
