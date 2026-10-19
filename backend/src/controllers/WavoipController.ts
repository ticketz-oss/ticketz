import { Request, Response } from "express";
import Wavoip from "../models/Wavoip";
import Whatsapp from "../models/Whatsapp";
import { getWbot } from "../libs/wbot";

async function refreshWhatsapp(whatsappId: number, apiMode?: string) {
  if (apiMode === "official") return;

  const wbot = getWbot(whatsappId);
  if (!wbot) return;

  await wbot.ws.close();
}

export const getToken = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { whatsappId } = req.params;

  const wavoip = await Wavoip.findOne({
    where: { whatsappId },
    include: [Whatsapp]
  });

  if (!wavoip) {
    return res.status(404).json({ error: "ERR_NOTFOUND" });
  }

  if (req.user.companyId !== wavoip.whatsapp.companyId) {
    return res.status(403).json({ error: "ERR_FORBIDDEN" });
  }

  return res.status(200).json(wavoip);
};

export const saveToken = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { whatsappId } = req.params;
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: "ERR_BADREQUEST" });
  }

  const whatsapp = await Whatsapp.findByPk(whatsappId);
  if (!whatsapp) {
    return res.status(404).json({ error: "ERR_NOTFOUND" });
  }

  if (req.user.companyId !== whatsapp.companyId) {
    return res.status(403).json({ error: "ERR_FORBIDDEN" });
  }

  if (whatsapp.channel !== "whatsapp") {
    return res.status(400).json({ error: "ERR_BADREQUEST" });
  }

  // Chamada de voz depende da sessao Baileys. Salvar o token numa conexao
  // oficial faria o botao de ligar aparecer no atendimento sem nunca
  // funcionar, entao recusa aqui em vez de prometer o que nao existe.
  if (whatsapp.apiMode === "official") {
    return res
      .status(400)
      .json({ error: "ERR_WAPP_OFFICIAL_MODE_NOT_SUPPORTED" });
  }

  const existingWavoip = await Wavoip.findOne({
    where: { whatsappId }
  });

  if (existingWavoip) {
    existingWavoip.token = token;
    await existingWavoip.save();
  }
  const wavoip =
    existingWavoip ||
    (await Wavoip.create({
      token,
      whatsappId: Number(whatsappId)
    }));

  refreshWhatsapp(whatsapp.id, whatsapp.apiMode);

  return res.status(201).json(wavoip);
};

export const deleteToken = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { whatsappId } = req.params;
  const wavoip = await Wavoip.findOne({
    where: { whatsappId },
    include: [Whatsapp]
  });

  if (!wavoip) {
    return res.status(404).json({ error: "ERR_NOTFOUND" });
  }

  if (req.user.companyId !== wavoip.whatsapp.companyId) {
    return res.status(403).json({ error: "ERR_FORBIDDEN" });
  }

  if (wavoip.whatsapp.channel !== "whatsapp") {
    return res.status(400).json({ error: "ERR_BADREQUEST" });
  }

  await wavoip.destroy();

  refreshWhatsapp(wavoip.whatsappId, wavoip.whatsapp.apiMode);

  return res.status(200).json({ message: "SUCCESS" });
};
