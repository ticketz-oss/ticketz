import Queue from "../../../models/Queue";
import Ticket from "../../../models/Ticket";
import Whatsapp from "../../../models/Whatsapp";
import ResolveTicketTransferService from "../ResolveTicketTransferService";

jest.mock("../../../models/Queue");
jest.mock("../../../models/Ticket");
jest.mock("../../../models/Whatsapp");

const whatsappFindOne = Whatsapp.findOne as jest.MockedFunction<
  typeof Whatsapp.findOne
>;
const queueFindOne = Queue.findOne as jest.MockedFunction<typeof Queue.findOne>;
const ticketFindOne = Ticket.findOne as jest.MockedFunction<
  typeof Ticket.findOne
>;

const makeTicket = (overrides: Partial<Ticket> = {}): Ticket =>
  ({
    id: 10,
    companyId: 7,
    contactId: 22,
    whatsappId: 1,
    channel: "whatsapp",
    isGroup: false,
    contact: { isGroup: false },
    ...overrides
  }) as Ticket;

const connection = (overrides = {}) =>
  ({
    id: 2,
    companyId: 7,
    channel: "whatsapp",
    status: "CONNECTED",
    ...overrides
  }) as Whatsapp;

const queue = (whatsappIds: number[]) =>
  ({
    id: 5,
    companyId: 7,
    whatsapps: whatsappIds.map(id => ({ id }))
  }) as Queue;

beforeEach(() => {
  whatsappFindOne.mockResolvedValue(connection());
  queueFindOne.mockResolvedValue(queue([2]));
  ticketFindOne.mockResolvedValue(null);
});

describe("ResolveTicketTransferService", () => {
  it("allows moving a direct ticket to a connected compatible connection", async () => {
    await expect(
      ResolveTicketTransferService({
        ticket: makeTicket(),
        whatsappId: 2,
        queueId: 5
      })
    ).resolves.toEqual({
      whatsappId: 2,
      connectionChanged: true,
      conflictingTicketId: null
    });

    expect(ticketFindOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          contactId: 22,
          whatsappId: 2
        })
      })
    );
  });

  it("keeps legacy queues without explicit connections available", async () => {
    queueFindOne.mockResolvedValue(queue([]));

    await expect(
      ResolveTicketTransferService({
        ticket: makeTicket(),
        whatsappId: 2,
        queueId: 5
      })
    ).resolves.toEqual({
      whatsappId: 2,
      connectionChanged: true,
      conflictingTicketId: null
    });
  });

  it.each([
    [
      "an unknown or cross-tenant connection",
      null,
      makeTicket(),
      "ERR_TICKET_INVALID_CONNECTION"
    ],
    [
      "a disconnected connection",
      connection({ status: "DISCONNECTED" }),
      makeTicket(),
      "ERR_TICKET_CONNECTION_NOT_CONNECTED"
    ],
    [
      "a group ticket",
      connection(),
      makeTicket({ isGroup: true }),
      "ERR_TICKET_GROUP_CONNECTION_TRANSFER"
    ]
  ])("rejects %s", async (_label, target, ticket, errorCode) => {
    whatsappFindOne.mockResolvedValue(target as Whatsapp);

    await expect(
      ResolveTicketTransferService({
        ticket: ticket as Ticket,
        whatsappId: 2,
        queueId: 5
      })
    ).rejects.toMatchObject({ message: errorCode });
  });

  it("returns the active destination ticket for automatic consolidation", async () => {
    ticketFindOne.mockResolvedValue({ id: 99 } as Ticket);

    await expect(
      ResolveTicketTransferService({
        ticket: makeTicket(),
        whatsappId: 2,
        queueId: 5
      })
    ).resolves.toEqual({
      whatsappId: 2,
      connectionChanged: true,
      conflictingTicketId: 99
    });
  });

  it("rejects a queue scoped to another connection", async () => {
    queueFindOne.mockResolvedValue(queue([3]));

    await expect(
      ResolveTicketTransferService({
        ticket: makeTicket(),
        whatsappId: 2,
        queueId: 5
      })
    ).rejects.toMatchObject({
      message: "ERR_QUEUE_NOT_AVAILABLE_FOR_CONNECTION"
    });
  });

  it("requires a queue when changing the connection", async () => {
    await expect(
      ResolveTicketTransferService({
        ticket: makeTicket(),
        whatsappId: 2
      })
    ).rejects.toMatchObject({
      message: "ERR_TICKET_TRANSFER_QUEUE_REQUIRED"
    });
  });

  it("rejects malformed connection identifiers before querying", async () => {
    await expect(
      ResolveTicketTransferService({
        ticket: makeTicket(),
        whatsappId: 0,
        queueId: 5
      })
    ).rejects.toMatchObject({ message: "ERR_TICKET_INVALID_CONNECTION" });

    expect(whatsappFindOne).not.toHaveBeenCalled();
  });
});
