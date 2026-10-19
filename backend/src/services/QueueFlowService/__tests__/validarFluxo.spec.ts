import { validarFluxo } from "../validarFluxo";

const no = (id: string, kind = "menu") => ({
  id,
  kind,
  title: id,
  message: "Olá",
  isActive: true,
  position: { x: 0, y: 0 }
});
const fluxo = () => ({
  version: "v1",
  nodes: [no("inicio", "inicio"), no("menu"), no("resposta")],
  edges: [
    { source: "inicio", target: "menu" },
    { source: "menu", target: "resposta" }
  ]
});

describe("validarFluxo", () => {
  it("aceita um fluxo conectado com dados de mensagem preservados", () => {
    expect(validarFluxo(fluxo()).nodes[1].message).toBe("Olá");
  });
  it("rejeita ciclos e blocos desconectados", () => {
    expect(() =>
      validarFluxo({
        ...fluxo(),
        edges: [
          { source: "menu", target: "resposta" },
          { source: "resposta", target: "menu" }
        ]
      })
    ).toThrow("ERR_FLOW_DISCONNECTED");
  });
  it("rejeita dois pais para uma resposta", () => {
    expect(() =>
      validarFluxo({
        ...fluxo(),
        edges: [...fluxo().edges, { source: "inicio", target: "resposta" }]
      })
    ).toThrow("ERR_FLOW_CONNECTION");
  });
  it("rejeita duplicação de uma opção existente", () => {
    expect(() =>
      validarFluxo({
        ...fluxo(),
        nodes: fluxo().nodes.map((item, i) =>
          i ? { ...item, optionId: 12 } : item
        )
      })
    ).toThrow("ERR_FLOW_INVALID");
  });
  it("exige destino e impede saída de blocos terminais", () => {
    const entrada = fluxo();
    entrada.nodes[1].kind = "transferir";
    expect(() => validarFluxo(entrada)).toThrow("ERR_FLOW_CONNECTION");
    entrada.nodes[1].kind = "menu";
    entrada.nodes[2].kind = "transferir";
    expect(() => validarFluxo(entrada)).toThrow("ERR_FLOW_QUEUE_REQUIRED");
  });
  it("rejeita tipos sem executor e posições inválidas", () => {
    const entrada = fluxo();
    entrada.nodes[1].kind = "api";
    expect(() => validarFluxo(entrada)).toThrow("ERR_FLOW_INVALID");
    entrada.nodes[1].kind = "menu";
    entrada.nodes[1].position.x = Infinity;
    expect(() => validarFluxo(entrada)).toThrow("ERR_FLOW_INVALID");
  });
});
