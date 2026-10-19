import AppError from "../../../errors/AppError";

jest.mock("../../TranslationServices/i18nService", () => ({
  _t: (key: string) => key
}));

import {
  extractVariables,
  normalizeVariableKey,
  validateScheduleVariables
} from "../variables";

describe("schedule variables", () => {
  it("normalizes custom field names", () => {
    expect(normalizeVariableKey(" Plano Atual ")).toBe("plano_atual");
    expect(normalizeVariableKey("Cidade/UF")).toBe("cidade_uf");
  });

  it("extracts unique mustache variables", () => {
    expect(
      extractVariables("Olá {{nome}} {{nome}} {{extra.plano_atual}}")
    ).toEqual(["nome", "extra.plano_atual"]);
  });

  it("accepts built-ins and company custom fields", () => {
    expect(() =>
      validateScheduleVariables("Olá {{apelido}} - {{extra.plano_atual}}", [
        "Plano Atual"
      ])
    ).not.toThrow();
  });

  it("rejects unknown variables", () => {
    expect(() => validateScheduleVariables("Olá {{desconhecida}}", [])).toThrow(
      AppError
    );
  });
});
