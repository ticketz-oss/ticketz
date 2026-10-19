import CheckContactOpenTickets from "../../../helpers/CheckContactOpenTickets";
import { GetCompanySetting } from "../../../helpers/CheckSettings";
import { getIO } from "../../../libs/socket";
import Ticket from "../../../models/Ticket";
import User from "../../../models/User";
import { incrementCounter } from "../../CounterServices/IncrementCounter";
import FindOrCreateATicketTrakingService from "../FindOrCreateATicketTrakingService";
import ShowTicketService from "../ShowTicketService";
import UpdateTicketService from "../UpdateTicketService";

jest.mock("../../../helpers/CheckContactOpenTickets");
jest.mock("../../../helpers/SetTicketMessagesAsRead");
jest.mock("../../../helpers/GetTicketWbot");
jest.mock("../../../helpers/CheckSettings");
jest.mock("../../../libs/socket");
jest.mock("../../CounterServices/IncrementCounter");
jest.mock("../../WbotServices/SendWhatsAppMessage");
jest.mock("../../WbotServices/wbotMessageListener", () => ({
  startQueue: jest.fn(),
  verifyMessage: jest.fn()
}));
jest.mock("../FindOrCreateATicketTrakingService");
jest.mock("../ShowTicketService");

const checkOpenTickets = CheckContactOpenTickets as jest.MockedFunction<
  typeof CheckContactOpenTickets
>;
const getSetting = GetCompanySetting as jest.MockedFunction<
  typeof GetCompanySetting
>;
const showTicket = ShowTicketService as jest.MockedFunction<
  typeof ShowTicketService
>;
const findTracking = FindOrCreateATicketTrakingService as jest.MockedFunction<
  typeof FindOrCreateATicketTrakingService
>;
const countEvent = incrementCounter as jest.MockedFunction<
  typeof incrementCounter
>;
const findUser = jest.spyOn(User, "findByPk");

const makeClosedTicket = (assignedUserId: number) => {
  const ticket = {
    id: 1,
    companyId: 10,
    contactId: 24,
    whatsappId: 6,
    queueId: 7,
    userId: assignedUserId,
    status: "closed",
    channel: "whatsapp",
    chatbot: false,
    queueOptionId: null,
    isGroup: false,
    contact: { isGroup: false, disableBot: true },
    whatsapp: { status: "CONNECTED" },
    user: { id: assignedUserId },
    update: jest.fn(),
    reload: jest.fn()
  } as unknown as Ticket & {
    update: jest.Mock;
    reload: jest.Mock;
  };

  ticket.update.mockImplementation(async values => {
    Object.assign(ticket, values);
    return ticket;
  });
  ticket.reload.mockImplementation(async () => ticket);

  return ticket;
};

beforeEach(() => {
  jest.clearAllMocks();

  const socket = {
    to: jest.fn(),
    emit: jest.fn()
  };
  socket.to.mockReturnValue(socket);
  (getIO as jest.MockedFunction<typeof getIO>).mockReturnValue(
    socket as unknown as ReturnType<typeof getIO>
  );

  getSetting.mockImplementation(async (_companyId, _key, fallback) => fallback);
  checkOpenTickets.mockResolvedValue(null);
  findTracking.mockResolvedValue({
    startedAt: new Date(),
    finishedAt: new Date(),
    save: jest.fn()
  } as never);
});

it("allows an agent to reopen a closed ticket assigned to them", async () => {
  const ticket = makeClosedTicket(5);
  findUser.mockResolvedValue({ id: 5, companyId: 10, profile: "user" } as User);
  showTicket.mockResolvedValue(ticket);

  const result = await UpdateTicketService({
    ticketData: { status: "open", userId: 5 },
    ticketId: ticket.id,
    reqUserId: 5
  });

  expect(result.ticket.status).toBe("open");
  expect(countEvent).toHaveBeenCalledWith(10, "ticket-reopen");
});

it("denies an agent reopening a closed ticket assigned to another user", async () => {
  const ticket = makeClosedTicket(8);
  findUser.mockResolvedValue({ id: 5, companyId: 10, profile: "user" } as User);
  showTicket.mockResolvedValue(ticket);

  await expect(
    UpdateTicketService({
      ticketData: { status: "open", userId: 5 },
      ticketId: ticket.id,
      reqUserId: 5
    })
  ).rejects.toMatchObject({ message: "ERR_FORBIDDEN", statusCode: 403 });

  expect(ticket.update).not.toHaveBeenCalled();
});

it("keeps allowing an admin to reopen a ticket assigned to another user", async () => {
  const ticket = makeClosedTicket(8);
  findUser.mockResolvedValue({
    id: 5,
    companyId: 10,
    profile: "admin"
  } as User);
  showTicket.mockResolvedValue(ticket);

  const result = await UpdateTicketService({
    ticketData: { status: "open", userId: 5 },
    ticketId: ticket.id,
    reqUserId: 5
  });

  expect(result.ticket.status).toBe("open");
  expect(countEvent).toHaveBeenCalledWith(10, "ticket-reopen");
});
