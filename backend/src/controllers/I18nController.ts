import { Request, Response } from "express";
import { getUniqueLanguages } from "../services/TranslationServices/i18nService";

export const getLanguages = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const languages = await getUniqueLanguages();
  return res.status(200).json(languages);
};
