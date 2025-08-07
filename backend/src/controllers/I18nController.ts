import { Request, Response } from "express";
import Translation from "../models/Translation";
import { getAllTranslationKeys } from "../generated/translationKeys";
import AppError from "../errors/AppError";
import { logger } from "../utils/logger";
import { getUniqueLanguages } from "../services/TranslationServices/i18nService";

export const getLanguages = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const languages = await getUniqueLanguages();
  return res.status(200).json(languages);
};

// List all unique languages
export const listLanguages = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const languages = await getUniqueLanguages();
    return res.status(200).json({ languages });
  } catch (error) {
    logger.error(
      {
        message: error.message,
        stack: error.stack
      },
      "Error listing languages"
    );
    throw new AppError("ERR_INTERNAL", 500);
  }
};

// Get all keys and values of a namespace and language
export const getKeysAndValues = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { namespace, language } = req.query;

  if (!namespace || !language) {
    throw new AppError("ERR_BAD_REQUEST", 400);
  }

  try {
    // Fetch all keys from translationKeys.ts
    const allKeys = getAllTranslationKeys();

    // Fetch translations from the database
    const translations = await Translation.findAll({
      where: { namespace, language },
      attributes: ["key", "value"]
    });

    // Create a map of existing translations
    const translationMap = translations.reduce((map, translation) => {
      map[translation.key] = translation.value;
      return map;
    }, {} as Record<string, string>);

    // Combine results, ensuring all keys are included
    const combinedTranslations = allKeys.map(key => ({
      key,
      value: translationMap[key] || ""
    }));

    return res.status(200).json({ translations: combinedTranslations });
  } catch (error) {
    logger.error(
      {
        message: error.message,
        stack: error.stack
      },
      "Error fetching keys and values"
    );
    throw new AppError("ERR_INTERNAL", 500);
  }
};

export const upsertTranslation = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { namespace, language, key, value } = req.body;

  if (!namespace || !language || !key) {
    throw new AppError("ERR_BAD_REQUEST", 400);
  }

  try {
    if (value === undefined || value === "") {
      // Remove the record if value is empty
      const deleted = await Translation.destroy({
        where: { namespace, language, key }
      });

      if (deleted) {
        return res.status(200).json({ message: "Translation deleted" });
      }
      throw new AppError("ERR_NOT_FOUND", 404);
    }

    // Upsert the record if value is not empty
    const [translation, created] = await Translation.upsert({
      namespace,
      language,
      key,
      value
    });

    const action = created ? "created" : "updated";

    return res
      .status(200)
      .json({ message: `Translation ${action}`, translation });
  } catch (error) {
    logger.error(
      {
        message: error.message,
        stack: error.stack
      },
      "Error upserting translation"
    );
    throw new AppError("ERR_INTERNAL", 500);
  }
};
