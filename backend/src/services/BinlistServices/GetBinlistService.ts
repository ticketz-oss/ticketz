import axios from "axios";
import AppError from "../../errors/AppError";

export async function GetBinlistService(bin: string) {
  const binlistUrl = `https://lookup.binlist.net/${bin}`;

  try {
    const response = await axios.get(binlistUrl);
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new AppError(
        `Error getting BIN info for ${bin}`,
        error.response.status
      );
    } else {
      throw new AppError("ERR_INTERNAL_SERVER_ERROR");
    }
  }
}
