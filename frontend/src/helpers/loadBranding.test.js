import { loadBranding } from "./loadBranding";

jest.mock("../services/config", () => ({ getBackendURL: () => "/backend" }));

const criarAplicadores = () =>
  Object.fromEntries(
    [
      "setPrimaryColorLight",
      "setPrimaryColorDark",
      "setAppLogoLight",
      "setAppLogoDark",
      "setAppLogoFavicon",
      "setAppName"
    ].map(chave => [chave, jest.fn()])
  );

it("preserva cores e arquivos personalizados da empresa", async () => {
  const aplicadores = criarAplicadores();
  const valores = {
    primaryColorLight: "#1450AF",
    primaryColorDark: "#68AAFF",
    appLogoLight: "empresa.png",
    appLogoDark: "empresa-dark.png",
    appLogoFavicon: "icone.png",
    appName: "Minha empresa"
  };
  await loadBranding(aplicadores, async chave => valores[chave]);
  expect(aplicadores.setPrimaryColorLight).toHaveBeenCalledWith("#1450AF");
  expect(aplicadores.setPrimaryColorDark).toHaveBeenCalledWith("#68AAFF");
  expect(aplicadores.setAppLogoLight).toHaveBeenCalledWith(
    "/backend/public/empresa.png"
  );
  expect(aplicadores.setAppLogoDark).toHaveBeenCalledWith(
    "/backend/public/empresa-dark.png"
  );
  expect(aplicadores.setAppLogoFavicon).toHaveBeenCalledWith(
    "/backend/public/icone.png"
  );
  expect(aplicadores.setAppName).toHaveBeenCalledWith("Minha empresa");
});

it("usa a identidade padrão somente quando a empresa não tem personalização", async () => {
  const aplicadores = criarAplicadores();
  await loadBranding(aplicadores, async () => "");
  expect(aplicadores.setPrimaryColorLight).toHaveBeenCalledWith("#C2480A");
  expect(aplicadores.setPrimaryColorDark).toHaveBeenCalledWith("#FF8A43");
  expect(aplicadores.setAppLogoLight).toHaveBeenCalledWith(
    "/branding/logo-light.png"
  );
});
