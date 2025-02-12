import axios from "axios";
import { Readable } from "stream";
import { logger } from "../utils/logger";

export default async function downloadFile(url: string): Promise<Readable> {
  try {
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
