import { Fluxo } from "../validarFluxo";
import { Op } from "sequelize";
import publicarFluxo from "../publicarFluxo";
import { carregarRegistros, versaoFluxo } from "../carregarFluxo";
import Queue from "../../../models/Queue";
import QueueOption from "../../../models/QueueOption";
import Ticket from "../../../models/Ticket";

jest.mock("../../../database", () => ({
  __esModule: true,
  default: {
    transaction: jest.fn(async callback => callback({ id: "transaction" }))
  }
}));
jest.mock("../../../models/Queue", () => ({
  __esModule: true,
  default: { count: jest.fn() }
}));
jest.mock("../../../models/QueueOption", () => ({
  __esModule: true,
  default: { create: jest.fn(), destroy: jest.fn() }
}));
jest.mock("../../../models/Ticket", () => ({
  __esModule: true,
  default: { count: jest.fn() }
}));
jest.mock("../carregarFluxo", () => ({
  __esModule: true,
  default: jest.fn(async () => ({ version: "v2" })),
  carregarRegistros: jest.fn(),
  versaoFluxo: jest.fn()
}));

const inicio: Fluxo["nodes"][number] = {
  isActive: true,
  id: "inicio",
  kind: "inicio",
  title: "Suporte",
  message: "Olá",
  position: { x: 10, y: 20 }
};
const criarEntrada = (): Fluxo => ({
  version: "v1",
  nodes: [
    inicio,
    {
      isActive: true,
      id: "9",
      optionId: 9,
      kind: "menu",
      title: "Comercial",
      message: "Como ajudar?",
      position: { x: 300, y: 20 }
    },
    {
      isActive: true,
      id: "novo",
      kind: "humano",
      title: "Falar com a equipe",
      message: "Aguarde",
      position: { x: 600, y: 20 }
    }
  ],
  edges: [
    { source: "inicio", target: "9" },
    { source: "9", target: "novo" }
  ]
});
const atualizarFila = jest.fn();
const atualizarOpcao = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  (carregarRegistros as jest.Mock).mockResolvedValue({
    fila: { id: 2, update: atualizarFila },
    opcoes: [{ id: 9, update: atualizarOpcao }]
  });
  (versaoFluxo as jest.Mock).mockReturnValue("v1");
  (Queue.count as jest.Mock).mockResolvedValue(0);
  (Ticket.count as jest.Mock).mockResolvedValue(0);
  atualizarOpcao.mockResolvedValue({ id: 9 });
  (QueueOption.create as jest.Mock).mockResolvedValue({ id: 20 });
});

describe("publicarFluxo", () => {
  it("mantém ids existentes, conecta ids novos e persiste posição e saudação", async () => {
    const resultado = await publicarFluxo(2, 7, criarEntrada());
    expect(resultado.idMap).toEqual({ "9": 9, novo: 20 });
    expect(atualizarOpcao).toHaveBeenCalledWith(
      expect.objectContaining({ parentId: null, queueId: 2, option: "1" }),
      expect.objectContaining({ transaction: expect.anything() })
    );
    expect(atualizarOpcao.mock.calls[0][0]).not.toHaveProperty("mediaPath");
    expect(QueueOption.create).toHaveBeenCalledWith(
      expect.objectContaining({ parentId: 9, exitChatbot: true, option: "1" }),
      expect.anything()
    );
    expect(atualizarFila).toHaveBeenCalledWith(
      expect.objectContaining({
        greetingMessage: "Olá",
        flowLayout: expect.objectContaining({
          "20": { kind: "humano", position: { x: 600, y: 20 } }
        })
      }),
      expect.anything()
    );
  });
  it("não altera registros quando a versão está desatualizada", async () => {
    (versaoFluxo as jest.Mock).mockReturnValue("alterado");
    await expect(publicarFluxo(2, 7, criarEntrada())).rejects.toMatchObject({
      message: "ERR_FLOW_CONFLICT"
    });
    expect(atualizarOpcao).not.toHaveBeenCalled();
  });
  it("rejeita opções pertencentes a outro fluxo", async () => {
    const entrada = criarEntrada();
    entrada.nodes[1].optionId = 999;
    await expect(publicarFluxo(2, 7, entrada)).rejects.toMatchObject({
      message: "ERR_NO_PERMISSION"
    });
  });
  it("rejeita destinos de outra empresa", async () => {
    const entrada = criarEntrada();
    entrada.nodes[2] = {
      ...entrada.nodes[2],
      kind: "transferir",
      forwardQueueId: 44
    } as (typeof entrada.nodes)[2];
    await expect(publicarFluxo(2, 7, entrada)).rejects.toMatchObject({
      message: "ERR_FLOW_QUEUE_REQUIRED"
    });
    expect(Queue.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: { [Op.in]: [44] }, companyId: 7 }
      })
    );
  });
  it("impede excluir um bloco utilizado em atendimento ativo", async () => {
    (Ticket.count as jest.Mock).mockResolvedValue(1);
    await expect(
      publicarFluxo(2, 7, { version: "v1", nodes: [inicio], edges: [] })
    ).rejects.toMatchObject({ message: "ERR_FLOW_IN_USE" });
    expect(QueueOption.destroy).not.toHaveBeenCalled();
  });
  it("renumera irmãos ativos e mantém os inativos sem tecla", async () => {
    const entrada = criarEntrada();
    entrada.nodes[1] = {
      ...entrada.nodes[1],
      isActive: false
    } as (typeof entrada.nodes)[1];
    entrada.edges[1] = { source: "inicio", target: "novo" };
    await publicarFluxo(2, 7, entrada);
    expect(atualizarOpcao).toHaveBeenCalledWith(
      expect.objectContaining({ option: null, order: 0 }),
      expect.anything()
    );
    expect(QueueOption.create).toHaveBeenCalledWith(
      expect.objectContaining({ option: "1", order: 1 }),
      expect.anything()
    );
  });
});
