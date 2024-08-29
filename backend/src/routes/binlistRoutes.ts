import express, { Request, Response } from "express";
import isAuth from "../middleware/isAuth";
import { GetBinlistService } from "../services/BinlistServices/GetBinlistService";

const binlistRoutes = express.Router();

binlistRoutes.get(
  "/binlist/:bin",
  isAuth,
  async (req: Request, res: Response) => {
    const { bin } = req.params;

    const binData = await GetBinlistService(bin);
    return res.status(200).json(binData);
  }
);

export default binlistRoutes;
