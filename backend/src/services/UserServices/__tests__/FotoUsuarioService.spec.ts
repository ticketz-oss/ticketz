import sharp from "sharp";
import { promises as fs } from "fs";
import path from "path";
import os from "os";
import User from "../../../models/User";
import upload from "../../../config/upload";
import {
  autorizarFotoUsuario,
  prepararFotoUsuario,
  salvarFotoUsuario
} from "../FotoUsuarioService";

jest.mock("../../../models/User", () => ({
  __esModule: true,
  default: { findByPk: jest.fn(), sequelize: { transaction: jest.fn() } }
}));
jest.mock("../../../config/upload", () => ({
  __esModule: true,
  default: { directory: "" }
}));
const buscar = User.findByPk as jest.Mock;
const imagem = () =>
  sharp({
    create: { width: 400, height: 300, channels: 3, background: "#fa802c" }
  })
    .png()
    .toBuffer();

describe("foto do usuário", () => {
  let pasta: string;
  beforeEach(async () => {
    pasta = await fs.mkdtemp(path.join(os.tmpdir(), "ticketz-foto-"));
    upload.directory = pasta;
    (User.sequelize.transaction as jest.Mock).mockImplementation(acao =>
      acao({ LOCK: { UPDATE: "UPDATE" } })
    );
  });
  afterEach(async () => {
    await fs.rm(pasta, { recursive: true, force: true });
  });

  it.each([
    [
      { id: 1, companyId: 1, profile: "user" },
      { id: 1, companyId: 1, profile: "user" }
    ],
    [
      { id: 2, companyId: 1 },
      { id: 1, companyId: 1, profile: "admin" }
    ]
  ])(
    "permite editar o próprio perfil e administrar a mesma empresa",
    async (usuario, solicitante) => {
      buscar.mockResolvedValueOnce(usuario).mockResolvedValueOnce(solicitante);
      await expect(
        autorizarFotoUsuario(usuario.id, solicitante.id)
      ).resolves.toEqual(usuario);
    }
  );

  it.each([
    [
      { id: 2, companyId: 1 },
      { id: 1, companyId: 1, profile: "user" }
    ],
    [
      { id: 2, companyId: 2 },
      { id: 1, companyId: 1, profile: "admin" }
    ]
  ])(
    "bloqueia outro atendente e outra empresa",
    async (usuario, solicitante) => {
      buscar.mockResolvedValueOnce(usuario).mockResolvedValueOnce(solicitante);
      await expect(
        autorizarFotoUsuario(usuario.id, solicitante.id)
      ).rejects.toMatchObject({ statusCode: 403 });
    }
  );

  it("gera uma foto WebP de 256 pixels", async () => {
    const foto = await prepararFotoUsuario(await imagem());
    const dados = await sharp(foto).metadata();
    expect(dados).toMatchObject({ format: "webp", width: 256, height: 256 });
    expect(dados.exif).toBeUndefined();
  });

  it.each([
    Buffer.from("not an image"),
    Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"></svg>'
    )
  ])("rejeita conteúdo inválido e SVG", async buffer => {
    await expect(prepararFotoUsuario(buffer)).rejects.toMatchObject({
      message: "ERR_INVALID_PROFILE_PHOTO"
    });
  });

  it("rejeita imagens acima de 16 megapixels", async () => {
    const grande = await sharp({
      create: { width: 4100, height: 4100, channels: 3, background: "white" }
    })
      .png()
      .toBuffer();
    await expect(prepararFotoUsuario(grande)).rejects.toMatchObject({
      statusCode: 400
    });
  });

  it("substitui o arquivo anterior depois de salvar e permite remover a foto", async () => {
    let arquivo = "avatars/1/abc.webp";
    await fs.mkdir(path.join(pasta, "avatars/1"), { recursive: true });
    await fs.writeFile(path.join(pasta, arquivo), "old");
    const usuario = {
      id: 1,
      companyId: 1,
      getDataValue: () => arquivo,
      update: jest.fn(async dados => {
        arquivo = dados.profilePicUrl;
      })
    };
    buscar.mockResolvedValue(usuario);
    await salvarFotoUsuario(usuario as unknown as User, await imagem());
    expect(arquivo).toMatch(/^avatars\/1\/[a-f0-9-]+\.webp$/);
    await expect(
      fs.stat(path.join(pasta, "avatars/1/abc.webp"))
    ).rejects.toMatchObject({ code: "ENOENT" });
    const salvo = arquivo;
    await salvarFotoUsuario(usuario as unknown as User, null);
    expect(arquivo).toBeNull();
    await expect(fs.stat(path.join(pasta, salvo))).rejects.toMatchObject({
      code: "ENOENT"
    });
  });

  it("limpa o novo arquivo quando o banco falha", async () => {
    const usuario = {
      id: 1,
      companyId: 1,
      getDataValue: () => null,
      update: jest.fn().mockRejectedValue(new Error("database unavailable"))
    };
    buscar.mockResolvedValue(usuario);
    await expect(
      salvarFotoUsuario(usuario as unknown as User, await imagem())
    ).rejects.toThrow("database unavailable");
    expect(await fs.readdir(path.join(pasta, "avatars/1"))).toEqual([]);
  });
});
