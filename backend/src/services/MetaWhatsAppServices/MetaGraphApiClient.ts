import axios, { AxiosInstance } from "axios";
import { logger } from "../../utils/logger";

let client: AxiosInstance | null = null;

export class MetaGraphApiError extends Error {
  public readonly graphCode?: number;

  public readonly graphSubcode?: number;

  constructor(message: string, graphCode?: number, graphSubcode?: number) {
    super(message);
    this.graphCode = graphCode;
    this.graphSubcode = graphSubcode;
  }
}

// Cliente axios unico pra Graph API, versao fixada explicitamente (nunca
// "latest" implicito - a Meta depreca versoes e muda formatos de payload).
export const getMetaGraphApiClient = (): AxiosInstance => {
  if (client) return client;

  const version = process.env.META_GRAPH_API_VERSION?.trim() || "v21.0";

  client = axios.create({
    baseURL: `https://graph.facebook.com/${version}`,
    timeout: 20000
  });

  client.interceptors.response.use(
    response => response,
    error => {
      const graphError = error?.response?.data?.error;
      if (graphError) {
        const graphCode =
          typeof graphError.code === "number" &&
          Number.isFinite(graphError.code)
            ? graphError.code
            : undefined;
        const graphSubcode =
          typeof graphError.error_subcode === "number" &&
          Number.isFinite(graphError.error_subcode)
            ? graphError.error_subcode
            : undefined;
        logger.error({ graphCode, graphSubcode }, "Meta Graph API error");
        return Promise.reject(
          new MetaGraphApiError(
            "Meta Graph API request failed",
            graphCode,
            graphSubcode
          )
        );
      }
      return Promise.reject(
        new MetaGraphApiError("Meta Graph API request failed")
      );
    }
  );

  return client;
};

export const withAuth = (accessToken: string) => ({
  headers: { Authorization: `Bearer ${accessToken}` }
});
