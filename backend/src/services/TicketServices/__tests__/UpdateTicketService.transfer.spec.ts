import { getIO } from "../../../libs/socket";
import Ticket from "../../../models/Ticket";
import { GetCompanySetting } from "../../../helpers/CheckSettings";
import { incrementCounter } from "../../CounterServices/IncrementCounter";
import FindOrCreateATicketTrakingService from "../FindOrCreateATicketTrakingService";
import ResolveTicketTransferService from "../ResolveTicketTransferService";
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
jest.mock("../ResolveTicketTransferService");
jest.mock("../ShowTicketService");

const showTicket = ShowTicketService as jest.MockedFunction<
  typeof ShowTicketService
>;
const resolveTransfer = ResolveTicketTransferService as jest.MockedFunction<
  typeof ResolveTicketTransferService
>;
const findTracking = FindOrCreateATicketTrakingService as jest.MockedFunction<
  typeof FindOrCreateATicketTrakingService
>;
const getSetting = GetCompanySetting as jest.MockedFunction<
  typeof GetCompanySetting
>;
const countEvent = incrementCounter as jest.MockedFunction<
  typeof incrementCounter
>;

const makeTicket = (data: Partial<Ticket>) => {
  const ticket = {
    id: 1,
    companyId: 10,
    contactId: 24,
    whatsappId: 6,
    queueId: 7,
    userId: null,
    status: "pending",
    channel: "whatsapp",
    chatbot: false,
    queueOptionId: null,
    isGroup: false,
    contact: { isGroup: false, disableBot: true },
    whatsapp: { status: "CONNECTED" },
    user: null,
    update: jest.fn(),
    reload: jest.fn(),
    ...data
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

it("closes an active destination ticket and completes the explicit transfer", async () => {
  const source = makeTicket({ id: 88, whatsappId: 7, queueId: 9 });
  const conflict = makeTicket({ id: 89, whatsappId: 8, queueId: 8 });
  const sourceTracking = {
    startedAt: null,
    finishedAt: null,
    save: jest.fn()
  };
  const conflictTracking = {
    startedAt: null,
    finishedAt: null,
    save: jest.fn()
  };
  const socket = {
    to: jest.fn(),
    emit: jest.fn()
  };
  socket.to.mockReturnValue(socket);

  (getIO as jest.MockedFunction<typeof getIO>).mockReturnValue(
    socket as unknown as ReturnType<typeof getIO>
  );
  showTicket.mockResolvedValueOnce(source).mockResolvedValueOnce(conflict);
  resolveTransfer.mockResolvedValue({
    whatsappId: 8,
    connectionChanged: true,
    conflictingTicketId: 89
  });
  findTracking
    .mockResolvedValueOnce(sourceTracking as never)
    .mockResolvedValueOnce(conflictTracking as never);
  getSetting.mockImplementation(async (_companyId, _key, fallback) => fallback);

  const result = await UpdateTicketService({
    ticketData: {
      status: "pending",
      userId: null,
      queueId: 8,
      whatsappId: 8
    },
    ticketId: 88,
    companyId: 10,
    dontRunChatbot: true
  });

  expect(conflict.update).toHaveBeenCalledWith(
    expect.objectContaining({ status: "closed" })
  );
  expect(source.update).toHaveBeenCalledWith(
    expect.objectContaining({
      status: "pending",
      queueId: 8,
      whatsappId: 8
    })
  );
  expect(countEvent).toHaveBeenCalledWith(10, "ticket-close");
  expect(countEvent).toHaveBeenCalledWith(10, "ticket-transfer");
  expect(result.ticket).toBe(source);
});
