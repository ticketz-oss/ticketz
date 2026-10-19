import axios from "axios";
import { getMetaGraphApiClient } from "../MetaGraphApiClient";
import { logger } from "../../../utils/logger";
jest.mock("axios", () => ({ create: jest.fn() }));
jest.mock("../../../utils/logger", () => ({ logger: { error: jest.fn() } }));
it("keeps only numeric Graph error identifiers and discards query strings, echoed messages and payloads", async () => {
  const use = jest.fn();
  (axios.create as jest.Mock).mockReturnValue({
    interceptors: { response: { use } }
  });
  getMetaGraphApiClient();
  const reject = use.mock.calls[0][1];
  const secret = "oauth-code-app-secret-business-token";
  const error = {
    response: {
      data: {
        error: {
          code: 190,
          error_subcode: 463,
          message: secret,
          error_data: { token: secret }
        }
      }
    },
    config: {
      url: `/oauth/access_token?code=${secret}`,
      headers: { Authorization: secret }
    }
  };
  await expect(reject(error)).rejects.toMatchObject({
    message: "Meta Graph API request failed",
    graphCode: 190,
    graphSubcode: 463
  });
  expect(JSON.stringify((logger.error as jest.Mock).mock.calls)).not.toContain(
    secret
  );
  await expect(
    reject({ message: secret, config: error.config })
  ).rejects.toMatchObject({ message: "Meta Graph API request failed" });
});
