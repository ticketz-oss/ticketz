import { Request, Response } from "express";
import QuickPix from "../models/QuickPix";
import AppError from "../errors/AppError";
import { makeRandomId } from "../helpers/MakeRandomId";

export async function addRecord(req: Request, res: Response) {
  try {
    const { pixcode, expiration, metadata } = req.body;
    const quickPix = await QuickPix.create({
      companyId: Number(req.user.companyId),
      key: makeRandomId(9),
      pixcode,
      expiration,
      metadata
    });

    const url = `${process.env.FRONTEND_URL}/pix.html?k=${quickPix.key}`;

    res.status(201).json({ url, ...quickPix.dataValues });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function getRecord(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const quickPix = await QuickPix.findOne({
      where: {
        id,
        companyId: req.user.companyId
      }
    });

    if (!quickPix) {
      throw new AppError("ERR_NOT_FOUND", 404);
    }

    return res.json(quickPix);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

export async function getRecordByKey(req: Request, res: Response) {
  try {
    const { key } = req.params;

    const quickPix = await QuickPix.findOne({
      where: {
        key
      }
    });

    if (!quickPix) {
      throw new AppError("ERR_NOT_FOUND", 404);
    }

    return res.json(quickPix);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

export async function listRecords(req: Request, res: Response) {
  try {
    const { metadataKey, metadataValue } = req.query;
    const whereClause =
      metadataKey && metadataValue
        ? { metadata: { [metadataKey as string]: metadataValue } }
        : {};
    const quickPixes = await QuickPix.findAll({ where: whereClause });
    return res.json(quickPixes);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

export async function setAsPaid(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const quickPix = await QuickPix.findByPk(id);
    if (!quickPix) {
      throw new AppError("ERR_NOT_FOUND", 404);
    }
    quickPix.isPaid = true;
    await quickPix.save();
    return res.json(quickPix);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
