import { TEMPLATE_BODY_LIMIT, toTemplateBody } from "../MetaTemplateFormat";
const DEFAULT_STEPS = [
  { offset: 0, body: "Olá [nome], seu documento [referencia]." }
];
const reminderValues = (..._args: unknown[]) => ({
  nome: "Maria Silva",
  vencimento: "05/10/2026",
  valor: "R$ 189,90"
});

describe("toTemplateBody", () => {
  it("troca os marcadores do painel pelos posicionais da Meta", () => {
    const { text, variables } = toTemplateBody(
      "Olá, [nome]. Mensalidade de [valor] vence em [vencimento]."
    );

    expect(text).toBe("Olá, {{1}}. Mensalidade de {{2}} vence em {{3}}.");
    expect(variables).toEqual(["nome", "valor", "vencimento"]);
  });

  it("reaproveita o mesmo indice quando o marcador repete", () => {
    const { text, variables } = toTemplateBody(
      "[nome], confirmamos [valor]. Obrigado, [nome]."
    );

    expect(text).toBe("{{1}}, confirmamos {{2}}. Obrigado, {{1}}.");
    expect(variables).toEqual(["nome", "valor"]);
  });

  it("mantem o texto intacto quando nao ha marcador", () => {
    expect(toTemplateBody("Mensagem fixa.")).toEqual({
      text: "Mensagem fixa.",
      variables: []
    });
  });

  // Este e o contrato que liga as duas pontas: o parametro na posicao N do
  // envio tem que ser o valor do marcador que virou {{N}} na submissao.
  it("gera parametros na mesma ordem dos posicionais do template", () => {
    const body = "Vence [vencimento], valor [valor], titular [nome].";
    const { text, variables } = toTemplateBody(body);
    const values = reminderValues(
      "Maria Silva",
      { due: "2026-10-05", amount: 189.9 },
      "https://example.com/documento.pdf"
    );

    const parameters = variables.map(key => values[key]);

    expect(text).toBe("Vence {{1}}, valor {{2}}, titular {{3}}.");
    expect(parameters[0]).toBe("05/10/2026");
    expect(parameters[2]).toBe("Maria Silva");
    expect(parameters[1]).toContain("189,90");
  });

  it("cabe no limite de corpo da Meta com os textos padrao da regua", () => {
    DEFAULT_STEPS.forEach(step => {
      expect(toTemplateBody(step.body).text.length).toBeLessThanOrEqual(
        TEMPLATE_BODY_LIMIT
      );
    });
  });
});
