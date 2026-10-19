import axios from "axios";
import AppError from "../../errors/AppError";

// Template com cabecalho de documento so e aceito com um arquivo de exemplo,
// e esse exemplo nao vai pelo endpoint normal de midia: exige a API de upload
// retomavel do app (duas chamadas) e devolve um "handle", nao um media id.
const UploadMetaTemplateSampleService = async (
  content: Buffer,
  filename: string,
  mimetype: string
): Promise<string> => {
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;

  if (!appId || !appSecret) {
    throw new AppError("ERR_META_APP_NOT_CONFIGURED");
  }

  const version = process.env.META_GRAPH_API_VERSION || "v21.0";
  const baseUrl = `https://graph.facebook.com/${version}`;
  const accessToken = `${appId}|${appSecret}`;

  const { data: session } = await axios
    .post(`${baseUrl}/${appId}/uploads`, null, {
      params: {
        file_name: filename,
        file_length: content.length,
        file_type: mimetype,
        access_token: accessToken
      },
      timeout: 30000
    })
    .catch(() => {
      throw new AppError("ERR_META_TEMPLATE_SAMPLE", 502);
    });

  if (!session?.id) {
    throw new AppError("ERR_META_TEMPLATE_SAMPLE", 502);
  }

  const { data } = await axios
    .post(`${baseUrl}/${session.id}`, new Uint8Array(content), {
      headers: {
        // Este endpoint usa "OAuth", nao "Bearer".
        Authorization: `OAuth ${accessToken}`,
        file_offset: "0",
        "Content-Type": "application/octet-stream"
      },
      timeout: 120000,
      maxBodyLength: Infinity
    })
    .catch(() => {
      throw new AppError("ERR_META_TEMPLATE_SAMPLE", 502);
    });

  if (!data?.h) {
    throw new AppError("ERR_META_TEMPLATE_SAMPLE", 502);
  }

  return data.h as string;
};

export default UploadMetaTemplateSampleService;
