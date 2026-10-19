import AppError from "../../../errors/AppError";
import { buildMetaInteractive } from "../SendMetaInteractiveMessageService";

describe("buildMetaInteractive", () => {
  it("usa botoes de resposta para ate tres opcoes curtas", () => {
    expect(
      buildMetaInteractive("Como podemos ajudar?", [
        { id: "1", title: "Agendamento" },
        { id: "2", title: "Boletos" },
        { id: "3", title: "Cadastro" }
      ])
    ).toEqual({
      type: "button",
      body: { text: "Como podemos ajudar?" },
      action: {
        buttons: [
          { type: "reply", reply: { id: "1", title: "Agendamento" } },
          { type: "reply", reply: { id: "2", title: "Boletos" } },
          { type: "reply", reply: { id: "3", title: "Cadastro" } }
        ]
      }
    });
  });

  it("usa lista nativa para o menu de setores da Empresa Exemplo", () => {
    const options = [
      "AGENDAMENTO",
      "ATENDIMENTO GERAL",
      "BOLETOS",
      "CADASTRO",
      "CANCELAMENTO",
      "COMERCIAL",
      "EVENTOS",
      "NOTAS FISCAIS",
      "RASTREAMENTO E MONITORAMENTO",
      "REGULAGEM"
    ].map((title, index) => ({ id: String(index + 1), title }));

    const interactive = buildMetaInteractive("Escolha o setor", options) as {
      type: string;
      action: { sections: { rows: { id: string; title: string }[] }[] };
    };

    expect(interactive.type).toBe("list");
    expect(interactive.action.sections[0].rows).toHaveLength(10);
    expect(interactive.action.sections[0].rows[8]).toMatchObject({ id: "9" });
    expect(
      interactive.action.sections[0].rows[8].title.length
    ).toBeLessThanOrEqual(24);
  });

  it("recusa mais itens do que a Cloud API permite", () => {
    const options = Array.from({ length: 11 }, (_, index) => ({
      id: String(index + 1),
      title: `Opção ${index + 1}`
    }));

    expect(() => buildMetaInteractive("Escolha", options)).toThrow(AppError);
  });
});
