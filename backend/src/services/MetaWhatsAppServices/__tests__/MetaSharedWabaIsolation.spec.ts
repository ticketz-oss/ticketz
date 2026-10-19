import Whatsapp from "../../../models/Whatsapp";
import { getMetaGraphApiClient } from "../MetaGraphApiClient";
import { UnsubscribeWabaWebhookService } from "../SubscribeWabaWebhookService";

jest.mock("../../../models/Whatsapp", () => ({
  __esModule: true,
  default: { findByPk: jest.fn(), count: jest.fn() }
}));
jest.mock("../../../utils/logger", () => ({
  logger: { warn: jest.fn(), error: jest.fn() }
}));
jest.mock("../MetaGraphApiClient", () => ({
  getMetaGraphApiClient: jest.fn(),
  withAuth: jest.fn(token => ({
    headers: { Authorization: `Bearer ${token}` }
  }))
}));

const unsubscribe = jest.fn();
beforeEach(() => {
  jest.clearAllMocks();
  (Whatsapp.findByPk as jest.Mock).mockResolvedValue({
    id: 1,
    metaWabaId: "shared-business",
    metaAccessToken: "private-token"
  });
  (getMetaGraphApiClient as jest.Mock).mockReturnValue({ delete: unsubscribe });
});

it("keeps the WABA subscribed while another tenant connection still needs it", async () => {
  (Whatsapp.count as jest.Mock).mockResolvedValue(1);
  await UnsubscribeWabaWebhookService(1);
  expect(unsubscribe).not.toHaveBeenCalled();
  expect(Whatsapp.count).toHaveBeenCalledWith(
    expect.objectContaining({
      where: expect.objectContaining({
        metaWabaId: "shared-business",
        apiMode: "official"
      })
    })
  );
});

it("unsubscribes the WABA when the last active connection disconnects", async () => {
  (Whatsapp.count as jest.Mock).mockResolvedValue(0);
  await UnsubscribeWabaWebhookService(1);
  expect(unsubscribe).toHaveBeenCalledWith("/shared-business/subscribed_apps", {
    headers: { Authorization: "Bearer private-token" }
  });
});
