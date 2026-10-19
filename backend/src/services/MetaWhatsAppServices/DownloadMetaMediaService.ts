import axios from "axios";
import AppError from "../../errors/AppError";
import Whatsapp from "../../models/Whatsapp";
import { getMetaGraphApiClient, withAuth } from "./MetaGraphApiClient";

export interface DownloadedMetaMedia {
  content: Buffer;
  mimetype: string;
}

// Midia entrante chega no webhook so como id; o binario exige dois passos e
// a URL do segundo e assinada, de vida curta e exige o mesmo Bearer - por
// isso baixamos na hora e guardamos local (ver saveMediaToFile no chamador).
const DownloadMetaMediaService = async (
  whatsapp: Whatsapp,
  mediaId: string
): Promise<DownloadedMetaMedia> => {
  if (!whatsapp.metaAccessToken) {
    throw new AppError("ERR_META_CONNECTION_NOT_CONFIGURED");
  }

  const auth = withAuth(whatsapp.metaAccessToken);

  const { data: metadata } = await getMetaGraphApiClient().get(
    `/${mediaId}`,
    auth
  );

  if (!metadata?.url) {
    throw new AppError("ERR_META_MEDIA_NOT_FOUND", 502);
  }

  // Host proprio da Meta (lookaside.fbsbx.com), fora do baseURL do client.
  const { data } = await axios
    .get(metadata.url as string, {
      ...auth,
      responseType: "arraybuffer",
      timeout: 120000,
      maxContentLength: 100 * 1024 * 1024
    })
    .catch(() => {
      throw new AppError("ERR_META_MEDIA_DOWNLOAD_FAILED", 502);
    });

  return {
    content: Buffer.from(data),
    mimetype: (metadata.mime_type as string) || "application/octet-stream"
  };
};

export default DownloadMetaMediaService;
