import Message from "../../../models/Message";
import Ticket from "../../../models/Ticket";
import ResolveQuotedMessageService from "../ResolveQuotedMessageService";

const currentTicket = {
  id: 20,
  companyId: 9,
  contactId: 100,
  whatsappId: 16,
  channel: "whatsapp",
  isGroup: false
} as Ticket;

describe("ResolveQuotedMessageService", () => {
  afterEach(() => jest.restoreAllMocks());

  it("accepts a message from an older ticket for the same contact", async () => {
    const quoted = {
      id: "wamid.old",
      ticket: { ...currentTicket, id: 18 }
    } as Message;
    const find = jest.spyOn(Message, "findOne").mockResolvedValue(quoted);

    await expect(
      ResolveQuotedMessageService({
        quotedMsgId: quoted.id,
        ticket: currentTicket,
        companyId: 9
      })
    ).resolves.toBe(quoted);
    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: quoted.id, companyId: 9 } })
    );
  });

  it("rejects a message from another contact", async () => {
    jest.spyOn(Message, "findOne").mockResolvedValue({
      id: "wamid.foreign",
      ticket: { ...currentTicket, id: 18, contactId: 999 }
    } as Message);

    await expect(
      ResolveQuotedMessageService({
        quotedMsgId: "wamid.foreign",
        ticket: currentTicket,
        companyId: 9
      })
    ).rejects.toMatchObject({
      message: "ERR_QUOTED_MESSAGE_NOT_ALLOWED",
      statusCode: 403
    });
  });

  it("rejects a message from a future ticket", async () => {
    jest.spyOn(Message, "findOne").mockResolvedValue({
      id: "wamid.future",
      ticket: { ...currentTicket, id: 21 }
    } as Message);

    await expect(
      ResolveQuotedMessageService({
        quotedMsgId: "wamid.future",
        ticket: currentTicket,
        companyId: 9
      })
    ).rejects.toMatchObject({ statusCode: 403 });
  });
});
