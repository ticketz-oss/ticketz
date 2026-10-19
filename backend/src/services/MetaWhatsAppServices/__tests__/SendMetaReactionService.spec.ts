import SendMetaReactionService from "../SendMetaReactionService";
import { getMetaGraphApiClient } from "../MetaGraphApiClient";
import Whatsapp from "../../../models/Whatsapp";
import Ticket from "../../../models/Ticket";

jest.mock("../MetaGraphApiClient", () => ({
  getMetaGraphApiClient: jest.fn()
}));
jest.mock("../../MessageServices/CreateMessageService", () => ({
  __esModule: true,
  default: jest.fn()
}));
it("does not send reactions using credentials retained after disconnect", async () => {
  await expect(
    SendMetaReactionService({
      connection: {
        status: "DISCONNECTED",
        metaAccessToken: "retained",
        metaPhoneNumberId: "phone"
      } as Whatsapp,
      ticket: {} as Ticket,
      messageId: "wamid",
      emoji: "👍"
    })
  ).rejects.toMatchObject({ message: "ERR_WAPP_NOT_INITIALIZED" });
  expect(getMetaGraphApiClient).not.toHaveBeenCalled();
});
