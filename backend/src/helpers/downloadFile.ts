import axios from "axios";
import { Readable } from "stream";
import { logger } from "../utils/logger";

export default async function downloadFile(url: string): Promise<Readable> {
  try {
    if (url.startsWith("data:")) {
      logger.debug("downloadFile: detected data URL");
      const base64Data = url.split(",")[1];
      const buffer = Buffer.from(base64Data, "base64");
      return Readable.from(buffer);
    }

    const response = await axios({
      url,
      method: "GET",
      responseType: "stream"
    });
    return response.data;
  } catch (error) {
    logger.info({ url, error }, `Failed to download file: ${error.message}`);
  }
  return null;
}
