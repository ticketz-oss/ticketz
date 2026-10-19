import {
  conectarBlocos,
  filhosDe,
  organizarBlocos,
  podeConectar,
  problemasFluxo,
  removerBloco
} from "./modeloFluxo";

const no = (id, kind = "menu") => ({
  id,
  kind,
  title: id,
  isActive: true,
  position: { x: 0, y: 0 }
});
const fluxo = () => ({
  nodes: [
    no("inicio", "inicio"),
    no("vendas"),
    no("financeiro"),
    no("humano", "humano")
  ],
  edges: [
    { source: "inicio", target: "vendas" },
    { source: "inicio", target: "financeiro" },
    { source: "vendas", target: "humano" }
  ]
});

test("reconecta um bloco mantendo os demais caminhos e sua identidade", () => {
  const resultado = conectarBlocos(fluxo(), "financeiro", "humano");
  expect(filhosDe(resultado, "vendas")).toHaveLength(0);
  expect(filhosDe(resultado, "financeiro").map(item => item.id)).toEqual([
    "humano"
  ]);
  expect(resultado.nodes).toEqual(fluxo().nodes);
});
test("impede ciclos, ligação ao início e saída de um bloco terminal", () => {
  expect(podeConectar(fluxo(), "humano", "inicio")).toBe(false);
  expect(podeConectar(fluxo(), "humano", "financeiro")).toBe(false);
  const ramificado = {
    ...fluxo(),
    nodes: fluxo().nodes.map(item => ({
      ...item,
      kind: item.id === "inicio" ? "inicio" : "menu"
    }))
  };
  expect(podeConectar(ramificado, "humano", "vendas")).toBe(false);
});
test("excluir preserva os descendentes e exige reconexão", () => {
  const resultado = removerBloco(fluxo(), "vendas");
  expect(resultado.nodes.some(item => item.id === "humano")).toBe(true);
  expect(problemasFluxo(resultado).map(item => item.id)).toContain("humano");
});
test("organizar distribui blocos mantendo mensagens e ligações", () => {
  const original = fluxo();
  const resultado = organizarBlocos(original);
  expect(resultado.edges).toEqual(original.edges);
  expect(
    new Set(
      resultado.nodes.map(item => `${item.position.x},${item.position.y}`)
    ).size
  ).toBe(4);
  expect(
    resultado.nodes.find(item => item.id === "humano").position.x
  ).toBeGreaterThan(
    resultado.nodes.find(item => item.id === "vendas").position.x
  );
});
