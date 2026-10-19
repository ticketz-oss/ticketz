import { urlFotoUsuario } from "./urlFotoUsuario";
import { getBackendURL } from "../services/config";

jest.mock("../services/config", () => ({ getBackendURL: jest.fn() }));

beforeEach(() => getBackendURL.mockReturnValue("/backend"));

it("exibe a foto pelo tenant atual mesmo quando a API informa o domínio principal", () => {
  expect(
    urlFotoUsuario(
      "https://dev.espacowhats.com.br/backend/public/avatars/1/foto.webp"
    )
  ).toBe("/backend/public/avatars/1/foto.webp");
});

it("respeita o backend separado configurado para desenvolvimento local", () => {
  getBackendURL.mockReturnValue("http://localhost:8080/");
  expect(urlFotoUsuario("avatars/2/foto.webp")).toBe(
    "http://localhost:8080/public/avatars/2/foto.webp"
  );
});

it("mantém a versão da imagem e aceita o caminho público relativo", () => {
  expect(urlFotoUsuario("/public/avatars/1/foto.webp?v=2")).toBe(
    "/backend/public/avatars/1/foto.webp?v=2"
  );
});

it.each([
  "blob:https://teste.dev.espacowhats.com.br/previa",
  "data:image/png;base64,AAA",
  "https://example.com/foto.png"
])("preserva prévias e fotos externas: %s", foto =>
  expect(urlFotoUsuario(foto)).toBe(foto)
);

it.each([null, undefined, ""])(
  "usa iniciais quando não existe foto: %s",
  foto => {
    expect(urlFotoUsuario(foto)).toBeUndefined();
  }
);
