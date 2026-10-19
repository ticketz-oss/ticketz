import express from "express";
import request from "supertest";
import sharp from "sharp";
import { receber, salvar } from "../FotoUsuarioController";
import { salvarFotoUsuario } from "../../services/UserServices/FotoUsuarioService";

jest.mock("../../services/UserServices/FotoUsuarioService", () => ({
  autorizarFotoUsuario: jest.fn(),
  salvarFotoUsuario: jest.fn()
}));
jest.mock("../../services/UserServices/ShowUserService", () => ({
  __esModule: true,
  default: jest.fn().mockResolvedValue({ id: 1, name: "Ana", companyId: 1 })
}));
jest.mock("../../helpers/SerializeUser", () => ({
  SerializeUser: jest
    .fn()
    .mockResolvedValue({ id: 1, name: "Ana", profilePicUrl: "/foto.webp" })
}));
jest.mock("../../libs/socket", () => ({
  getIO: () => ({ to: () => ({ emit: jest.fn() }) })
}));

const app = express();
app.use((req, res, next) => {
  req.user = { id: "1", companyId: 1, profile: "user", isSuper: false };
  res.locals.usuarioFoto = { id: 1, companyId: 1 };
  next();
});
app.post("/photo", receber, (req, res, next) => {
  salvar(req, res).catch(next);
});
app.delete("/photo", (req, res, next) => {
  salvar(req, res).catch(next);
});
app.use((erro, _req, res, _next) => {
  res.status(erro.statusCode || 500).json({ error: erro.message });
});

describe("recebimento da foto", () => {
  it("rejeita upload ausente", async () => {
    await request(app).post("/photo").expect(400);
    expect(salvarFotoUsuario).not.toHaveBeenCalled();
  });
  it("rejeita formato proibido e arquivos acima do limite", async () => {
    await request(app)
      .post("/photo")
      .attach("photo", Buffer.from("svg"), {
        filename: "photo.svg",
        contentType: "image/svg+xml"
      })
      .expect(400);
    await request(app)
      .post("/photo")
      .attach("photo", Buffer.alloc(5 * 1024 * 1024 + 1), {
        filename: "photo.png",
        contentType: "image/png"
      })
      .expect(400);
    expect(salvarFotoUsuario).not.toHaveBeenCalled();
  });
  it("aceita uma foto e devolve somente o usuário serializado", async () => {
    const foto = await sharp({
      create: { width: 32, height: 32, channels: 3, background: "white" }
    })
      .png()
      .toBuffer();
    const resposta = await request(app)
      .post("/photo")
      .attach("photo", foto, {
        filename: "photo.png",
        contentType: "image/png"
      })
      .expect(200);
    expect(salvarFotoUsuario).toHaveBeenCalledWith(
      { id: 1, companyId: 1 },
      expect.any(Buffer)
    );
    expect(resposta.body).toEqual({
      id: 1,
      name: "Ana",
      profilePicUrl: "/foto.webp"
    });
  });
  it("permite remover a foto sem enviar arquivo", async () => {
    await request(app).delete("/photo").expect(200);
    expect(salvarFotoUsuario).toHaveBeenCalledWith(
      { id: 1, companyId: 1 },
      null
    );
  });
});
