import { Request } from "express";

/**
 * Detects the appropriate CSV delimiter based on the request.
 * Priority:
 * 1. Query parameter `delimiter` (values: "semicolon" or "comma")
 * 2. Accept-Language header (certain locales prefer semicolon)
 * 3. Default to comma
 *
 * @param req Express request object
 * @returns Detected delimiter, either ";" or ","
 */
export function csvDetectDelimiter(req: Request): string {
  // 1. Explicit override by query param
  if (req.query.delimiter) {
    if ((req.query.delimiter as string).toLowerCase() === "semicolon")
      return ";";
    if ((req.query.delimiter as string).toLowerCase() === "comma") return ",";
  }

  // 2. Detect by Accept-Language header
  const lang = (req.headers["accept-language"] || "").toLowerCase();

  // Locales that usually expect semicolon-separated CSVs
  const semicolonLocales = [
    "pt-br", // Brazil
    "fr", // France
    "de", // Germany
    "it", // Italy
    "es-es", // Spain (Spain uses comma decimal separator, not Latin America)
    "nl", // Netherlands
    "pl", // Poland
    "ru", // Russia
    "sv", // Sweden
    "fi", // Finland
    "da", // Denmark
    "no" // Norway
  ];

  const needsSemicolon = semicolonLocales.some(loc => lang.includes(loc));

  return needsSemicolon ? ";" : ",";
}
