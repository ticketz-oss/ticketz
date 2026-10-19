import Ticket from "../../../models/Ticket";
import TicketTraking from "../../../models/TicketTraking";
import VoiceCall from "../../../models/VoiceCall";
import CreateMessageService from "../../MessageServices/CreateMessageService";
import { incrementCounter } from "../../CounterServices/IncrementCounter";
import ShowTicketService from "../../TicketServices/ShowTicketService";
import { finishVoiceHistory, startVoiceHistory } from "../VoiceHistoryService";

let transactionQueue: Promise<unknown> = Promise.resolve();
const socket = { to: jest.fn(), emit: jest.fn() };
socket.to.mockReturnValue(socket);

jest.mock("../../../database", () => ({
  __esModule: true,
  default: {
    transaction: jest.fn(callback => {
      const run = transactionQueue.then(() =>
        callback({ LOCK: { UPDATE: "UPDATE" } })
      );
      transactionQueue = run.catch(() => undefined);
      return run;
    })
  }
}));
jest.mock("../../../models/Ticket");
jest.mock("../../../models/TicketTraking");
jest.mock("../../../models/VoiceCall");
jest.mock("../../MessageServices/CreateMessageService");
jest.mock("../../CounterServices/IncrementCounter");
jest.mock("../../TicketServices/ShowTicketService");
jest.mock("../VoiceContactService", () => ({
  resolveVoiceContact: jest.fn()
}));
jest.mock("../../../libs/socket", () => ({ getIO: () => socket }));

const callFindByPk = VoiceCall.findByPk as jest.MockedFunction<
  typeof VoiceCall.findByPk
>;
const ticketCreate = Ticket.create as jest.MockedFunction<typeof Ticket.create>;
const ticketFindOne = Ticket.findOne as jest.MockedFunction<
  typeof Ticket.findOne
>;
const ticketFindByPk = Ticket.findByPk as jest.MockedFunction<
  typeof Ticket.findByPk
>;
const trackingCreate = TicketTraking.create as jest.MockedFunction<
  typeof TicketTraking.create
>;
const trackingFindOne = TicketTraking.findOne as jest.MockedFunction<
  typeof TicketTraking.findOne
>;
const createMessage = CreateMessageService as jest.MockedFunction<
  typeof CreateMessageService
>;
const increment = incrementCounter as jest.MockedFunction<
  typeof incrementCounter
>;
const showTicket = ShowTicketService as jest.MockedFunction<
  typeof ShowTicketService
>;

const makeCall = (): VoiceCall => {
  const call = {
    id: 77,
    companyId: 1,
    contactId: 31,
    ticketId: null,
    queueId: 2,
    whatsappId: 3,
    userId: 10,
    state: "accepted",
    startedAt: new Date("2026-09-03T12:00:00Z"),
    acceptedAt: new Date("2026-09-03T12:00:05Z"),
    endedAt: null,
    durationSeconds: 0,
    update: jest.fn(async values => Object.assign(call, values))
  } as unknown as VoiceCall;
  return call;
};

describe("voice ticket history", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    transactionQueue = Promise.resolve();
    socket.to.mockReturnValue(socket);
    createMessage.mockResolvedValue({} as never);
    increment.mockResolvedValue(undefined as never);
  });

  it("creates only one ticket when history creation runs concurrently", async () => {
    const call = makeCall();
    const ticket = { id: 901 } as Ticket;
    callFindByPk.mockImplementation(async () => call);
    ticketCreate.mockResolvedValue(ticket);
    trackingCreate.mockResolvedValue({} as TicketTraking);

    const [first, second] = await Promise.all([
      startVoiceHistory(call),
      startVoiceHistory(call)
    ]);

    expect(first.ticketId).toBe(901);
    expect(second.ticketId).toBe(901);
    expect(ticketCreate).toHaveBeenCalledTimes(1);
    expect(trackingCreate).toHaveBeenCalledTimes(1);
    expect(trackingCreate).toHaveBeenCalledWith(
      expect.not.objectContaining({ waitTime: expect.anything() }),
      expect.anything()
    );
    expect(createMessage).toHaveBeenCalledTimes(2);
    expect(increment).toHaveBeenCalledTimes(2);
  });

  it("closes the ticket and close counter only once", async () => {
    const call = makeCall();
    Object.assign(call, {
      ticketId: 901,
      state: "ended",
      endedAt: new Date("2026-09-03T12:01:05Z"),
      durationSeconds: 60
    });
    const ticket = {
      id: 901,
      companyId: 1,
      queueId: 2,
      userId: 10,
      status: "open",
      update: jest.fn(async values => Object.assign(ticket, values))
    } as unknown as Ticket;
    const tracking = {
      update: jest.fn().mockResolvedValue(undefined)
    } as unknown as TicketTraking;
    ticketFindOne.mockImplementation(async () => ticket);
    ticketFindByPk.mockImplementation(async () => ticket);
    trackingFindOne.mockResolvedValueOnce(tracking).mockResolvedValue(null);
    showTicket.mockResolvedValue(ticket);

    await Promise.all([finishVoiceHistory(call), finishVoiceHistory(call)]);

    expect(ticket.status).toBe("closed");
    expect(tracking.update).toHaveBeenCalledTimes(1);
    expect(tracking.update).toHaveBeenCalledWith(
      expect.not.objectContaining({ serviceTime: expect.anything() }),
      expect.anything()
    );
    expect(increment).toHaveBeenCalledTimes(1);
    expect(createMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        messageData: expect.objectContaining({
          id: "voice-77-summary",
          mediaType: "voice_call",
          body: "📞 Ligação finalizada • 01:00"
        })
      })
    );
  });
});
