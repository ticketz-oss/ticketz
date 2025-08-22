import { Request, Response } from "express";
import Wavoip from "../models/Wavoip";
import Whatsapp from "../models/Whatsapp";
import { getWbot } from "../libs/wbot";

async function refreshWhatsapp(whatsappId: number) {
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

  refreshWhatsapp(whatsapp.id);

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

  refreshWhatsapp(wavoip.whatsappId);

  return res.status(200).json({ message: "SUCCESS" });
};
