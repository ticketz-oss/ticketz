import Whatsapp from "../../../models/Whatsapp";
import Message from "../../../models/Message";
import { getIO } from "../../../libs/socket";
import ProcessMetaWebhookEventService from "../ProcessMetaWebhookEventService";

jest.mock("../../../models/Whatsapp");
jest.mock("../../../models/Message");
jest.mock("../../../libs/socket", () => ({ getIO: jest.fn() }));
jest.mock("../HandleMetaInboundMessageService", () => jest.fn());

const emit = jest.fn();
const room = jest.fn(() => ({ emit }));
const socket = getIO as jest.MockedFunction<typeof getIO>;

const buildStatusPayload = (status: string) => ({
  entry: [
    {
      changes: [
        {
          value: {
            metadata: { phone_number_id: "111" },
            statuses: [{ id: "wamid.123", status }]
          }
        }
      ]
    }
  ]
});

describe("ProcessMetaWebhookEventService ack mapping", () => {
  const update = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (Whatsapp.findOne as jest.Mock).mockResolvedValue({
      id: 1,
      companyId: 9,
      status: "CONNECTED",
      metaPhoneNumberId: "111"
    });
    update.mockImplementation(function updateAck(
      this: unknown,
      fields: {
        ack: number;
      }
    ) {
      Object.assign(this as object, fields);
      return Promise.resolve(this);
    });
    (Message.findOne as jest.Mock).mockResolvedValue({
      id: "wamid.123",
      ack: 0,
      ticketId: 55,
      companyId: 9,
      update
    });
    socket.mockReturnValue({ to: room, emit } as never);
  });

  it.each([
    ["sent", 2],
    ["delivered", 3],
    ["read", 4],
    ["failed", -1]
  ])(
    "maps Meta status %s to the same ack scale MessagesList renders (%i)",
    async (status, expectedAck) => {
      await ProcessMetaWebhookEventService(buildStatusPayload(status));

      expect(update).toHaveBeenCalledWith({ ack: expectedAck });
    }
  );

  it("notifies the frontend over the ticket's socket room so the check mark updates live", async () => {
    await ProcessMetaWebhookEventService(buildStatusPayload("delivered"));

    expect(room).toHaveBeenCalledWith("55");
    expect(emit).toHaveBeenCalledWith(
      "company-9-appMessage",
      expect.objectContaining({ action: "update" })
    );
  });

  it("never regresses an ack that already moved past the incoming status", async () => {
    (Message.findOne as jest.Mock).mockResolvedValue({
      id: "wamid.123",
      ack: 4,
      ticketId: 55,
      companyId: 9,
      update
    });

    await ProcessMetaWebhookEventService(buildStatusPayload("sent"));

    expect(update).not.toHaveBeenCalled();
    expect(emit).not.toHaveBeenCalled();
  });
});
