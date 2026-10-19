import sequelize from "../../../database";
import { getIO } from "../../../libs/socket";
import GroupQueue from "../../../models/GroupQueue";
import GroupReadState from "../../../models/GroupReadState";
import Queue from "../../../models/Queue";
import Ticket from "../../../models/Ticket";
import TicketTraking from "../../../models/TicketTraking";
import { incrementCounter } from "../../CounterServices/IncrementCounter";
import FindOrCreateATicketTrakingService from "../../TicketServices/FindOrCreateATicketTrakingService";
import ShowTicketService from "../../TicketServices/ShowTicketService";
import { assertGroupAccess } from "../GroupAccessService";
import UpdateGroupService from "../UpdateGroupService";

jest.mock("../../../database", () => ({
  __esModule: true,
  default: { transaction: jest.fn() }
}));
jest.mock("../../../libs/socket");
jest.mock("../../../models/GroupQueue");
jest.mock("../../../models/GroupReadState");
jest.mock("../../../models/Queue");
jest.mock("../../../models/Ticket");
jest.mock("../../../models/TicketTraking");
jest.mock("../../CounterServices/IncrementCounter");
jest.mock("../../TicketServices/FindOrCreateATicketTrakingService");
jest.mock("../../TicketServices/ShowTicketService");
jest.mock("../GroupAccessService");

const transaction = sequelize.transaction as jest.Mock;
const assertAccess = assertGroupAccess as jest.MockedFunction<
  typeof assertGroupAccess
>;
const countQueues = Queue.count as jest.MockedFunction<typeof Queue.count>;
const findRelatedTickets = Ticket.findAll as jest.MockedFunction<
  typeof Ticket.findAll
>;
const findGroupQueues = GroupQueue.findAll as jest.MockedFunction<
  typeof GroupQueue.findAll
>;

const socketOperator = {
  to: jest.fn(),
  emit: jest.fn(),
  fetchSockets: jest.fn().mockResolvedValue([])
};
socketOperator.to.mockReturnValue(socketOperator);

const makeTicket = (mode: "conversation" | "ticket") => {
  const contact = {
    id: 31,
    groupMode: mode,
    update: jest.fn().mockResolvedValue(undefined)
  };
  return {
    id: 20,
    contactId: 31,
    companyId: 7,
    whatsappId: 12,
    queueId: mode === "ticket" ? 4 : null,
    isGroup: true,
    contact,
    update: jest.fn().mockResolvedValue(undefined),
    reload: jest.fn().mockResolvedValue(undefined)
  } as unknown as Ticket;
};

beforeEach(() => {
  transaction.mockImplementation(async (...args) => {
    const callback = args[args.length - 1];
    return callback({});
  });
  countQueues.mockResolvedValue(2);
  findGroupQueues.mockResolvedValue([{ queueId: 4 }] as GroupQueue[]);
  (GroupQueue.destroy as jest.Mock).mockResolvedValue(1);
  (GroupQueue.bulkCreate as jest.Mock).mockResolvedValue([]);
  (TicketTraking.update as jest.Mock).mockResolvedValue([1]);
  (Ticket.update as jest.Mock).mockResolvedValue([1]);
  (GroupReadState.update as jest.Mock).mockResolvedValue([1]);
  (getIO as jest.Mock).mockReturnValue({
    to: socketOperator.to,
    in: jest.fn().mockReturnValue(socketOperator)
  });
});

it("starts tracking only when a conversation becomes an attendance", async () => {
  const ticket = makeTicket("conversation");
  assertAccess.mockResolvedValue(ticket);
  (ShowTicketService as jest.Mock).mockResolvedValue(ticket);
  findRelatedTickets.mockResolvedValue([ticket]);

  await UpdateGroupService({
    ticketId: 20,
    mode: "ticket",
    queueIds: [4, 5],
    serviceQueueId: 4,
    user: { id: 2, companyId: 7, profile: "user" }
  });

  expect(ticket.update).toHaveBeenCalledWith(
    expect.objectContaining({ status: "pending", queueId: 4, userId: null }),
    expect.any(Object)
  );
  expect(FindOrCreateATicketTrakingService).toHaveBeenCalledWith(
    expect.objectContaining({
      ticketId: 20,
      companyId: 7,
      whatsappId: 12,
      transaction: expect.anything()
    })
  );
  expect(incrementCounter).toHaveBeenCalledWith(7, "ticket-create");
});

it("ends active tracking and clears operational state when returning to conversation", async () => {
  const ticket = makeTicket("ticket");
  assertAccess.mockResolvedValue(ticket);
  (ShowTicketService as jest.Mock).mockResolvedValue(ticket);
  findRelatedTickets.mockResolvedValue([ticket]);

  await UpdateGroupService({
    ticketId: 20,
    mode: "conversation",
    queueIds: [4, 5],
    user: { id: 2, companyId: 7, profile: "user" }
  });

  expect(TicketTraking.update).toHaveBeenCalledWith(
    expect.objectContaining({ expired: true, finishedAt: expect.any(Date) }),
    expect.objectContaining({ transaction: expect.anything() })
  );
  expect(Ticket.update).toHaveBeenCalledWith(
    expect.objectContaining({
      status: "open",
      userId: null,
      queueId: null,
      chatbot: false,
      unreadMessages: 0
    }),
    expect.any(Object)
  );
  expect(GroupReadState.update).toHaveBeenCalledWith(
    expect.objectContaining({ unreadCount: 0 }),
    expect.any(Object)
  );
  expect(FindOrCreateATicketTrakingService).not.toHaveBeenCalled();
  expect(incrementCounter).not.toHaveBeenCalled();
});
