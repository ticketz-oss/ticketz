import { promises as fs } from "fs";
import path from "path";
import os from "os";
import upload from "../../config/upload";
import { storeBrandingFile, removerArquivoBranding } from "../brandingFiles";

jest.mock("../../utils/logger", () => ({ logger: { warn: jest.fn() } }));
jest.mock("../../config/upload", () => ({
  __esModule: true,
  default: { directory: "" }
}));

describe("armazenamento das imagens de white label", () => {
  let pasta: string;
  beforeEach(async () => {
    pasta = await fs.mkdtemp(path.join(os.tmpdir(), "ticketz-branding-"));
    upload.directory = pasta;
  });
  afterEach(async () => {
    await fs.rm(pasta, { recursive: true, force: true });
  });
  it.each([
    "appLogoLight",
    "appLogoDark",
    "appLogoFavicon",
    "loginSidePanelImage",
    "loginBackgroundContent"
  ])("preserva a imagem de %s até a substituição ser confirmada", async key => {
    const criar = async (nome: string, conteudo: string) => {
      await fs.writeFile(path.join(pasta, nome), conteudo);
      return storeBrandingFile(1, key, {
        filename: nome,
        originalname: "foto.png",
        path: path.join(pasta, nome)
      } as Express.Multer.File);
    };
    const antigo = await criar("temp1.png", "old");
    const novo = await criar("temp2.png", "new");
    expect(antigo).not.toEqual(novo);
    expect(await fs.readFile(path.join(pasta, antigo), "utf8")).toEqual("old");
    await removerArquivoBranding(1, key, antigo);
    await expect(fs.stat(path.join(pasta, antigo))).rejects.toMatchObject({
      code: "ENOENT"
    });
    expect(await fs.readFile(path.join(pasta, novo), "utf8")).toEqual("new");
    expect(await fs.readdir(path.dirname(path.join(pasta, novo)))).toHaveLength(
      1
    );
  });
  it("não remove imagens de outro tenant, de outra chave ou fora da pasta", async () => {
    await fs.mkdir(path.join(pasta, "branding/2"), { recursive: true });
    await fs.writeFile(
      path.join(pasta, "branding/2/logo_light-abc.png"),
      "other"
    );
    await fs.writeFile(path.join(pasta, "attachment.png"), "message");
    await removerArquivoBranding(
      1,
      "appLogoLight",
      "branding/2/logo_light-abc.png"
    );
    await removerArquivoBranding(
      2,
      "appLogoDark",
      "branding/2/logo_light-abc.png"
    );
    await removerArquivoBranding(1, "appLogoLight", "../attachment.png");
    await removerArquivoBranding(1, "appLogoLight", "attachment.png");
    expect(
      await fs.readFile(
        path.join(pasta, "branding/2/logo_light-abc.png"),
        "utf8"
      )
    ).toEqual("other");
    expect(
      await fs.readFile(path.join(pasta, "attachment.png"), "utf8")
    ).toEqual("message");
  });
});
