import axios from "axios";
import { Readable } from "stream";

export default async function downloadFile(url: string): Promise<Readable> {
  try {
    const response = await axios({
      url,
      method: "GET",
      responseType: "stream"
    });
    return response.data;
  } catch (error) {
    throw new Error(`Failed to download file: ${error.message}`);
  }
}
